import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSend() {
    setError('')
    if (!email.trim()) { setError('Enter your email'); return }
    setLoading(true)
    const { error: e } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (e) { setError(e.message); return }
    setSent(true)
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0A0A0A', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
    }}>
      <p style={{ fontWeight: 900, fontSize: 22, letterSpacing: '0.05em', marginBottom: 8, color: '#fff' }}>
        SHISHA<span style={{ color: '#FF8000' }}>X</span> TEAM
      </p>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 40 }}>team.shishax.com</p>

      {sent ? (
        <div style={{
          background: '#111', border: '1px solid #1A1A1A', borderRadius: 8,
          padding: '32px 24px', maxWidth: 360, width: '100%', textAlign: 'center',
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>📬</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 8 }}>Check your email</p>
          <p style={{ fontSize: 14, color: '#666' }}>We sent a magic link to <strong style={{ color: '#888' }}>{email}</strong>. Click it to sign in.</p>
        </div>
      ) : (
        <div style={{ maxWidth: 360, width: '100%' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8,
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="you@shishax.com"
              autoFocus
              style={{
                display: 'block', width: '100%', padding: '14px 16px',
                background: '#111', border: '1px solid #2A2A2A', borderRadius: 6,
                color: '#fff', fontSize: 16, outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = '#FF8000')}
              onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#fca5a5', marginBottom: 12 }}>{error}</p>
          )}

          <button onClick={handleSend} disabled={loading} style={{
            display: 'block', width: '100%', minHeight: 52, borderRadius: 6,
            background: loading ? '#555' : '#FF8000', border: 'none',
            color: '#000', fontWeight: 900, fontSize: 15, letterSpacing: '0.08em',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'SENDING…' : 'SEND MAGIC LINK'}
          </button>
          <p style={{ fontSize: 12, color: '#444', textAlign: 'center', marginTop: 16 }}>
            No password needed. You must be invited to access this app.
          </p>
        </div>
      )}
    </div>
  )
}
