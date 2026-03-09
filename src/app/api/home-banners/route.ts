import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'

const BUCKET = 'home-banners'

// ──────────────────────────────────────────────
// GET /api/home-banners
// Public — returns all active banners in order
// Query: ?all=true  → returns ALL (active + inactive) for admin view
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ success: true, banners: [] })
    }

    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    let query = supabaseServer
      .from('home_banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (!showAll) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('[HOME_BANNERS_GET] Error:', error)
      return NextResponse.json({ success: true, banners: [] })
    }

    return NextResponse.json({ success: true, banners: data || [] })
  } catch (err) {
    console.error('[HOME_BANNERS_GET] Exception:', err)
    return NextResponse.json({ success: true, banners: [] })
  }
}

// ──────────────────────────────────────────────
// POST /api/home-banners
// Admin — upload image + create banner record
// Body: multipart/form-data
//   image: File
//   title_es: string
//   title_ko?: string
//   description_es?: string
//   description_ko?: string
//   link_url?: string
//   display_order?: number
//   is_active?: boolean
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const title_es = (formData.get('title_es') as string)?.trim()
    const title_ko = (formData.get('title_ko') as string)?.trim() || null
    const description_es = (formData.get('description_es') as string)?.trim() || null
    const description_ko = (formData.get('description_ko') as string)?.trim() || null
    const link_url = (formData.get('link_url') as string)?.trim() || null
    const display_order = parseInt(formData.get('display_order') as string || '0')
    const is_active = formData.get('is_active') !== 'false'

    if (!title_es) {
      return NextResponse.json({ error: 'title_es is required' }, { status: 400 })
    }

    let image_url: string

    if (imageFile && imageFile.size > 0) {
      // Validate type
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
      }

      // Upload to Supabase storage
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const filename = `banner-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const arrayBuffer = await imageFile.arrayBuffer()

      const { error: uploadError } = await supabaseServer.storage
        .from(BUCKET)
        .upload(filename, arrayBuffer, {
          contentType: imageFile.type,
          upsert: false,
        })

      if (uploadError) {
        // Bucket may not exist yet — store as-is or use upload/image fallback
        console.error('[HOME_BANNERS_POST] Storage upload error:', uploadError)
        return NextResponse.json(
          { error: `Image upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }

      const { data: urlData } = supabaseServer.storage
        .from(BUCKET)
        .getPublicUrl(filename)
      image_url = urlData.publicUrl
    } else {
      // Allow providing an image_url directly (e.g. already-uploaded asset)
      const direct = (formData.get('image_url') as string)?.trim()
      if (!direct) {
        return NextResponse.json({ error: 'image or image_url is required' }, { status: 400 })
      }
      image_url = direct
    }

    const { data, error } = await supabaseServer
      .from('home_banners')
      .insert({
        title_es,
        title_ko,
        description_es,
        description_ko,
        image_url,
        link_url,
        display_order,
        is_active,
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[HOME_BANNERS_POST] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, banner: data }, { status: 201 })
  } catch (err) {
    console.error('[HOME_BANNERS_POST] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// PUT /api/home-banners
// Admin — update banner (toggle active, reorder, edit text)
// Body: JSON { id, title_es?, title_ko?, description_es?, description_ko?,
//              link_url?, display_order?, is_active? }
// ──────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Only allow updating safe fields
    const allowed = [
      'title_es', 'title_ko', 'description_es', 'description_ko',
      'link_url', 'display_order', 'is_active', 'image_url',
    ]
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (updates[key] !== undefined) patch[key] = updates[key]
    }

    const { data, error } = await supabaseServer
      .from('home_banners')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, banner: data })
  } catch (err) {
    console.error('[HOME_BANNERS_PUT] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// DELETE /api/home-banners?id=<uuid>
// Admin — delete banner and its storage image
// ──────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Fetch banner to get image_url before deleting
    const { data: banner } = await supabaseServer
      .from('home_banners')
      .select('image_url')
      .eq('id', id)
      .single()

    const { error } = await supabaseServer
      .from('home_banners')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Attempt to remove from storage (ignore errors — may be an external URL)
    if (banner?.image_url) {
      try {
        const url = new URL(banner.image_url)
        const pathParts = url.pathname.split(`/${BUCKET}/`)
        if (pathParts.length === 2) {
          await supabaseServer.storage.from(BUCKET).remove([pathParts[1]])
        }
      } catch {
        // Not a storage URL — ignore
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[HOME_BANNERS_DELETE] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
