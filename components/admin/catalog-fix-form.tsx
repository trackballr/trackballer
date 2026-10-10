"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { AdminSaveBar } from "@/components/admin/admin-save-bar"
import { PlayerSearchPicker } from "@/components/admin/player-search-picker"
import { PlayerAvatar } from "@/components/player-avatar"
import { OptionMenuSelect } from "@/components/ui/option-menu-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { SearchCombobox } from "@/components/ui/search-combobox"
import {
  fixPlayerCatalog,
  getPlayerCatalogEdit,
} from "@/lib/admin/actions/catalog-fix"
import { teamsToComboboxOptions } from "@/lib/search/combobox-options"
import type { BrowseClubOption, PlayerListItem } from "@/lib/search/types"

type CatalogFixFormProps = {
  clubOptions: BrowseClubOption[]
  positions: string[]
}

function parseFmBaseRating(raw: string): number | null | "invalid" {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 1 || n > 100 || !Number.isInteger(n)) return "invalid"
  return n
}

export function CatalogFixForm({ clubOptions, positions }: CatalogFixFormProps) {
  const router = useRouter()
  const clubComboboxOptions = teamsToComboboxOptions(clubOptions)
  const [player, setPlayer] = useState<PlayerListItem | null>(null)
  const [name, setName] = useState("")
  const [firstname, setFirstname] = useState("")
  const [lastname, setLastname] = useState("")
  const [fmBaseRating, setFmBaseRating] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [clubTeamId, setClubTeamId] = useState<string | null>(null)
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  /** Everything this form reports is a problem except the "Saved." confirmation. */
  const messageIsError = message != null && message !== "Saved."
  const [pending, startTransition] = useTransition()

  function selectPlayer(p: PlayerListItem) {
    setPlayer(p)
    setMessage(null)
    startTransition(async () => {
      const result = await getPlayerCatalogEdit(p.id)
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      const d = result.data
      setName(d.name)
      setFirstname(d.firstname ?? "")
      setLastname(d.lastname ?? "")
      setFmBaseRating(d.fmBaseRating != null ? String(d.fmBaseRating) : "")
      setPhotoUrl(d.photoUrl ?? "")
      setClubTeamId(d.clubTeamId != null ? String(d.clubTeamId) : null)
      setPrimaryPosition(d.primaryPosition ?? "")
    })
  }

  function save() {
    if (!player) {
      setMessage("Select a player first.")
      return
    }

    const fmParsed = parseFmBaseRating(fmBaseRating)
    if (fmParsed === "invalid") {
      setMessage("Overall rating must be a whole number between 1 and 100, or leave empty.")
      return
    }

    startTransition(async () => {
      const result = await fixPlayerCatalog({
        playerId: player.id,
        name,
        firstname,
        lastname,
        photoUrl,
        fmBaseRating: fmParsed,
        clubTeamId:
          clubTeamId != null ? Number.parseInt(clubTeamId, 10) : null,
        primaryPosition: primaryPosition || null,
      })
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setMessage("Saved.")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Find a player"
          description={
            player ? `Editing ${player.displayName} (#${player.id}).` : "Search, then pick the player to fix."
          }
        />
        <PanelBody className="pt-2">
          <PlayerSearchPicker label="Player search" onSelect={selectPlayer} disabled={pending} />
        </PanelBody>
      </Panel>

      {player ? (
        <>
          <Panel>
            <PanelHeader title="Name" description="How the player is shown across the site." />
            <PanelBody className="grid gap-4 pt-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="catalog-firstname" className="text-sm font-medium">
                  First name
                </label>
                <Input
                  id="catalog-firstname"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  disabled={pending}
                  autoComplete="off"
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="catalog-lastname" className="text-sm font-medium">
                  Last name
                </label>
                <Input
                  id="catalog-lastname"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  disabled={pending}
                  autoComplete="off"
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="catalog-name" className="text-sm font-medium">
                  Catalog name
                </label>
                <Input
                  id="catalog-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={pending}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  The short name. Shown on pitches and cards, and wherever first and last name
                  are not both set.
                </p>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Club, position and rating" />
            <PanelBody className="grid gap-4 pt-3 sm:grid-cols-2">
              <SearchCombobox
                options={clubComboboxOptions}
                valueId={clubTeamId}
                onValueIdChange={setClubTeamId}
                label="Club"
                placeholder="Search club…"
                emptyMessage="No clubs found."
                disabled={pending}
              />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-position">Position</Label>
                <OptionMenuSelect
                  value={primaryPosition}
                  onValueChange={setPrimaryPosition}
                  disabled={pending}
                  groups={[
                    {
                      options: [
                        { value: "", label: "Not set" },
                        ...positions.map((pos) => ({ value: pos, label: pos })),
                      ],
                    },
                  ]}
                  ariaLabel="Position"
                  placeholder="Not set"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="catalog-fm" className="text-sm font-medium">
                  Overall rating
                </label>
                <Input
                  id="catalog-fm"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={fmBaseRating}
                  onChange={(e) => setFmBaseRating(e.target.value)}
                  placeholder="e.g. 88"
                  disabled={pending}
                  className="h-10 sm:max-w-40"
                />
                <p className="text-xs text-muted-foreground">
                  The base rating shown until the player has 10 fan ratings. Leave empty to
                  clear.
                </p>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Photo" />
            <PanelBody className="flex items-center gap-4 pt-3">
              <PlayerAvatar
                name={name || player.displayName}
                photoUrl={photoUrl.trim() || null}
                size="lg"
                className="size-14 shrink-0 rounded-full"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label htmlFor="catalog-photo" className="text-sm font-medium">
                  Photo URL
                </label>
                <Input
                  id="catalog-photo"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://…"
                  disabled={pending}
                  className="h-10"
                />
              </div>
            </PanelBody>
          </Panel>

          <AdminSaveBar
            status={message ?? `Editing ${player.displayName}.`}
            error={messageIsError}
            canSave
            pending={pending}
            saveLabel="Save changes"
            onSave={save}
          />
        </>
      ) : message ? (
        <p className="text-sm text-destructive" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
