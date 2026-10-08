/** Smooth scroll to a comment row after the thread tab has mounted. */
export function scrollCommentIntoView(commentId: number) {
  window.setTimeout(() => {
    document.getElementById(`comment-${commentId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }, 60)
}
