"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import { parseCommentHashFromLocation } from "@/lib/comment/parse-comment-hash"

import { CommentThread } from "@/components/comment/comment-thread"
import { MatchCommentTicker } from "@/components/match/match-comment-ticker"
import { MatchFansPodium } from "@/components/match/match-fans-podium"
import { MatchLineupsTab } from "@/components/match/match-lineups-tab"
import { MatchMobileActionBar } from "@/components/match/match-mobile-action-bar"
import {
  MatchRatingProgress,
  ratingProgressState,
} from "@/components/match/match-rating-progress"
import {
  MatchTrendingCarousel,
  MatchTrendingPanel,
  useTrendingVotes,
} from "@/components/match/match-trending-comments"
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
  trendingVotes: Record<number, 1 | -1>
  onRateAll: () => void
  onPlayerClick: (player: MatchLineupPlayer) => void
  /** Match header; receives the top-comment strip for its bottom edge. */
  renderHero: (footer: ReactNode) => ReactNode
  /** Shown between the tab bar and the tab content (e.g. penalty shootout). */
  afterHero?: ReactNode
}

/** Underline tabs on the sticky bar under the match header card. */
const matchTabTriggerClass =
  "h-11 flex-none rounded-none border-0 px-1 text-sm font-semibold text-muted-foreground hover:text-foreground data-active:text-foreground after:rounded-t-full after:bg-primary group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[3px]"

const SEEN_EVENT = "trackballr:comments-seen"

function seenKey(fixtureId: number) {
  return `trackballr:match-comments-seen:${fixtureId}`
}

function readSeen(fixtureId: number): string | null {
  try {
    return window.localStorage.getItem(seenKey(fixtureId))
  } catch {
    return null
  }
}

function writeSeen(fixtureId: number, count: number) {
  try {
    window.localStorage.setItem(seenKey(fixtureId), String(count))
    window.dispatchEvent(new Event(SEEN_EVENT))
  } catch {
    // Private mode or blocked storage: the dot just never shows.
  }
}

function subscribeSeen(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(SEEN_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/** Dot on Comments when the match has more top-level comments than at the last visit. */
function useNewCommentsDot(fixtureId: number, count: number) {
  const seen = useSyncExternalStore(
    subscribeSeen,
    () => readSeen(fixtureId),
    () => null,
  )

  useEffect(() => {
    // First visit: remember today's count so the next visit can compare.
    if (readSeen(fixtureId) == null) writeSeen(fixtureId, count)
  }, [fixtureId, count])

  // Stable identity: callers list this in effect dependencies.
  const markSeen = useCallback(() => writeSeen(fixtureId, count), [fixtureId, count])

  return { hasNew: seen != null && count > Number(seen), markSeen }
}

type CommentsFocus = { commentId: number | null; compose: boolean; nonce: number }

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
  trendingVotes,
  onRateAll,
  onPlayerClick,
  renderHero,
  afterHero,
}: MatchPageTabsProps) {
  const [activeTab, setActiveTab] = useState("lineups")
  const [focus, setFocus] = useState<CommentsFocus | null>(null)
  const commentCount = commentsPage?.totalParentCount ?? 0
  const votes = useTrendingVotes(trendingComments, trendingVotes, isLoggedIn)
  const progress = ratingProgressState(
    detail.rateableQueue,
    isLoggedIn,
    detail.ratingsUnlocked,
  )
  const { hasNew, markSeen } = useNewCommentsDot(fixture.id, commentCount)

  function handleTabChange(value: string) {
    setActiveTab(value)
    if (value === "comments") markSeen()
  }

  const openComments = useCallback(
    (commentId: number | null = null, compose = false) => {
      setActiveTab("comments")
      markSeen()
      setFocus({ commentId, compose, nonce: Date.now() })
    },
    [markSeen],
  )

  // A #comment link opens the Comments tab once on arrival and again only when
  // the link itself changes. It must not re-run on ordinary updates, or the
  // Lineups tab could never be opened while the link is still in the address bar.
  const openCommentsRef = useRef(openComments)
  useEffect(() => {
    openCommentsRef.current = openComments
  }, [openComments])

  useEffect(() => {
    function openFromHash() {
      const commentId = parseCommentHashFromLocation()
      if (commentId != null) openCommentsRef.current(commentId)
    }
    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    return () => window.removeEventListener("hashchange", openFromHash)
  }, [])

  // After switching tabs, bring the requested comment (or the composer) into view.
  useEffect(() => {
    if (!focus) return
    const id = window.setTimeout(() => {
      const target = focus.commentId
        ? document.getElementById(`comment-${focus.commentId}`)
        : document.getElementById("comments-section")
      target?.scrollIntoView({
        behavior: "smooth",
        block: focus.commentId ? "center" : "start",
      })
      if (focus.compose) {
        document
          .querySelector<HTMLTextAreaElement>("#comments-section textarea")
          ?.focus({ preventScroll: true })
      }
    }, 60)
    return () => window.clearTimeout(id)
  }, [focus])

  const ticker = (
    <MatchCommentTicker
      comments={trendingComments}
      votes={votes}
      onOpen={(commentId) => openComments(commentId)}
      onCompose={() => openComments(null, true)}
    />
  )

  const podium = <MatchFansPodium payload={topRated} fixture={fixture} />
  const progressCard = <MatchRatingProgress state={progress} onContinue={onRateAll} />

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-0">
      <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <div className="min-w-0">
          {renderHero(ticker)}

          <div className="sticky top-[var(--site-header-h,3.5rem)] z-30 rounded-b-lg border border-t-0 border-border bg-card px-4 md:px-6">
            <TabsList
              variant="line"
              className="w-full justify-start gap-6 p-0 group-data-horizontal/tabs:h-auto"
            >
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
                {hasNew ? (
                  <span
                    className="size-2 rounded-full bg-primary"
                    aria-label="New comments"
                  />
                ) : null}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="lg:hidden">
            <MatchTrendingCarousel
              comments={trendingComments}
              votes={votes}
              currentUserId={currentUserId}
              onOpen={(commentId) => openComments(commentId)}
              onSeeAll={() => openComments()}
            />
          </div>

          <div className="mt-4">
            {afterHero}

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

              {/* Phones and tablets: progress (tablet only, phones get the bottom bar) + podium. */}
              <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-start lg:hidden">
                <div className="hidden md:block">{progressCard}</div>
                {podium}
              </div>
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
                  highlightId={focus?.commentId ?? null}
                />
              )}
            </TabsContent>
          </div>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <MatchTrendingPanel
            comments={trendingComments}
            votes={votes}
            currentUserId={currentUserId}
            onOpen={(commentId) => openComments(commentId)}
            onSeeAll={() => openComments(null, trendingComments.length === 0)}
          />
          {progressCard}
          {podium}
        </aside>
      </div>

      <MatchMobileActionBar
        state={progress}
        commentCount={commentCount}
        hasNewComments={hasNew}
        onRate={onRateAll}
        onComments={() => openComments()}
      />
    </Tabs>
  )
}
