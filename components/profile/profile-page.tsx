import { ProfileHeader } from "@/components/profile/profile-header"
import { RecentCommentsList } from "@/components/profile/recent-comments-list"
import { RecentRatingsList } from "@/components/profile/recent-ratings-list"
import { SettingsForm } from "@/components/settings/settings-form"
import { Panel, PanelFooterLink, PanelHeader } from "@/components/ui/panel"
import type { OnboardingOptions } from "@/lib/onboarding/types"
import type { ProfilePageData } from "@/lib/profile/types"

type ProfilePageProps = {
  data: ProfilePageData
  /** Owner only — renders the settings panels beside the activity column. */
  teamOptions?: OnboardingOptions
}

export function ProfilePage({ data, teamOptions }: ProfilePageProps) {
  const { profile, stats, recentRatings, recentComments, isOwner } = data
  const base = profile.username ? `/u/${profile.username}` : null
  const showSettings = isOwner && teamOptions != null

  const ratingsPanel = (
    <Panel>
      <PanelHeader title="Recent ratings" />
      <RecentRatingsList ratings={recentRatings} />
      {base && recentRatings.length > 0 ? (
        <PanelFooterLink href={`${base}/ratings`}>All ratings</PanelFooterLink>
      ) : (
        <div className="h-2" />
      )}
    </Panel>
  )

  const commentsPanel = (
    <Panel>
      <PanelHeader title="Recent comments" />
      <RecentCommentsList
        comments={recentComments}
        historyHref={base ? `${base}/comments` : null}
      />
      {base && recentComments.length > 0 ? (
        <PanelFooterLink href={`${base}/comments`}>All comments</PanelFooterLink>
      ) : (
        <div className="h-2" />
      )}
    </Panel>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <ProfileHeader profile={profile} stats={stats} />

      {showSettings ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start">
          <div className="min-w-0">
            <SettingsForm profile={profile} teamOptions={teamOptions} />
          </div>
          <aside className="space-y-6 lg:sticky lg:top-20">
            {ratingsPanel}
            {commentsPanel}
          </aside>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {ratingsPanel}
          {commentsPanel}
        </div>
      )}
    </div>
  )
}
