export const metadata = {
  title: "Community Guidelines | Trackballr",
  description: "How to be a good fan on Trackballr.",
}

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="h-display mb-8 text-4xl">Community Guidelines</h1>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-lg text-foreground font-medium">
          Trackballr is a platform for football fans to rate, debate, and celebrate the beautiful game. To keep the community enjoyable for everyone, we ask that you follow these simple rules.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Attack the Ball, Not the Player (or the Fan)</h2>
        <p>
          Passionate debate is the core of football, but abuse is not. We have a zero-tolerance policy for:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Hate speech:</strong> Racism, sexism, homophobia, or discrimination of any kind.</li>
          <li><strong>Harassment:</strong> Bullying, targeted attacks, or telling other users to harm themselves.</li>
          <li><strong>Threats:</strong> Wishing physical harm on players, managers, referees, or other fans.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Keep It About Football</h2>
        <p>
          You are here to rate players and discuss matches. Please keep your comments relevant to the game. Do not use the platform for political campaigning, religious proselytizing, or off-topic arguments.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. No Spam or Self-Promotion</h2>
        <p>
          Trackballr is not a billboard. Do not post links to your own website, YouTube channel, or affiliate products in the comments. Automated botting, spamming the same comment repeatedly, or artificially manipulating ratings will result in an immediate ban.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Rate Honestly</h2>
        <p>
          The value of Trackballr comes from genuine fan consensus. While bias is a natural part of football, please try to rate players based on their actual performance on the pitch. Coordinated campaigns to review-bomb a player artificially ruin the experience for everyone.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How We Enforce the Rules</h2>
        <p>
          Our moderation team actively reviews comments and user reports. If you violate these guidelines, we may:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Soft-delete your comments.</li>
          <li>Remove your ratings from the community aggregate.</li>
          <li>Permanently ban your account from the platform.</li>
        </ul>
        <p>
          Moderation decisions are made at our sole discretion to protect the health of the community.
        </p>

        <hr className="my-8 border-border" />
        <p className="text-sm">
          Thank you for helping us build the best place to talk football.
        </p>
      </div>
    </div>
  )
}
