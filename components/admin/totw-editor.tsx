"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"

import { FormationPitchEditor } from "@/components/admin/formation-pitch-editor"
import {
  FormationSelect,
  playerToSlotAssignment,
  type SlotAssignment,
} from "@/components/admin/formation-pitch-picker"
import { PlayerSearchPicker } from "@/components/admin/player-search-picker"
import { OptionMenuSelect } from "@/components/ui/option-menu-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import {
  featureTeamOfTheStage,
  publishTeamOfTheStage,
  unfeatureTeamOfTheStage,
} from "@/lib/admin/actions/totw"
import type { TotwEditorCopy } from "@/lib/admin/totw-copy"
import {
  carryAssignmentsToFormation,
  countFilledSlots,
  formationSlotKeys,
  getFormationTemplate,
  swapSlotAssignments,
  type FormationId,
} from "@/lib/admin/formation-slots"
import type { TotwDraft } from "@/lib/admin/totw-types"
import { formatLeagueRoundLabel } from "@/lib/league/round-label"
import type { PlayerListItem } from "@/lib/search/types"

type RoundOption = { id: number; name: string }

type TotwEditorProps = {
  seasonId: number
  seasonLabel: string
  rounds: RoundOption[]
  publishedDrafts: TotwDraft[]
  featuredTotwId: number | null
  copy: TotwEditorCopy
  leagueSlug?: string
}

function draftToState(draft: TotwDraft | undefined, defaultTitle: string) {
  if (!draft) {
    return {
      totwId: null as number | null,
      title: defaultTitle,
      formation: "4-3-3" as FormationId,
      assignments: {} as Record<string, SlotAssignment | undefined>,
    }
  }
  return {
    totwId: draft.id,
    title: draft.title,
    formation: draft.formation,
    assignments: { ...draft.assignments },
  }
}

function formatRoundLabel(name: string): string {
  return formatLeagueRoundLabel(name) ?? name
}

export function TotwEditor({
  seasonId,
  seasonLabel,
  rounds,
  publishedDrafts,
  featuredTotwId: initialFeaturedTotwId,
  copy,
  leagueSlug,
}: TotwEditorProps) {
  const router = useRouter()
  const defaultRoundId = rounds[0] ? String(rounds[0].id) : ""

  const draftsByRound = useMemo(() => {
    const map = new Map<number, TotwDraft>()
    for (const draft of publishedDrafts) {
      map.set(draft.roundId, draft)
    }
    return map
  }, [publishedDrafts])

  const [roundId, setRoundId] = useState(defaultRoundId)
  const [totwId, setTotwId] = useState<number | null>(null)
  const [featuredTotwId, setFeaturedTotwId] = useState(initialFeaturedTotwId)
  const [formation, setFormation] = useState<FormationId>("4-3-3")
  const [title, setTitle] = useState(copy.defaultTitle)
  const [assignments, setAssignments] = useState<
    Record<string, SlotAssignment | undefined>
  >({})
  const [activeSlot, setActiveSlot] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const loadRound = useCallback(
    (nextRoundId: string) => {
      const numericRoundId = nextRoundId ? Number(nextRoundId) : null
      if (!numericRoundId) return

      const draft = draftsByRound.get(numericRoundId)
      const next = draftToState(draft, copy.defaultTitle)
      setTotwId(next.totwId)
      setTitle(next.title)
      setFormation(next.formation)
      setAssignments(next.assignments)
      setActiveSlot(null)
      setMessage(draft ? copy.loadedRoundMessage : null)
    },
    [copy.defaultTitle, copy.loadedRoundMessage, draftsByRound],
  )

  const numericRoundId = roundId ? Number(roundId) : null
  const currentDraft = numericRoundId ? draftsByRound.get(numericRoundId) : undefined
  const isPublished = Boolean(currentDraft?.id ?? totwId)
  const isLiveOnSite = totwId != null && featuredTotwId === totwId

  const slotKeys = useMemo(() => formationSlotKeys(formation), [formation])
  const filledCount = countFilledSlots(slotKeys, assignments)
  const allFilled = filledCount === 11
  const canPublish = Boolean(roundId) && allFilled && !pending
  const canFeature = Boolean(totwId) && isPublished && !pending && !isLiveOnSite

  function handleRoundChange(nextRoundId: string) {
    setRoundId(nextRoundId)
  }

  useEffect(() => {
    loadRound(roundId)
  }, [roundId, loadRound])

  useEffect(() => {
    setFeaturedTotwId(initialFeaturedTotwId)
  }, [initialFeaturedTotwId])

  function slotLabel(key: string): string {
    return getFormationTemplate(formation).slots.find((slot) => slot.key === key)?.label ?? key
  }

  function onFormationChange(next: FormationId) {
    if (next === formation) return
    const hadPlayers = filledCount > 0
    setAssignments((prev) => carryAssignmentsToFormation(prev, formation, next))
    setFormation(next)
    setActiveSlot(null)
    setMessage(
      hadPlayers
        ? "Formation changed — players kept. Drag to move anyone who is out of place."
        : null,
    )
  }

  /** Drag one player onto another position: they swap (or move into an empty slot). */
  function moveSlot(fromKey: string, toKey: string) {
    const moving = assignments[fromKey]
    if (!moving) return
    const other = assignments[toKey]
    setAssignments((prev) => swapSlotAssignments(prev, fromKey, toKey))
    setActiveSlot(null)
    setMessage(
      other
        ? `Swapped ${moving.catalogName} (${slotLabel(fromKey)}) with ${other.catalogName} (${slotLabel(toKey)}).`
        : `Moved ${moving.catalogName} to ${slotLabel(toKey)}.`,
    )
  }

  function clearActiveSlot() {
    if (!activeSlot) return
    setAssignments((prev) => ({ ...prev, [activeSlot]: undefined }))
    setMessage(`Cleared ${slotLabel(activeSlot)}.`)
    setActiveSlot(null)
  }

  function assignPlayer(player: PlayerListItem) {
    if (!activeSlot) {
      setMessage("Choose a position on the pitch first.")
      return
    }
    if (!slotKeys.includes(activeSlot)) return

    const taken = Object.entries(assignments).some(
      ([key, a]) => key !== activeSlot && a?.playerId === player.id,
    )
    if (taken) {
      setMessage("Player already assigned to another slot.")
      return
    }

    setAssignments((prev) => ({
      ...prev,
      [activeSlot]: playerToSlotAssignment(player),
    }))
    setMessage(null)
    setActiveSlot(null)
  }

  function publish() {
    if (!roundId) {
      setMessage(copy.selectRoundError)
      return
    }

    const slots: Record<string, number> = {}
    for (const key of slotKeys) {
      const a = assignments[key]
      if (!a) {
        setMessage("Fill all eleven slots before publishing.")
        return
      }
      slots[key] = a.playerId
    }

    startTransition(async () => {
      const result = await publishTeamOfTheStage({
        seasonId,
        roundId: Number(roundId),
        title: title.trim(),
        formation,
        slots,
        leagueSlug,
      })
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setTotwId(result.id)
      setMessage(totwId ? copy.publishSuccessUpdate : copy.publishSuccessNew)
      router.refresh()
    })
  }

  function setLiveOnSite() {
    if (!totwId) return

    startTransition(async () => {
      const result = await featureTeamOfTheStage({ seasonId, totwId, leagueSlug })
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setFeaturedTotwId(totwId)
      setMessage(copy.featureSuccess)
      router.refresh()
    })
  }

  function hideFromSite() {
    if (!totwId) return

    startTransition(async () => {
      const result = await unfeatureTeamOfTheStage({ seasonId, totwId, leagueSlug })
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setFeaturedTotwId((current) => (current === totwId ? null : current))
      setMessage(copy.hideSuccess)
      router.refresh()
    })
  }

  if (rounds.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyRoundsMessage}</p>
  }

  const activeAssigned = activeSlot ? assignments[activeSlot] : undefined

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader title={seasonLabel} description={copy.intro} />
        <PanelBody className="grid gap-4 pt-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="totw-round" className="text-sm font-medium">
              {copy.roundFieldLabel}
            </label>
            <OptionMenuSelect
              value={roundId}
              onValueChange={handleRoundChange}
              disabled={pending}
              groups={[
                {
                  options: rounds.map((round) => {
                    const draft = draftsByRound.get(round.id)
                    const suffix = draft
                      ? featuredTotwId === draft.id
                        ? " · live on site"
                        : " · saved"
                      : ""
                    return {
                      value: String(round.id),
                      label: `${formatRoundLabel(round.name)}${suffix}`,
                    }
                  }),
                },
              ]}
              ariaLabel={copy.roundAriaLabel}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="totw-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="totw-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="totw-formation" className="text-sm font-medium">
              Formation
            </label>
            <FormationSelect value={formation} onChange={onFormationChange} />
          </div>
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start">
        <Panel>
          <PanelHeader
            title="Lineup"
            description="Tap a position to fill it from search. Drag a player onto another position to swap them."
            action={
              <span className="text-sm font-semibold tabular-nums">
                {filledCount}
                <span className="text-muted-foreground"> / 11</span>
              </span>
            }
          />
          <PanelBody className="pt-3">
            <FormationPitchEditor
              formation={formation}
              assignments={assignments}
              activeSlot={activeSlot}
              disabled={pending}
              onMove={moveSlot}
              onSlotClick={(key) => {
                setActiveSlot(key)
                setMessage(`Selected ${slotLabel(key)} — pick a player from search.`)
              }}
            />
          </PanelBody>
        </Panel>

        <aside className="space-y-6 lg:sticky lg:top-20">
          <Panel>
            <PanelHeader
              title={activeSlot ? `Player for ${slotLabel(activeSlot)}` : "Pick a player"}
              description={activeSlot ? undefined : "Choose a position on the pitch first."}
            />
            <PanelBody className="space-y-3 pt-2">
              <PlayerSearchPicker
                label="Player search"
                onSelect={assignPlayer}
                disabled={pending || !activeSlot}
              />
              {activeAssigned ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={clearActiveSlot}
                  className="bg-card text-destructive hover:text-destructive"
                >
                  Remove {activeAssigned.catalogName}
                </Button>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Publish"
              description={
                allFilled
                  ? "All eleven positions are filled."
                  : "Fill all eleven positions to publish."
              }
            />
            <PanelBody className="space-y-3 pt-2">
              {message ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {message}
                </p>
              ) : null}

              <Button
                type="button"
                disabled={!canPublish}
                onClick={publish}
                className="h-10 w-full"
              >
                {pending ? "Saving…" : totwId ? "Update published team" : "Publish team"}
              </Button>

              {isLiveOnSite ? (
                <>
                  <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-foreground">
                    {copy.liveBadge}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={hideFromSite}
                    className="h-10 w-full bg-card"
                  >
                    {copy.hideCta}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canFeature}
                  onClick={setLiveOnSite}
                  className="h-10 w-full bg-card"
                >
                  {copy.featureCta}
                </Button>
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
