'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// Invitation Letter Component with Wax Seal
function InvitationLetter() {
  const [isOpen, setIsOpen] = useState(false)
  const [sealBroken, setSealBroken] = useState(false)

  const handleClick = () => {
    if (!sealBroken) {
      setSealBroken(true)
      setTimeout(() => setIsOpen(true), 600)
    }
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Header text */}
      <p className="text-white/30 text-sm mb-8 tracking-wide">
        Break the seal to accept your invitation
      </p>

      {/* The letter */}
      <div
        className={cn(
          "relative cursor-pointer transition-all duration-700 ease-out",
          isOpen ? "scale-100" : "hover:scale-[1.02]"
        )}
        onClick={handleClick}
      >
        {/* Letter background */}
        <div
          className={cn(
            "relative bg-gradient-to-br from-neutral-100 via-white to-neutral-50 rounded-lg shadow-2xl transition-all duration-700",
            isOpen ? "p-8" : "p-6"
          )}
          style={{
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Content when opened */}
          <div
            className={cn(
              "relative transition-all duration-500",
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="flex justify-center mb-4">
              <Eye className="w-6 h-6 text-neutral-400" />
            </div>

            <div className="text-center space-y-3">
              <p className="text-lg text-neutral-800 font-medium">
                You&apos;re Invited
              </p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Join thousands discovering the best nightlife.
              </p>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-black text-white text-sm rounded-full hover:bg-neutral-800 transition-colors"
              >
                <span>Accept</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-xs text-neutral-400 pt-2">
                Already a member?{' '}
                <Link href="/login" className="underline hover:text-neutral-600">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Closed state */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300",
              isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            <p className="text-neutral-500 text-sm">Your invitation</p>
            <p className="text-neutral-400 text-xs mt-1">Click to open</p>
          </div>
        </div>

        {/* Wax seal */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 transition-all duration-500 ease-out",
            isOpen ? "-bottom-2 scale-50 opacity-0" : "-bottom-5 scale-100 opacity-100",
            sealBroken && !isOpen && "animate-seal-break"
          )}
        >
          <div
            className={cn(
              "relative w-16 h-16 rounded-full transition-all duration-300",
              sealBroken ? "scale-110" : "hover:scale-105"
            )}
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, #7c3aed 0%, #5b21b6 50%, #3b0764 100%)',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="absolute inset-1.5 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(ellipse at 40% 40%, #8b5cf6 0%, #6d28d9 70%)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <Eye className="w-5 h-5 text-purple-950/50" />
            </div>
          </div>
        </div>

        {/* Seal pieces */}
        {sealBroken && (
          <>
            <div className="absolute left-1/2 -bottom-5 w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-800 animate-piece-1" />
            <div className="absolute left-1/2 -bottom-5 w-3 h-3 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 animate-piece-2" />
            <div className="absolute left-1/2 -bottom-5 w-2 h-2 rounded-full bg-gradient-to-br from-violet-400 to-purple-700 animate-piece-3" />
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes seal-break {
          0% { transform: translateX(-50%) scale(1) rotate(0deg); }
          30% { transform: translateX(-50%) scale(1.2) rotate(-8deg); }
          60% { transform: translateX(-50%) scale(0.8) rotate(5deg); }
          100% { transform: translateX(-50%) scale(0) rotate(15deg); opacity: 0; }
        }
        .animate-seal-break {
          animation: seal-break 0.5s ease-out forwards;
        }
        @keyframes piece-1 {
          0% { transform: translate(-50%, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-80px, -50px) rotate(-180deg); opacity: 0; }
        }
        .animate-piece-1 {
          animation: piece-1 0.5s ease-out forwards;
        }
        @keyframes piece-2 {
          0% { transform: translate(-50%, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(60px, -30px) rotate(200deg); opacity: 0; }
        }
        .animate-piece-2 {
          animation: piece-2 0.5s ease-out forwards;
        }
        @keyframes piece-3 {
          0% { transform: translate(-50%, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-40px, 40px) rotate(-120deg); opacity: 0; }
        }
        .animate-piece-3 {
          animation: piece-3 0.45s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

const emptySubscribe = () => () => {}

export default function LandingPage() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full-screen hero with atmospheric background */}
      <div className="relative min-h-screen flex flex-col">
        {/* Animated gradient background - simulates club lighting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Base dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0a14] to-black" />

          {/* Subtle ambient color washes */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(120, 50, 180, 0.25) 0%, transparent 50%)',
              animation: 'pulse1 15s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0 opacity-15"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 80% 60%, rgba(180, 70, 50, 0.2) 0%, transparent 50%)',
              animation: 'pulse2 20s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: 'radial-gradient(ellipse 50% 50% at 50% 80%, rgba(100, 60, 150, 0.2) 0%, transparent 50%)',
              animation: 'pulse3 25s ease-in-out infinite',
            }}
          />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)]" />
        </div>

        {/* Navigation - minimal */}
        <nav className="relative z-20 px-6 sm:px-10 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-white/70" />
              <span className="text-xs tracking-[0.2em] text-white/50 uppercase hidden sm:block">
                Eyes Wide Shut
              </span>
            </Link>

            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Main content - centered with vertical button stack like Dream */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
          {/* Logo/Brand mark */}
          <div
            className={cn(
              "mb-8 opacity-0 transition-all duration-1000",
              mounted && "opacity-100"
            )}
          >
            <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm bg-white/5">
              <Eye className="w-7 h-7 text-white/80" />
            </div>
          </div>

          {/* Main title */}
          <h1
            className={cn(
              "text-center opacity-0 translate-y-4 transition-all duration-1000 delay-200",
              mounted && "opacity-100 translate-y-0"
            )}
          >
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[0.15em] text-white uppercase">
              Eyes Wide Shut
            </span>
          </h1>

          {/* Tagline */}
          <p
            className={cn(
              "mt-6 text-white/40 text-sm sm:text-base tracking-wide text-center max-w-md",
              "opacity-0 translate-y-4 transition-all duration-1000 delay-400",
              mounted && "opacity-100 translate-y-0"
            )}
          >
            Discover venues. See the vibe. Go VIP.
          </p>

          {/* Vertical button stack - Dream Hospitality style */}
          <div
            className={cn(
              "mt-12 flex flex-col items-center gap-4 w-full max-w-xs",
              "opacity-0 translate-y-4 transition-all duration-1000 delay-600",
              mounted && "opacity-100 translate-y-0"
            )}
          >
            <Link
              href="/signup"
              className="w-full py-4 px-8 text-center text-sm tracking-[0.15em] uppercase border border-white/40 rounded-full hover:bg-white hover:text-black transition-all duration-300"
            >
              Get Started
            </Link>

            <Link
              href="/explore"
              className="w-full py-4 px-8 text-center text-sm tracking-[0.15em] uppercase border border-white/40 rounded-full hover:bg-white hover:text-black transition-all duration-300"
            >
              Explore Venues
            </Link>

            <Link
              href="/venue-portal/apply"
              className="w-full py-4 px-8 text-center text-sm tracking-[0.15em] uppercase border border-white/40 rounded-full hover:bg-white hover:text-black transition-all duration-300"
            >
              List Your Venue
            </Link>
          </div>
        </div>

        {/* Bottom info */}
        <div
          className={cn(
            "relative z-10 pb-8 px-6",
            "opacity-0 transition-all duration-1000 delay-1000",
            mounted && "opacity-100"
          )}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <div className="flex items-center gap-6">
              <span>50+ Venues</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>10K+ Users</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Live Tonight</span>
            </div>
            <span>© {new Date().getFullYear()} Eyes Wide Shut</span>
          </div>
        </div>
      </div>

      {/* Second section - Quick features with atmospheric fade */}
      <div className="relative py-32 px-6">
        {/* Gradient transition from hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0812] to-[#0d0a14]" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
            {[
              {
                title: 'Discover',
                desc: 'Find the hottest spots in your city, updated every night.',
              },
              {
                title: 'Connect',
                desc: 'See crowd levels and what\'s happening before you go.',
              },
              {
                title: 'Experience',
                desc: 'Skip lines, book tables, access exclusive events.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group"
              >
                <h3 className="text-lg tracking-[0.1em] text-white/80 uppercase mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-white/30 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invitation section */}
      <div className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[#0d0a14]" />

        {/* Subtle glow */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(120, 60, 160, 0.2) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-lg mx-auto text-center">
          <InvitationLetter />
        </div>
      </div>

      {/* Minimal footer */}
      <footer className="relative py-8 px-6 border-t border-white/5 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white/30" />
            <span className="text-xs tracking-[0.1em] text-white/30 uppercase">
              Eyes Wide Shut
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/20">
            <Link href="/venue-portal/apply" className="hover:text-white/50 transition-colors">
              For Venues
            </Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white/50 transition-colors">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-white/50 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>

      {/* Keyframe animations - subtle */}
      <style jsx global>{`
        @keyframes pulse1 {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.25; }
        }
        @keyframes pulse2 {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.2; }
        }
        @keyframes pulse3 {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  )
}
