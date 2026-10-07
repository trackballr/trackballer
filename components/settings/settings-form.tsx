"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { AvatarSourcePicker } from "@/components/profile/avatar-source-picker"
import { ConnectXButton } from "@/components/profile/connect-x-button"
import { PlasticFanDialog } from "@/components/profile/plastic-fan-dialog"
import { ProfilePublicLink } from "@/components/profile/profile-public-link"
import { ProfileSignOutButton } from "@/components/profile/profile-sign-out-button"
import { CountryDropdown } from "@/components/onboarding/country-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Panel, PanelHeader, PanelList } from "@/components/ui/panel"
import { SearchCombobox } from "@/components/ui/search-combobox"
import type { OnboardingOptions } from "@/lib/onboarding/types"
import { updateProfile } from "@/lib/profile/actions/update-profile"
import type { AvatarSource } from "@/lib/profile/display-avatar"
import { defaultAvatarSource } from "@/lib/profile/display-avatar"
import type { ProfileView } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

/** Label and hint on the left, control on the right; stacks on phones. */
function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-center sm:gap-8">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium">{label}</p>
        )}
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

type SettingsFormProps = {
  profile: ProfileView
  teamOptions: OnboardingOptions
}

export function SettingsForm({ profile, teamOptions }: SettingsFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const initialAvatarSource =
    profile.avatarSource ??
    defaultAvatarSource({
      google_avatar_url: profile.googleAvatarUrl,
      x_avatar_url: profile.xAvatarUrl,
    })
  const initialClubId = profile.favouriteClub?.id ?? null
  const initialNationalTeamId = profile.favouriteNationalTeam?.id ?? null

  const [displayName, setDisplayName] = useState(profile.displayName)
  const [countryCode, setCountryCode] = useState(profile.countryCode)
  const [favouriteClubId, setFavouriteClubId] = useState<number | null>(initialClubId)
  const [favouriteNationalTeamId, setFavouriteNationalTeamId] = useState<number | null>(
    initialNationalTeamId,
  )
  const [instagramHandle, setInstagramHandle] = useState(profile.instagramHandle ?? "")
  const [avatarSource, setAvatarSource] = useState<AvatarSource>(initialAvatarSource)

  const showAvatarPicker = Boolean(profile.googleAvatarUrl && profile.xAvatarUrl)

  const [plasticOpen, setPlasticOpen] = useState(false)
  const [plasticConfirmed, setPlasticConfirmed] = useState(false)

  const dirty =
    displayName !== profile.displayName ||
    countryCode !== profile.countryCode ||
    favouriteClubId !== initialClubId ||
    favouriteNationalTeamId !== initialNationalTeamId ||
    instagramHandle !== (profile.instagramHandle ?? "") ||
    (showAvatarPicker && avatarSource !== initialAvatarSource)

  function submit(plasticFanConfirmed: boolean) {
    if (!countryCode) {
      setMessage({ text: "Choose your country of origin.", error: true })
      return
    }

    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        countryCode,
        favouriteClubId,
        favouriteNationalTeamId,
        instagramHandle,
        plasticFanConfirmed,
        avatarSource: showAvatarPicker ? avatarSource : undefined,
      })

      if (!result.ok) {
        setMessage({ text: result.error, error: true })
        return
      }

      setMessage({ text: "Changes saved.", error: false })
      setPlasticConfirmed(false)
      router.refresh()
    })
  }

  function onSaveClick() {
    setMessage(null)
    const clubChanged = initialClubId != null && favouriteClubId !== initialClubId

    if (clubChanged && !plasticConfirmed) {
      setPlasticOpen(true)
      return
    }

    submit(plasticConfirmed)
  }

  function onPlasticConfirm() {
    setPlasticConfirmed(true)
    setPlasticOpen(false)
    submit(true)
  }

  function onPlasticCancel() {
    setPlasticOpen(false)
    setFavouriteClubId(initialClubId)
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader title="Profile" description="How you appear next to your ratings and comments." />
        <PanelList className="pb-1">
          {profile.username ? (
            <SettingsRow label="Username" description="Usernames can't be changed.">
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </SettingsRow>
          ) : null}

          <SettingsRow label="Display name" htmlFor="settings-display-name">
            <Input
              id="settings-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={pending}
              className="h-10"
            />
          </SettingsRow>

          <SettingsRow label="Country of origin" htmlFor="settings-country">
            <CountryDropdown
              id="settings-country"
              valueAlpha2={countryCode}
              onChange={(country) => setCountryCode(country.alpha2.toUpperCase())}
              disabled={pending}
              placeholder="Select your country"
            />
          </SettingsRow>

          {showAvatarPicker ? (
            <SettingsRow
              label="Profile photo"
              description="Which connected account's photo to show."
            >
              <AvatarSourcePicker
                googleAvatarUrl={profile.googleAvatarUrl!}
                xAvatarUrl={profile.xAvatarUrl!}
                value={avatarSource}
                onChange={setAvatarSource}
                disabled={pending}
              />
            </SettingsRow>
          ) : null}
        </PanelList>
      </Panel>

      <Panel>
        <PanelHeader title="Teams" description="Shown as crests beside your name." />
        <PanelList className="pb-1">
          <SettingsRow label="Favourite club" description="Switching clubs asks you to confirm.">
            <SearchCombobox
              label="Favourite club"
              hideLabel
              placeholder="Search clubs…"
              options={teamOptions.clubs}
              valueId={favouriteClubId != null ? String(favouriteClubId) : null}
              onValueIdChange={(id) => setFavouriteClubId(id != null ? Number(id) : null)}
              disabled={pending}
            />
          </SettingsRow>

          <SettingsRow label="Favourite national team">
            <SearchCombobox
              label="Favourite national team"
              hideLabel
              placeholder="Search countries…"
              options={teamOptions.nationalTeams}
              valueId={
                favouriteNationalTeamId != null ? String(favouriteNationalTeamId) : null
              }
              onValueIdChange={(id) =>
                setFavouriteNationalTeamId(id != null ? Number(id) : null)
              }
              disabled={pending}
            />
          </SettingsRow>
        </PanelList>
      </Panel>

      <Panel>
        <PanelHeader title="Connected accounts" />
        <PanelList className="pb-1">
          <SettingsRow
            label="X (Twitter)"
            description="Verifies your handle and unlocks your X photo."
          >
            <ConnectXButton
              twitterHandle={profile.twitterHandle}
              twitterVerifiedAt={profile.twitterVerifiedAt}
            />
          </SettingsRow>

          <SettingsRow
            label="Instagram"
            description="Not verified — only add a handle you own."
            htmlFor="settings-instagram"
          >
            <Input
              id="settings-instagram"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@handle or profile URL"
              disabled={pending}
              className="h-10"
            />
          </SettingsRow>
        </PanelList>
      </Panel>

      {profile.username ? (
        <Panel>
          <PanelHeader title="Public profile" />
          <PanelList className="pb-1">
            <SettingsRow
              label="Share link"
              description="Others see your ratings and comments, not these settings."
            >
              <ProfilePublicLink username={profile.username} />
            </SettingsRow>
          </PanelList>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Account" />
        <PanelList className="pb-1">
          <SettingsRow label="Sign out" description="Sign out of Trackballr on this device.">
            <ProfileSignOutButton />
          </SettingsRow>
        </PanelList>
      </Panel>

      <div className="sticky bottom-4 z-10">
        <Panel className="flex items-center justify-between gap-3 px-5 py-3 shadow-sm">
          <p
            role="status"
            className={cn(
              "min-w-0 truncate text-sm",
              message?.error ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {message?.error
              ? message.text
              : dirty
                ? "You have unsaved changes."
                : (message?.text ?? "All changes saved.")}
          </p>
          <Button
            type="button"
            disabled={pending || !dirty}
            onClick={onSaveClick}
            className="h-10 shrink-0 px-5"
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </Panel>
      </div>

      <PlasticFanDialog
        open={plasticOpen}
        onOpenChange={setPlasticOpen}
        onConfirm={onPlasticConfirm}
        onCancel={onPlasticCancel}
      />
    </div>
  )
}
