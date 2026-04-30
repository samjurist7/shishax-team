import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password.trim()) { setError('Enter email and password'); return }
    setLoading(true)
    const { error: e } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (e) { setError('Invalid email or password'); return }
    // AuthContext will handle redirect via session state
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', padding: '14px 16px',
    background: '#111', border: '1px solid #2A2A2A', borderRadius: 6,
    color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box',
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

      <div style={{ maxWidth: 360, width: '100%' }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="admin@shishax.com"
            autoFocus
            style={inp}
            onFocus={e => (e.target.style.borderColor = '#FF8000')}
            onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={inp}
            onFocus={e => (e.target.style.borderColor = '#FF8000')}
            onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#fca5a5', marginBottom: 12 }}>{error}</p>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          display: 'block', width: '100%', minHeight: 52, borderRadius: 6,
          background: loading ? '#555' : '#FF8000', border: 'none',
          color: '#000', fontWeight: 900, fontSize: 15, letterSpacing: '0.08em',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'SIGNING IN…' : 'SIGN IN'}
        </button>
      </div>
    </div>
  )
}
