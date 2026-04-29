import { useEffect, useState, useRef, useCallback } from 'react'
import { Check, Settings, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type InquiryType = 'Retail' | 'Wholesale' | 'Influencer' | 'Collab' | 'Distributor' | 'Not sure'
type PreferredContact = 'WhatsApp' | 'Email' | 'Phone'

interface CardFile { file: File; preview: string }

const INQUIRY_TYPES: InquiryType[] = ['Retail', 'Wholesale', 'Influencer', 'Collab', 'Distributor', 'Not sure']
const CONTACT_TYPES: PreferredContact[] = ['WhatsApp', 'Email', 'Phone']

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      minHeight: 48, padding: '10px 18px', borderRadius: 6, flex: 1,
      border: `1px solid ${selected ? '#FF8000' : '#2A2A2A'}`,
      background: selected ? '#FF8000' : '#1A1A1A',
      color: selected ? '#000' : '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

function Field({ label, value, onChange, type = 'text', autoFocus = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; autoFocus?: boolean; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        autoFocus={autoFocus} autoComplete="off" placeholder={placeholder}
        style={{ display: 'block', width: '100%', minHeight: 52, padding: '14px 16px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 6, color: '#fff', fontSize: 16, outline: 'none' }}
        onFocus={e => (e.target.style.borderColor = '#FF8000')}
        onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
    </div>
  )
}

function SuccessFlash({ name, onDone }: { name: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0A0A', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,128,0,0.12)', border: '2px solid #FF8000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Check size={36} color="#FF8000" strokeWidth={2.5} />
      </div>
      <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '0.05em' }}>SAVED</p>
      <p style={{ fontSize: 16, color: '#9A9A9A', margin: 0 }}>{name}</p>
    </div>
  )
}

export default function CapturePage() {
  const { teamUser, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [activeEvent, setActiveEvent] = useState('')
  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName]       = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [preferred, setPreferred]     = useState<PreferredContact>('WhatsApp')
  const [inquiry, setInquiry]         = useState<InquiryType | null>(null)
  const [notes, setNotes]             = useState('')
  const [cards, setCards]             = useState<CardFile[]>([])
  const [uploading, setUploading]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [saved, setSaved]             = useState<string | null>(null)

  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('tradeshow_settings').select('value').eq('key', 'active_event').single()
      .then(({ data }) => setActiveEvent(data?.value ?? 'Tradeshow'))
  }, [])

  const reset = useCallback(() => {
    setFirstName(''); setLastName(''); setEmail(''); setPhone('')
    setPreferred('WhatsApp'); setInquiry(null); setNotes(''); setCards([]); setError(''); setSaved(null)
  }, [])

  function addFiles(files: FileList | null) {
    if (!files) return
    const newCards = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 3 - cards.length)
      .map(file => ({ file, preview: URL.createObjectURL(file) }))
    setCards(prev => [...prev, ...newCards].slice(0, 3))
  }

  async function uploadCard(cf: CardFile): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const ext = cf.file.name.split('.').pop() ?? 'jpg'
    const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error: e } = await supabase.storage.from('tradeshow-cards').upload(path, cf.file, { contentType: cf.file.type })
    if (e) return null
    return supabase.storage.from('tradeshow-cards').getPublicUrl(data.path).data.publicUrl
  }

  async function handleSave() {
    setError('')
    if (!firstName.trim()) { setError('First name is required'); return }
    if (!email.trim() && !phone.trim() && cards.length === 0) {
      setError('Add email, phone, or a business card photo'); return
    }
    setSubmitting(true)
    let cardUrls: string[] = []
    if (cards.length > 0) { setUploading(true); cardUrls = (await Promise.all(cards.map(uploadCard))).filter(Boolean) as string[]; setUploading(false) }

    const tags = [activeEvent, ...(inquiry && inquiry !== 'Not sure' ? [inquiry] : []), `Captured by ${teamUser?.display_name ?? 'Team'}`]
    const { data: { session } } = await supabase.auth.getSession()

    const { error: dbErr } = await supabase.from('tradeshow_captures').insert({
      first_name: firstName.trim(), last_name: lastName.trim() || null,
      email: email.trim() || null, phone: phone.trim() || null,
      preferred_contact: preferred, inquiry_type: inquiry ?? null,
      notes: notes.trim() || null,
      business_card_urls: cardUrls.length ? cardUrls : null,
      tags, event_tag: activeEvent,
      captured_by_name: teamUser?.display_name ?? null,
      captured_by_team_user_id: teamUser?.id ?? null,
      captured_by_auth_uid: session?.user?.id ?? null,
    })

    setSubmitting(false)
    if (dbErr) { setError(dbErr.message); return }
    setSaved(firstName.trim())
  }

  if (saved) return <SuccessFlash name={saved} onDone={reset} />

  return (
    <div style={{ minHeight: '100dvh', background: '#0A0A0A', color: '#fff' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0A0A0A', borderBottom: '1px solid #1A1A1A', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '0.05em' }}>
          SHISHA<span style={{ color: '#FF8000' }}>X</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/list')} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', display: 'flex' }}>
            <List size={18} />
          </button>
          {isAdmin && (
            <button onClick={() => navigate('/settings')} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', display: 'flex' }}>
              <Settings size={18} />
            </button>
          )}
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FF8000', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
            {teamUser?.display_name?.charAt(0)?.toUpperCase() ?? 'T'}
          </div>
        </div>
      </div>

      {/* Event strip */}
      <div style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '8px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FF8000' }}>
        EVENT: {activeEvent || '…'}
      </div>

      {/* Form */}
      <div style={{ padding: '24px 20px 48px', maxWidth: 480, margin: '0 auto' }}>
        <Field label="First Name *" value={firstName} onChange={setFirstName} autoFocus />
        <Field label="Last Name" value={lastName} onChange={setLastName} />
        <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="they@example.com" />
        <Field label="WhatsApp / Phone" value={phone} onChange={setPhone} type="tel" placeholder="+1 555 000 0000" />

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }}>Preferred Contact</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {CONTACT_TYPES.map(c => <Pill key={c} label={c} selected={preferred === c} onClick={() => setPreferred(c)} />)}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }}>Inquiry Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INQUIRY_TYPES.map(t => <Pill key={t} label={t} selected={inquiry === t} onClick={() => setInquiry(inquiry === t ? null : t)} />)}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Lounge name, city, what they liked, follow-up details."
            style={{ display: 'block', width: '100%', padding: '14px 16px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 6, color: '#fff', fontSize: 15, resize: 'vertical', outline: 'none', minHeight: 100 }}
            onFocus={e => (e.target.style.borderColor = '#FF8000')}
            onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
        </div>

        {/* Business card */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A9A9A', marginBottom: 8 }}>Business Card Photo</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: cards.length ? 12 : 0 }}>
            {['📷 TAKE PHOTO', '🖼 UPLOAD'].map((label, i) => (
              <button key={i} type="button" onClick={() => [cameraRef, galleryRef][i].current?.click()} disabled={cards.length >= 3}
                style={{ flex: 1, minHeight: 52, borderRadius: 6, border: '1px solid #2A2A2A', background: '#1A1A1A', color: cards.length >= 3 ? '#555' : '#fff', fontWeight: 700, fontSize: 13, cursor: cards.length >= 3 ? 'not-allowed' : 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          {cards.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {cards.map((c, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={c.preview} alt="card" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid #2A2A2A', display: 'block' }} />
                  <button type="button" onClick={() => setCards(p => p.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: '#F82629', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 6, background: 'rgba(248,38,41,0.08)', border: '1px solid rgba(248,38,41,0.3)', fontSize: 14, color: '#fca5a5' }}>{error}</div>}

        <button type="button" onClick={handleSave} disabled={submitting} style={{ display: 'block', width: '100%', minHeight: 56, borderRadius: 6, background: submitting ? '#555' : '#FF8000', border: 'none', color: '#000', fontWeight: 900, fontSize: 15, letterSpacing: '0.08em', cursor: submitting ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'UPLOADING…' : submitting ? 'SAVING…' : 'SAVE CONTACT'}
        </button>
      </div>
    </div>
  )
}
