'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  token: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signUp: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  
  // 클라이언트에서만 Supabase 클라이언트 생성
  useEffect(() => {
    try {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      setSupabase(client)
    } catch (err) {
      console.error('[AUTH] Supabase 클라이언트 생성 실패:', err)
      setError('Supabase 클라이언트를 초기화할 수 없습니다.')
    }
  }, [])

  useEffect(() => {
    // supabase 클라이언트가 없으면 초기화 중단
    if (!supabase) {
      return
    }

    // 초기 세션 가져오기 및 복구
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] 인증 초기화 시작')
        
        // Supabase에서 세션 확인
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[AUTH] Supabase 세션 확인:', session ? '있음' : '없음')
        
        if (session) {
          console.log('[AUTH] Supabase 세션으로 인증 상태 설정')
          setSession(session)
          setUser(session.user)
          
          // 로컬 스토리지에 저장
          localStorage.setItem('amiko_session', JSON.stringify({
            user: session.user,
            expires_at: session.expires_at
          }))
        } else {
          // Supabase 세션이 없으면 로컬 스토리지에서 복구 시도
          const savedSession = localStorage.getItem('amiko_session')
          if (savedSession) {
            try {
              const sessionData = JSON.parse(savedSession)
              const now = Math.floor(Date.now() / 1000)
              
              if (sessionData.expires_at > now) {
                console.log('[AUTH] 로컬 세션으로 인증 상태 복구:', sessionData.user.email)
                setUser(sessionData.user)
                setSession({
                  user: sessionData.user,
                  expires_at: sessionData.expires_at
                } as Session)
                
                // Supabase에 세션 복구 시도 (선택사항)
                // 로컬 세션이 유효하면 이미 사용자 상태가 설정되어 있음
                console.log('[AUTH] 로컬 세션으로 인증 상태 복구 완료')
              } else {
                console.log('[AUTH] 로컬 세션 만료됨, 제거')
                localStorage.removeItem('amiko_session')
              }
            } catch (error) {
              console.error('[AUTH] 로컬 세션 파싱 오류:', error)
              localStorage.removeItem('amiko_session')
            }
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('[AUTH] 인증 초기화 실패:', error)
        setError('인증 초기화 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }

    initializeAuth()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('[AUTH] 인증 상태 변경:', event, session ? '세션 있음' : '세션 없음')
        
        if (session) {
          // 세션이 있으면 상태 업데이트 및 로컬 저장
          setSession(session)
          setUser(session.user)
          localStorage.setItem('amiko_session', JSON.stringify({
            user: session.user,
            expires_at: session.expires_at
          }))
          console.log('[AUTH] 세션을 로컬 스토리지에 저장')
        } else {
          // 세션이 없을 때는 로컬 상태도 초기화
          console.log('[AUTH] Supabase 세션 없음, 로컬 상태 초기화')
          setUser(null)
          setSession(null)
          localStorage.removeItem('amiko_session')
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    console.log('[AUTH] 로그인 시도:', { email, passwordLength: password.length });
    
    if (!supabase) {
      console.error('[AUTH] Supabase 클라이언트가 초기화되지 않음');
      return { error: new Error('Supabase 클라이언트가 초기화되지 않음') };
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[AUTH] 로그인 실패:', error);
        return { error };
      }
      
      console.log('[AUTH] 로그인 성공');
      
      // 세션 지속성 확인 및 강화
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('[AUTH] 세션 확인됨:', session.user.email)
        setSession(session)
        setUser(session.user)
        
        // 로컬 스토리지에 세션 저장
        localStorage.setItem('amiko_session', JSON.stringify({
          user: session.user,
          expires_at: session.expires_at
        }))
        
        console.log('[AUTH] 세션을 로컬 스토리지에 저장 완료')
        
        // 세션 지속성 강화를 위한 추가 설정
        try {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          })
          console.log('[AUTH] 세션 지속성 설정 완료')
        } catch (error) {
          console.error('[AUTH] 세션 지속성 설정 실패:', error)
          // 실패해도 로컬 세션은 유지
          console.log('[AUTH] 로컬 세션으로 인증 상태 유지')
        }
      } else {
        console.log('[AUTH] 세션을 가져올 수 없음, 로그인 실패로 간주')
      }
      
      return { error: null };
    } catch (err) {
      console.error('[AUTH] 로그인 예외 발생:', err);
      return { error: err };
    }
  }

  const signUp = async (email: string, password: string) => {
    console.log('[AUTH] 회원가입 시도:', { email, passwordLength: password.length });
    
    if (!supabase) {
      console.error('[AUTH] Supabase 클라이언트가 초기화되지 않음');
      return { error: new Error('Supabase 클라이언트가 초기화되지 않음') };
    }
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('[AUTH] 회원가입 실패:', error);
        return { error };
      }
      
      console.log('[AUTH] 회원가입 성공');
      return { error: null };
    } catch (err) {
      console.error('[AUTH] 회원가입 예외 발생:', err);
      return { error: err };
    }
  }

  const signOut = async () => {
    console.log('[AUTH] 로그아웃 시작')
    
    // Supabase 로그아웃 먼저 실행
    if (supabase) {
      try {
        await supabase.auth.signOut()
        console.log('[AUTH] Supabase 로그아웃 완료')
      } catch (error) {
        console.error('[AUTH] Supabase 로그아웃 오류:', error)
      }
    }
    
    // 사용자 상태 초기화
    setUser(null)
    setSession(null)
    setLoading(false)
    
    // 모든 스토리지 정리
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    
    console.log('[AUTH] 로그아웃 완료, 상태 초기화됨')
    
    // 페이지 새로고침으로 상태 완전 초기화
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  // 세션 복구 함수
  const refreshSession = async () => {
    if (!supabase) {
      console.error('[AUTH] Supabase 클라이언트가 초기화되지 않음');
      return false;
    }
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (session && !error) {
        setSession(session)
        setUser(session.user)
        localStorage.setItem('amiko_session', JSON.stringify({
          user: session.user,
          expires_at: session.expires_at
        }))
        console.log('[AUTH] 세션 새로고침 성공')
        return true
      } else {
        console.log('[AUTH] 세션 새로고침 실패:', error)
        return false
      }
    } catch (error) {
      console.error('[AUTH] 세션 새로고침 오류:', error)
      return false
    }
  }

  const value = {
    user,
    session,
    token: session?.access_token || null,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
