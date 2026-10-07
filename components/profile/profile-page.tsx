import { ProfileHeader } from "@/components/profile/profile-header"
import { RecentCommentsList } from "@/components/profile/recent-comments-list"
import { RecentRatingsList } from "@/components/profile/recent-ratings-list"
import { Panel, PanelFooterLink, PanelHeader } from "@/components/ui/panel"
import type { ProfilePageData } from "@/lib/profile/types"

type ProfilePageProps = {
  data: ProfilePageData
}

/** Same layout for your own profile and someone else's — editing lives in /settings. */
export function ProfilePage({ data }: ProfilePageProps) {
  const { profile, stats, recentRatings, recentComments, isOwner } = data
  const base = profile.username ? `/u/${profile.username}` : null

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <ProfileHeader profile={profile} stats={stats} isOwner={isOwner} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Panel>
          <PanelHeader title="Recent ratings" />
          <RecentRatingsList ratings={recentRatings} />
          {base && recentRatings.length > 0 ? (
            <PanelFooterLink href={`${base}/ratings`}>All ratings</PanelFooterLink>
          ) : (
            <div className="h-2" />
          )}
        </Panel>

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
      </div>
    </div>
  )
}
