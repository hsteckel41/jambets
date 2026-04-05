'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'

export function ProfileImageEdit({ currentImage }: { currentImage?: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(currentImage ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: url.trim() || null }),
    })
    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      setError('Could not save. Try again.')
    }
    setLoading(false)
  }

  return (
    <>
      {/* Edit button — sits on top of avatar */}
      <button
        onClick={() => setOpen(true)}
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7C3AED] border-2 border-[#0C0A07] flex items-center justify-center hover:bg-[#6D28D9] transition-colors"
        aria-label="Edit profile photo"
      >
        <Camera className="w-3 h-3 text-white" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-lg bg-[#131110] border-t border-white/10 rounded-t-2xl p-6 space-y-4">
            <h2 className="text-base font-bold">Edit Profile Photo</h2>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">Photo URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-photo-url.com/photo.jpg"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
                autoFocus
              />
              <p className="text-[11px] text-white/25">Paste a direct image URL. Leave blank to remove your photo.</p>
            </div>
            {error && <p className="text-xs text-[#F43F5E]">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #10B981)' }}
              >
                {loading ? 'Saving…' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
