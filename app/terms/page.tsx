import Link from "next/link"

export const metadata = {
  title: "Terms of Service | Trackballr",
  description: "The rules for using Trackballr.",
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="h-display mb-8 text-4xl">Terms of Service</h1>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>
          Welcome to Trackballr. By using our website and services, you agree to these Terms of Service. Please read them carefully.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Your Account</h2>
        <p>
          To rate players and post comments, you must create an account using a supported social login provider. You are responsible for the activity that happens under your account. We reserve the right to suspend or terminate accounts that violate these terms or our <Link href="/guidelines" className="text-primary hover:underline">Community Guidelines</Link>.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. User-Generated Content</h2>
        <p>
          You retain ownership of the ratings and comments you post on Trackballr. However, by posting content, you grant us a worldwide, royalty-free license to display, distribute, and use that content across the platform (for example, to calculate aggregate player scores or show trending comments).
        </p>
        <p>
          You agree not to post content that is illegal, abusive, harassing, spam, or otherwise violates our Community Guidelines. We have the right (but not the obligation) to remove any content at our sole discretion.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Football Data and Accuracy</h2>
        <p>
          The match fixtures, lineups, scores, and player statistics on Trackballr are provided by a third-party service (API-Football). While we strive for accuracy, we cannot guarantee that all match data is perfectly real-time or error-free. The platform is for entertainment and informational purposes only.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Acceptable Use</h2>
        <p>When using Trackballr, you agree not to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use bots, scrapers, or automated scripts to submit ratings or comments.</li>
          <li>Attempt to manipulate player or match ratings artificially.</li>
          <li>Reverse-engineer or attack the platform's infrastructure.</li>
          <li>Impersonate other users, players, or official entities.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Disclaimer of Warranties</h2>
        <p>
          Trackballr is provided "as is" without any warranties, express or implied. We do not guarantee that the site will always be available, secure, or free from bugs.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Trackballr and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Changes to the Terms</h2>
        <p>
          We may update these terms from time to time. Your continued use of the platform after changes are posted constitutes your acceptance of the new terms.
        </p>

        <hr className="my-8 border-border" />
        <p className="text-sm">
          Last updated: June 2026.
        </p>
      </div>
    </div>
  )
}
