"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"

import { CommentThread } from "@/components/comment/comment-thread"
import { MatchInsightsRow } from "@/components/match/match-insights-row"
import { MatchLineupsTab } from "@/components/match/match-lineups-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CommentsPageData } from "@/lib/comment/queries"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import type { MatchTopRatedPayload } from "@/lib/match/match-top-rated"
import type { MatchTrendingCommentCard } from "@/lib/match/match-trending-comments"
import type { MatchDetail, MatchLineupPlayer } from "@/lib/match/types"

type MatchPageTabsProps = {
  fixture: FixtureWithTeams
  detail: MatchDetail
  canRate: boolean
  ratingsLocked: boolean
  isLoggedIn: boolean
  commentsPage?: CommentsPageData
  currentUserId: string | null
  errorMessage: string | null
  topRated: MatchTopRatedPayload | null
  trendingComments: MatchTrendingCommentCard[]
  onRateAll: () => void
  onPlayerClick: (player: MatchLineupPlayer) => void
  /** Match header; receives the tab bar so it can sit inside the header card. */
  renderHero: (tabBar: ReactNode) => ReactNode
  /** Shown between the header and the tab content (e.g. penalty shootout). */
  afterHero?: ReactNode
}

/** Underline tabs flush with the bottom of the match header card. */
const matchTabTriggerClass =
  "h-11 flex-none rounded-none border-0 px-1 text-sm font-semibold text-muted-foreground hover:text-foreground data-active:text-foreground after:rounded-t-full after:bg-primary group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[3px]"

export function MatchPageTabs({
  fixture,
  detail,
  canRate,
  ratingsLocked,
  isLoggedIn,
  commentsPage,
  currentUserId,
  errorMessage,
  topRated,
  trendingComments,
  onRateAll,
  onPlayerClick,
  renderHero,
  afterHero,
}: MatchPageTabsProps) {
  const [activeTab, setActiveTab] = useState("lineups")
  const commentCount = commentsPage?.totalParentCount ?? 0
  const showRateAllFallback =
    topRated == null && canRate && detail.rateableQueue.length > 0

  function goToComments() {
    setActiveTab("comments")
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
      {renderHero(
        <TabsList variant="line" className="w-full justify-start gap-6 p-0 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="lineups" className={matchTabTriggerClass}>
            Lineups
          </TabsTrigger>
          <TabsTrigger value="comments" className={matchTabTriggerClass}>
            Comments
            {commentCount > 0 ? (
              <span className="text-xs font-medium text-muted-foreground">
                {commentCount}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>,
      )}

      {afterHero}

      <MatchInsightsRow
        topRated={topRated}
        trendingComments={trendingComments}
        currentUserId={currentUserId}
        canRate={canRate}
        showRateAllFallback={showRateAllFallback}
        onRateAll={onRateAll}
        onSeeAllComments={goToComments}
      />

      <TabsContent value="lineups" className="mt-0">
        {errorMessage && (
          <p className="mb-4 text-center text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        <MatchLineupsTab
          fixture={fixture}
          detail={detail}
          canRate={canRate}
          ratingsLocked={ratingsLocked}
          onPlayerClick={onPlayerClick}
        />
      </TabsContent>

      <TabsContent value="comments" className="mt-0">
        {!isLoggedIn && (
          <p className="mb-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{" "}
            to rate performances and join the discussion.
          </p>
        )}

        {isLoggedIn && !detail.ratingsUnlocked && (
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Ratings unlock when the match finishes.
          </p>
        )}

        {errorMessage && (
          <p className="mb-4 text-center text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        {commentsPage && (
          <CommentThread
            initialComments={commentsPage.comments}
            initialUserVotes={commentsPage.userVotes}
            totalParentCount={commentsPage.totalParentCount}
            initialParentHasMore={commentsPage.parentHasMore}
            initialParentNextCursor={commentsPage.parentNextCursor}
            initialReplyPagination={commentsPage.replyPagination}
            initialSort={commentsPage.initialSort}
            targetType="match"
            targetId={fixture.id}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
          />
        )}

        <p className="body-sm mt-6 text-center">
          <Link href="/world-cup" className="text-primary underline-offset-4 hover:underline">
            Back to World Cup
          </Link>
        </p>
      </TabsContent>
    </Tabs>
  )
}
