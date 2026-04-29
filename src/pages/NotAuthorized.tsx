import { useAuth } from '@/contexts/AuthContext'

export default function NotAuthorized() {
  const { signOut, user } = useAuth()
  return (
    <div style={{
      minHeight: '100dvh', background: '#0A0A0A', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      <p style={{ fontSize: 32, marginBottom: 16 }}>🚫</p>
      <p style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>Not authorized</p>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
        {user?.email} is not on the ShishaX team list.
      </p>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 32 }}>Ask Kris to invite you.</p>
      <button onClick={signOut} style={{
        background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6,
        color: '#888', padding: '10px 20px', cursor: 'pointer', fontSize: 14,
      }}>Sign out</button>
    </div>
  )
}
