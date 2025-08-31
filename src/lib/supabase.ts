import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// 환경 변수 검증 및 기본값 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 환경 변수가 설정되지 않은 경우 경고 출력
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('[SUPABASE] 환경변수가 설정되지 않았습니다. 기본값을 사용합니다.')
  console.warn('[SUPABASE] .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.')
}

console.log('[SUPABASE] URL:', supabaseUrl)
console.log('[SUPABASE] Anon Key prefix:', supabaseAnonKey?.slice(0, 20) + '...')

// 전역 브라우저 클라이언트 인스턴스 (모듈 레벨에서 생성)
let globalBrowserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// 브라우저 환경에서만 클라이언트 생성
const createBrowserClientInstance = () => {
  // 이미 존재하면 기존 인스턴스 반환
  if (globalBrowserClient) {
    return globalBrowserClient
  }
  
  // 브라우저 환경이 아니면 에러
  if (typeof window === 'undefined') {
    throw new Error('createClientComponentClient can only be called in browser environment')
  }
  
  // 새 인스턴스 생성
  globalBrowserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true }
  })
  
  console.log('[SUPABASE] Global browser client created')
  return globalBrowserClient
}

export const createClientComponentClient = createBrowserClientInstance

// 기존 코드와의 호환성을 위한 supabase export (더미 객체)
export const supabase = null as never

// 서버 사이드용 클라이언트 (싱글톤)
let serverClient: ReturnType<typeof createClient<Database>> | null = null
export const createServerComponentClient = () => {
  if (!serverClient) {
    serverClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('[SUPABASE] Server client created')
  }
  return serverClient
}

// 서버 액션용 클라이언트 (싱글톤)
let actionClient: ReturnType<typeof createClient> | null = null
export const createActionClient = () => {
  if (!actionClient) {
    actionClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('[SUPABASE] Action client created')
  }
  return actionClient
}

// 타입 정의
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          start_at: string;
          end_at: string;
          price_cents: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          order_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          start_at: string;
          end_at: string;
          price_cents: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          order_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          start_at?: string;
          end_at?: string;
          price_cents?: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          order_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          payment_key: string;
          order_id: string;
          booking_id: string;
          amount: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
          method: string | null;
          receipt_url: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payment_key: string;
          order_id: string;
          booking_id: string;
          amount: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'failed';
          method?: string | null;
          receipt_url?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payment_key?: string;
          order_id?: string;
          booking_id?: string;
          amount?: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'failed';
          method?: string | null;
          receipt_url?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      consultants: {
        Row: {
          id: string;
          name: string;
          email: string;
          specialty: string;
          hourly_rate: number;
          timezone: string;
          available_hours: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          specialty?: string;
          hourly_rate: number;
          timezone?: string;
          available_hours?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          specialty?: string;
          hourly_rate?: number;
          timezone?: string;
          available_hours?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
