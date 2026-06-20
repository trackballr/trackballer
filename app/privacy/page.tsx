export const metadata = {
  title: "Privacy Policy | Trackballr",
  description: "How we collect, use, and protect your data.",
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="h-display mb-8 text-4xl">Privacy Policy</h1>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>
          Welcome to Trackballr. We believe in keeping things simple and transparent. This policy explains what data we collect, why we collect it, and the third-party services we use to run the platform.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
        <p>
          When you use Trackballr, we collect the following information:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-foreground">Authentication Data:</strong> We use social login (Google, X, Facebook, Apple). When you sign in, we receive your basic profile information (name, email address, and profile picture) from the provider. We do not receive or store your passwords.
          </li>
          <li>
            <strong className="text-foreground">User-Generated Content:</strong> Any ratings you submit, comments you post, upvotes/downvotes you make, and the favorite club/national team you select on your profile.
          </li>
          <li>
            <strong className="text-foreground">Usage Data:</strong> Basic analytics about how you interact with the site (pages visited, buttons clicked) to help us improve the platform.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use your data strictly to run and improve Trackballr:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>To create and manage your public profile.</li>
          <li>To calculate community player and match ratings.</li>
          <li>To display your comments and votes to other fans.</li>
          <li>To keep the platform secure and moderate abusive behavior.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Third-Party Services</h2>
        <p>We rely on a few trusted third-party services to keep the app running. Here is who they are and what they do:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-foreground">Supabase:</strong> Our secure database and authentication provider. They store your profile data, ratings, and comments, and handle the secure login process.
          </li>
          <li>
            <strong className="text-foreground">Vercel:</strong> Our hosting provider. They serve the website to your browser and provide basic, anonymized web analytics.
          </li>
          <li>
            <strong className="text-foreground">API-Football (api-sports.io):</strong> The provider of our match, player, and team data. <em>We do not share any of your personal data with API-Football.</em>
          </li>
          <li>
            <strong className="text-foreground">Social Auth Providers:</strong> Google, X (Twitter), Facebook, and Apple. If you use them to log in, they will know you signed into our app.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Cookies and Tracking</h2>
        <p>
          We use essential cookies to keep you logged in. We also use analytics cookies to understand site traffic, but only if you give us permission via our cookie consent banner. You can change your cookie preferences at any time.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Your Rights and Data Deletion</h2>
        <p>
          You have the right to access, update, or delete your personal information. If you would like to delete your account and all associated data (ratings, comments, profile), please contact us.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Changes to this Policy</h2>
        <p>
          We may update this policy occasionally as we add new features. If we make major changes, we will let you know via a notice on the site.
        </p>

        <hr className="my-8 border-border" />
        <p className="text-sm">
          Last updated: June 2026. For questions, please reach out to our support team.
        </p>
      </div>
    </div>
  )
}
