import { signIn } from '@/lib/auth'

export default function SignInPage() {
  return (
    <div className="min-h-dvh bg-[#09090B] flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.1) 0%, transparent 60%)' }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-4xl">🎸</span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">JamBets</h1>
          <p className="mt-2 text-white/40 text-sm">Call it before they play it.</p>
        </div>

        <div className="gradient-border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Welcome to the rail</h2>
            <p className="text-white/40 text-sm">Sign in to write lines, call sets, and settle scores.</p>
          </div>

          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/feed' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-xs text-white/25 text-center">
            By signing in you agree to settle your bets. Honor system. Don&apos;t be that person.
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          May your bets flow like a Dark Star.
        </p>
      </div>
    </div>
  )
}
