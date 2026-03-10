import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = 'education-materials'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const ALLOWED_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  presentation: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  vocabulary: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain'
  ],
  other: [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/wav',
    'video/mp4',
    'text/plain',
    'application/zip'
  ]
}

// POST /api/education/upload - Upload a file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    // Require auth — service_role bucket without auth = any user can upload 50MB files
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const courseId = formData.get('course_id') as string
    const sessionId = formData.get('session_id') as string | null
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const description = formData.get('description') as string | null
    const sortOrder = formData.get('sort_order') as string | null

    if (!file || !courseId || !title || !type) {
      return NextResponse.json(
        { error: 'file, course_id, title, and type are required' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedMimes = ALLOWED_TYPES[type] || ALLOWED_TYPES.other
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" not allowed for material type "${type}"` },
        { status: 400 }
      )
    }

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: Object.values(ALLOWED_TYPES).flat()
      })
    }

    // Generate unique file path
    const ext = file.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100)
    const filePath = `${courseId}/${sessionId || 'general'}/${timestamp}_${safeName}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[Education] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const fileUrl = publicUrlData.publicUrl

    // Create material record in database
    const { data: material, error: materialError } = await supabase
      .from('education_materials')
      .insert({
        course_id: courseId,
        session_id: sessionId || null,
        title,
        type,
        file_url: fileUrl,
        description: description || null,
        sort_order: parseInt(sortOrder || '0', 10)
      })
      .select()
      .single()

    if (materialError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      console.error('[Education] Material insert error:', materialError)
      return NextResponse.json({ error: 'Failed to save material record' }, { status: 500 })
    }

    return NextResponse.json({
      material,
      file_url: fileUrl,
      file_size: file.size,
      file_name: file.name
    }, { status: 201 })
  } catch (err) {
    console.error('[Education] upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
