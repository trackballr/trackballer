export type TotwEditorCopy = {
  defaultTitle: string
  roundFieldLabel: string
  intro: string
  roundAriaLabel: string
  emptyRoundsMessage: string
  selectRoundError: string
  loadedRoundMessage: string
  publishSuccessNew: string
  publishSuccessUpdate: string
  featureSuccess: string
  hideSuccess: string
  liveBadge: string
  featureCta: string
  hideCta: string
}

export const LEAGUE_TOTW_COPY: TotwEditorCopy = {
  defaultTitle: "Team of the Week",
  roundFieldLabel: "Matchday",
  intro:
    "One lineup per matchday. Publish saves the XI; “Show on league page” picks which matchday fans see (only one live at a time).",
  roundAriaLabel: "Matchday",
  emptyRoundsMessage:
    "No matchdays in the catalog yet. Run fixture bootstrap for this league first.",
  selectRoundError: "Select a matchday first.",
  loadedRoundMessage: "Loaded saved lineup for this matchday — edit and publish to update.",
  publishSuccessNew: "Published. Use “Show on league page” when this matchday should go live.",
  publishSuccessUpdate:
    "Saved. Use “Show on league page” when this matchday should go live.",
  featureSuccess: "This matchday is now live on the league page.",
  hideSuccess: "Hidden from the league page.",
  liveBadge: "Live on league page",
  featureCta: "Show on league page",
  hideCta: "Hide from league page",
}
