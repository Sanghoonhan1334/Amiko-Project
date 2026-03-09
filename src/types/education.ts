// Education Module Types - AMIKO
// 교육 모듈 타입 정의

export type CourseCategory =
  | 'korean_language'
  | 'korean_culture'
  | 'korea_business'
  | 'gastronomy'
  | 'history'
  | 'k_culture'
  | 'cultural_exchange';

export type CourseLevel = 'basic' | 'intermediate' | 'advanced';

export type TeachingLanguage = 'es' | 'ko' | 'bilingual';

export type CourseStatus =
  | 'draft'
  | 'submitted_for_review'
  | 'pending_review'       // legacy alias
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type SessionStatus =
  | 'scheduled'
  | 'ready'
  | 'live'
  | 'ending'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type PaymentStatus =
  | 'pending'
  | 'payment_created'
  | 'payment_approved'
  | 'payment_captured'
  | 'completed'           // legacy alias for payment_captured
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export type EnrollmentStatus =
  | 'pending_payment'
  | 'enrolled'
  | 'active'
  | 'completed'
  | 'dropped'
  | 'cancelled'
  | 'blocked'
  | 'refunded';

export type AttendanceStatus =
  | 'pending'
  | 'not_joined'
  | 'joined'
  | 'attended'
  | 'late'
  | 'left_early'
  | 'absent'
  | 'completed';           // legacy alias for attended

export type MaterialType = 'pdf' | 'presentation' | 'link' | 'vocabulary' | 'other';

export interface InstructorProfile {
  id: string;
  user_id: string;
  photo_url: string | null;
  display_name: string;
  country: string;
  languages: string[];
  experience: string | null;
  specialty: string | null;
  bio: string | null;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  total_students: number;
  total_courses: number;
  created_at: string;
  updated_at: string;
}

export interface EducationCourse {
  id: string;
  instructor_id: string;
  title: string;
  slug: string;
  category: CourseCategory;
  description: string;
  objectives: string | null;
  level: CourseLevel;
  teaching_language: TeachingLanguage;
  total_classes: number;
  class_duration_minutes: number;
  price_usd: number;
  max_students: number;
  enrolled_count: number;
  thumbnail_url: string | null;
  allow_recording: boolean;
  status: CourseStatus;
  rejection_reason: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  instructor?: InstructorProfile;
  sessions?: EducationSession[];
  materials?: CourseMaterial[];
}

export interface EducationSession {
  id: string;
  course_id: string;
  session_number: number;
  title: string | null;
  description: string | null;
  scheduled_at: string;
  scheduled_end_utc: string | null;   // GENERATED ALWAYS AS (scheduled_at + duration_minutes)
  duration_minutes: number;
  timezone_origin: string | null;
  agora_channel: string | null;
  agora_uid_instructor: number | null;
  recording_url: string | null;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  rescheduled_to: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  course?: EducationCourse;
  attendance?: SessionAttendance[];
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  payment_id: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  amount_paid: number;
  payment_status: PaymentStatus;
  enrollment_status: EnrollmentStatus;
  progress_percentage: number;
  completed_classes: number;
  certificate_issued: boolean;
  certificate_url: string | null;
  review_eligible: boolean;
  enrolled_at: string;
  completed_at: string | null;
  // Joined
  course?: EducationCourse;
}

export interface SessionAttendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  joined_at: string | null;
  left_at: string | null;
  total_seconds_connected: number;
  created_at: string;
}

export interface CourseReview {
  id: string;
  course_id: string;
  student_id: string;
  clarity_rating: number;
  content_rating: number;
  interaction_rating: number;
  usefulness_rating: number;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  student_name?: string;
  student_avatar?: string;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  session_id: string | null;
  title: string;
  type: MaterialType;
  file_url: string | null;
  external_url: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface ClassChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'system' | 'file';
  created_at: string;
  // Joined
  user_name?: string;
  user_avatar?: string;
}

// Form types
export interface CreateCourseForm {
  title: string;
  category: CourseCategory;
  description: string;
  objectives: string;
  level: CourseLevel;
  teaching_language: TeachingLanguage;
  total_classes: number;
  class_duration_minutes: number;
  price_usd: number;
  max_students: number;
  thumbnail_url: string;
  allow_recording: boolean;
  sessions: CreateSessionForm[];
}

export interface CreateSessionForm {
  session_number: number;
  title: string;
  description: string;
  scheduled_at: string; // ISO datetime
}

export interface InstructorProfileForm {
  display_name: string;
  country: string;
  languages: string[];
  experience: string;
  specialty: string;
  bio: string;
  photo_url: string;
}

export interface ReviewForm {
  clarity_rating: number;
  content_rating: number;
  interaction_rating: number;
  usefulness_rating: number;
  comment: string;
}

// API response types
export interface CourseListResponse {
  courses: EducationCourse[];
  total: number;
  page: number;
  limit: number;
}

export interface CourseFilters {
  category?: CourseCategory;
  level?: CourseLevel;
  language?: TeachingLanguage;
  search?: string;
  status?: CourseStatus;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// Admin stats
export interface EducationAdminStats {
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;
  totalInstructors: number;
  totalRevenue: number;
  pendingApprovals: number;
}

// ── Live-class API response types ────────────────────────────────────────────

export interface SessionAccessStatus {
  can_enter: boolean;
  reason: 'not_enrolled' | 'session_unavailable' | 'session_ended' | 'too_early' | 'window_closed' | null;
  session_status: SessionStatus;
  viewer_role: 'instructor' | 'student' | 'none';
  is_enrolled: boolean;
  session_id: string;
  course_id: string;
  session_number: number;
  title: string | null;
  window_opens_at: string;
  window_closes_at: string;
}

export interface SessionAccessToken {
  app_id: string;
  channel: string;
  uid: number;
  token: string;
  role: 'publisher' | 'audience';
  is_instructor: boolean;
  allow_recording: boolean;
  expires_at: string;
  session: {
    id: string;
    status: SessionStatus;
    session_number: number;
    scheduled_at: string;
    duration_minutes: number;
  };
}

export interface SessionTimerState {
  session_id: string;
  status: SessionStatus;
  started_at: string | null;
  scheduled_at: string;
  ends_at: string;
  duration_minutes: number;
  remaining_seconds: number;
  elapsed_seconds: number;
  progress_percent: number;
  warnings: {
    closing_10min: boolean;
    closing_5min: boolean;
    closing_1min: boolean;
    ended: boolean;
  };
}
