import { supabase } from '../supabase'

export interface Profile {
  id: string
  email?: string
  phone?: string
  full_name?: string
  avatar_url?: string
  school_code?: string
  school_verified?: boolean
  nationality?: string
  language_level?: string
  created_at: string
  updated_at: string
}

export interface CreateProfileData {
  email?: string
  phone?: string
  full_name?: string
  avatar_url?: string
  school_code?: string
  nationality?: string
  language_level?: string
}

export interface UpdateProfileData {
  full_name?: string
  avatar_url?: string
  school_code?: string
  nationality?: string
  language_level?: string
}

/**
 * 사용자 프로필 생성
 */
export async function createProfile(userId: string, data: CreateProfileData): Promise<Profile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          ...data,
          school_verified: data.school_code ? true : false, // 학교 코드가 있으면 자동으로 verified
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('프로필 생성 오류:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('프로필 생성 중 예외 발생:', error)
    return null
  }
}

/**
 * 사용자 프로필 조회
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('프로필 조회 오류:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('프로필 조회 중 예외 발생:', error)
    return null
  }
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateProfile(userId: string, data: UpdateProfileData): Promise<Profile | null> {
  try {
    // 학교 코드가 변경되면 school_verified 상태도 업데이트
    const updateData = {
      ...data,
      school_verified: data.school_code ? true : false,
      updated_at: new Date().toISOString()
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('프로필 업데이트 오류:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('프로필 업데이트 중 예외 발생:', error)
    return null
  }
}

/**
 * 학교 코드로 프로필 검증
 */
export async function verifySchoolCode(userId: string, schoolCode: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        school_code: schoolCode,
        school_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('학교 코드 검증 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('학교 코드 검증 중 예외 발생:', error)
    return false
  }
}

/**
 * 학교 코드 제거 (검증 해제)
 */
export async function removeSchoolCode(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        school_code: null,
        school_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('학교 코드 제거 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('학교 코드 제거 중 예외 발생:', error)
    return false
  }
}

/**
 * 학교 코드로 사용자 검색
 */
export async function searchProfilesBySchool(schoolCode: string): Promise<Profile[]> {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_code', schoolCode)
      .eq('school_verified', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('학교별 프로필 검색 오류:', error)
      return []
    }

    return profiles || []
  } catch (error) {
    console.error('학교별 프로필 검색 중 예외 발생:', error)
    return []
  }
}

/**
 * 검증된 학교 사용자 수 조회
 */
export async function getVerifiedSchoolUsersCount(schoolCode: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_code', schoolCode)
      .eq('school_verified', true)

    if (error) {
      console.error('검증된 학교 사용자 수 조회 오류:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('검증된 학교 사용자 수 조회 중 예외 발생:', error)
    return 0
  }
}
