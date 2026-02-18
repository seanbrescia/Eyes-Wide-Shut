import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-dark">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-pink-600/8 rounded-full blur-3xl" />
      </div>

      <div className="text-center relative z-10">
        <h1 className="text-8xl font-bold neon-text text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like this page doesn&apos;t exist. It might have been moved or the link is incorrect.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="btn-neon px-6 py-2.5 rounded-xl text-sm font-semibold inline-block"
          >
            Go Home
          </Link>
          <Link
            href="/explore"
            className="glass-card px-6 py-2.5 rounded-xl text-sm font-semibold inline-block hover:border-primary/30 transition-colors"
          >
            Explore Events
          </Link>
        </div>
      </div>
    </div>
  )
}
