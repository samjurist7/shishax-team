import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface TeamUser {
  id: string
  email: string
  display_name: string
  role: 'admin' | 'member'
  active: boolean
}

interface AuthContextType {
  session: Session | null
  user: User | null
  teamUser: TeamUser | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]     = useState<Session | null>(null)
  const [teamUser, setTeamUser]   = useState<TeamUser | null>(null)
  const [loading, setLoading]     = useState(true)

  async function loadTeamUser(uid: string) {
    try {
      const { data } = await Promise.race([
        supabase.from('team_users').select('*').eq('auth_user_id', uid).eq('active', true).single(),
        new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 5000)),
      ])
      setTeamUser(data as TeamUser | null)
      if (data) {
        void supabase.from('team_users').update({ last_seen_at: new Date().toISOString() }).eq('id', (data as TeamUser).id)
      }
    } catch {
      setTeamUser(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) await loadTeamUser(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) await loadTeamUser(session.user.id)
      else setTeamUser(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setTeamUser(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      teamUser,
      loading,
      isAdmin: teamUser?.role === 'admin',
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
