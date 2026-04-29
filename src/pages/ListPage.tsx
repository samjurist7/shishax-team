import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Capture {
  id: string; first_name: string; last_name: string | null
  email: string | null; phone: string | null; inquiry_type: string | null
  notes: string | null; event_tag: string | null
  business_card_urls: string[] | null; preferred_contact: string | null
  captured_by_name: string | null; created_at: string
}

const IQ_COLORS: Record<string, string> = {
  Wholesale: '#FF8000', Distributor: '#8B5CF6',
  Retail: '#3B82F6', Influencer: '#EC4899', Collab: '#10B981',
}

export default function ListPage() {
  const { isAdmin, user } = useAuth()
  const navigate = useNavigate()

  const [captures, setCaptures] = useState<Capture[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [myOnly, setMyOnly]     = useState(!isAdmin)
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('tradeshow_captures').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (myOnly || !isAdmin) q = q.eq('captured_by_auth_uid', user?.id ?? '')
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    const { data, count } = await q
    setCaptures((data as Capture[]) ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [myOnly, search, isAdmin, user?.id])

  useEffect(() => { void load() }, [load])

  return (
    <div style={{ minHeight: '100dvh', background: '#0A0A0A', color: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0A0A0A', borderBottom: '1px solid #1A1A1A', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          {isAdmin && !myOnly ? 'All Captures' : 'My Captures'} · {total}
        </span>
        <button onClick={load} disabled={loading} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div style={{ padding: '16px 20px', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, phone…"
              style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 10, paddingBottom: 10, background: '#111', border: '1px solid #2A2A2A', borderRadius: 6, color: '#fff', fontSize: 14, outline: 'none' }} />
          </div>
          {isAdmin && (
            <button onClick={() => setMyOnly(!myOnly)} style={{ padding: '10px 14px', borderRadius: 6, border: `1px solid ${myOnly ? '#2A2A2A' : '#FF8000'}`, background: myOnly ? '#111' : 'rgba(255,128,0,0.1)', color: myOnly ? '#888' : '#FF8000', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {myOnly ? 'Show All' : 'Mine Only'}
            </button>
          )}
        </div>

        {loading ? <p style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>Loading…</p>
          : captures.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>
              <p style={{ marginBottom: 12 }}>No captures yet.</p>
              <button onClick={() => navigate('/')} style={{ color: '#FF8000', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>Start capturing →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {captures.map(c => (
                <div key={c.id} style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 6, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: '0 0 4px' }}>
                        {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                      </p>
                      {c.email && <p style={{ fontSize: 13, color: '#888', margin: '0 0 2px' }}>{c.email}</p>}
                      {c.phone && <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{c.phone}</p>}
                    </div>
                    {c.inquiry_type && c.inquiry_type !== 'Not sure' && (
                      <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: `${IQ_COLORS[c.inquiry_type] ?? '#555'}22`, color: IQ_COLORS[c.inquiry_type] ?? '#888', border: `1px solid ${IQ_COLORS[c.inquiry_type] ?? '#555'}44` }}>
                        {c.inquiry_type}
                      </span>
                    )}
                  </div>
                  {c.notes && <p style={{ fontSize: 13, color: '#666', margin: '10px 0 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{c.notes}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(c.business_card_urls?.length ?? 0) > 0 && <span style={{ fontSize: 12, color: '#555' }}>📇 {c.business_card_urls!.length} card{c.business_card_urls!.length > 1 ? 's' : ''}</span>}
                    {!myOnly && c.captured_by_name && <span style={{ fontSize: 12, color: '#444' }}>by {c.captured_by_name}</span>}
                    <span style={{ fontSize: 12, color: '#333', marginLeft: 'auto' }}>
                      {new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
