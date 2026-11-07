/** Some imported names store the apostrophe as an HTML entity. */
export function personName(name: string): string {
  return name.replaceAll("&apos;", "\u2019").replaceAll("&#39;", "\u2019")
}
