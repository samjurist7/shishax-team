import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, UserPlus, Trash2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface TeamMember { id: string; email: string; display_name: string; role: string; active: boolean; last_seen_at: string | null }

export default function SettingsPage() {
  const { teamUser, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [members, setMembers]   = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteName, setInviteName]       = useState('')
  const [inviteRole, setInviteRole]       = useState<'member' | 'admin'>('member')
  const [inviting, setInviting]           = useState(false)
  const [toast, setToast]       = useState('')

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    supabase.from('tradeshow_settings').select('value').eq('key', 'active_event').single()
      .then(({ data }) => setEvent(data?.value ?? ''))
    loadMembers()
  }, [isAdmin, navigate])

  async function loadMembers() {
    const { data } = await supabase.from('team_users').select('*').eq('active', true).order('created_at')
    setMembers((data as TeamMember[]) ?? [])
  }

  function toast_(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function saveEvent() {
    setSaving(true)
    await supabase.from('tradeshow_settings').upsert({ key: 'active_event', value: event, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setSaving(false); toast_('Event saved ✓')
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) return
    setInviting(true)

    // Check if email already in team_users
    const { data: existing } = await supabase.from('team_users').select('id').eq('email', inviteEmail.trim().toLowerCase()).single()
    if (existing) { toast_('Already in team'); setInviting(false); return }

    // Insert into team_users (no auth_user_id yet — set on first login)
    const { error } = await supabase.from('team_users').insert({
      email: inviteEmail.trim().toLowerCase(),
      display_name: inviteName.trim() || inviteEmail.split('@')[0],
      role: inviteRole,
      invited_by: teamUser?.id ?? null,
      invited_at: new Date().toISOString(),
    })

    if (error) { toast_(error.message); setInviting(false); return }

    // Send magic link invite via Supabase admin (we use service role via edge function or direct call)
    // For now: user visits team.shishax.com and logs in with OTP — they'll be auto-matched by email
    toast_(`${inviteEmail} added. Tell them to go to team.shishax.com and sign in.`)
    setInviteEmail(''); setInviteName(''); setInviteRole('member')
    setInviting(false)
    loadMembers()
  }

  async function removeMember(id: string) {
    await supabase.from('team_users').update({ active: false }).eq('id', id)
    toast_('Removed'); loadMembers()
  }

  const inp: React.CSSProperties = { display: 'block', width: '100%', padding: '12px 14px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 6, color: '#fff', fontSize: 15, outline: 'none' }
  const lbl: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }

  return (
    <div style={{ minHeight: '100dvh', background: '#0A0A0A', color: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0A0A0A', borderBottom: '1px solid #1A1A1A', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>Settings</span>
        <button onClick={signOut} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 20px', fontSize: 14, color: '#fff', zIndex: 100, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Active event */}
        <div style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#FF8000', margin: '0 0 16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ACTIVE EVENT</p>
          <label style={lbl}>Event Name</label>
          <input value={event} onChange={e => setEvent(e.target.value)} placeholder="e.g. ShissaMesse 2026" style={{ ...inp, marginBottom: 12 }}
            onFocus={e => (e.target.style.borderColor = '#FF8000')} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
          <button onClick={saveEvent} disabled={saving || !event.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 6, border: 'none', background: event.trim() ? '#FF8000' : '#1A1A1A', color: event.trim() ? '#000' : '#555', fontWeight: 700, fontSize: 14, cursor: event.trim() ? 'pointer' : 'not-allowed' }}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Team members */}
        <div style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#FF8000', margin: '0 0 16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>TEAM MEMBERS</p>

          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1A1A1A' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', margin: 0 }}>{m.display_name}</p>
                <p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>{m.email} · {m.role}</p>
              </div>
              {m.id !== teamUser?.id && (
                <button onClick={() => removeMember(m.id)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {/* Invite */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', margin: '0 0 12px' }}>Invite Someone</p>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" style={{ ...inp, marginBottom: 8 }}
              onFocus={e => (e.target.style.borderColor = '#FF8000')} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
            <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Display name (e.g. Alex)" style={{ ...inp, marginBottom: 8 }}
              onFocus={e => (e.target.style.borderColor = '#FF8000')} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'member' | 'admin')} style={{ ...inp, marginBottom: 12 }}>
              <option value="member">Member (capture only)</option>
              <option value="admin">Admin (capture + settings)</option>
            </select>
            <button onClick={inviteMember} disabled={!inviteEmail.trim() || inviting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 6, border: 'none', background: inviteEmail.trim() ? '#FF8000' : '#1A1A1A', color: inviteEmail.trim() ? '#000' : '#555', fontWeight: 700, fontSize: 14, cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed' }}>
              <UserPlus size={14} /> {inviting ? 'Adding…' : 'Add to Team'}
            </button>
            <p style={{ fontSize: 12, color: '#444', marginTop: 8 }}>
              They sign in at team.shishax.com with their email — no password needed.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
