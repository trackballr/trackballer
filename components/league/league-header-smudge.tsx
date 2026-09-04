/** Soft white smudge over T5 banners — solid on the left, curved fade into brand colour. */
export function LeagueHeaderSmudge() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
    >
      <defs>
        <filter
          id="league-header-smudge"
          x="-8%"
          y="-40%"
          width="130%"
          height="180%"
        >
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter
          id="league-header-smudge-soft"
          x="-12%"
          y="-50%"
          width="140%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="3.6" />
        </filter>
      </defs>

      {/* Crisp patch behind crest + title */}
      <rect x="0" y="0" width="38" height="40" fill="#fff" />

      {/* Main curve — starts after the title, rises slightly to the right */}
      <path
        fill="#fff"
        filter="url(#league-header-smudge)"
        d="M0 0 H41 C49 3 46 18 54 40 H0 Z"
      />

      {/* Extra wisps so the edge reads as a smudge, not a hard wipe */}
      <ellipse
        cx="46"
        cy="8"
        rx="10"
        ry="14"
        fill="#fff"
        opacity="0.85"
        filter="url(#league-header-smudge-soft)"
      />
      <ellipse
        cx="49"
        cy="28"
        rx="11"
        ry="16"
        fill="#fff"
        opacity="0.7"
        filter="url(#league-header-smudge-soft)"
      />
      <ellipse
        cx="52"
        cy="40"
        rx="9"
        ry="12"
        fill="#fff"
        opacity="0.55"
        filter="url(#league-header-smudge)"
      />
    </svg>
  )
}
