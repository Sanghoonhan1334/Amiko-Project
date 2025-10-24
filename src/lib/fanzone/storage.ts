// FanZone Storage Utilities
// Utilidades para manejo de archivos en Supabase Storage

import { createSupabaseBrowserClient } from '@/lib/supabase-client'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

export interface UploadOptions {
  bucket: 'fanzone-covers' | 'fanzone-media'
  fanroomId: string
  postId?: string // Solo para media de posts
  file: File
  onProgress?: (progress: number) => void
}

/**
 * Genera path único para archivo de cover
 */
export function generateCoverPath(fanroomId: string, filename: string): string {
  const timestamp = Date.now()
  const extension = filename.split('.').pop()
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase()
  
  return `${fanroomId}/${timestamp}_${sanitizedFilename}`
}

/**
 * Genera path único para media de post
 */
export function generateMediaPath(
  fanroomId: string, 
  postId: string, 
  filename: string
): string {
  const timestamp = Date.now()
  const extension = filename.split('.').pop()
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase()
  
  return `${fanroomId}/${postId}/${timestamp}_${sanitizedFilename}`
}

/**
 * Valida tipo de archivo según bucket
 */
export function validateFileType(
  file: File, 
  bucket: 'fanzone-covers' | 'fanzone-media'
): { valid: boolean; error?: string } {
  const allowedTypes = {
    'fanzone-covers': ['image/jpeg', 'image/png', 'image/webp'],
    'fanzone-media': ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
  }
  
  const maxSizes = {
    'fanzone-covers': 5 * 1024 * 1024, // 5MB
    'fanzone-media': 50 * 1024 * 1024   // 50MB
  }
  
  if (!allowedTypes[bucket].includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Tipos válidos: ${allowedTypes[bucket].join(', ')}`
    }
  }
  
  if (file.size > maxSizes[bucket]) {
    const maxMB = maxSizes[bucket] / (1024 * 1024)
    return {
      valid: false,
      error: `Archivo demasiado grande. Máximo: ${maxMB}MB`
    }
  }
  
  return { valid: true }
}

/**
 * Sube archivo a Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, fanroomId, postId, file, onProgress } = options
  
  try {
    // Validar archivo
    const validation = validateFileType(file, bucket)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }
    
    // Generar path
    const path = bucket === 'fanzone-covers' 
      ? generateCoverPath(fanroomId, file.name)
      : generateMediaPath(fanroomId, postId!, file.name)
    
    // Crear cliente Supabase
    const supabase = createSupabaseBrowserClient()
    
    // Subir archivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onProgress) {
            const percentage = (progress.loaded / progress.total) * 100
            onProgress(percentage)
          }
        }
      })
    
    if (error) {
      console.error('Error uploading file:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Elimina archivo de Supabase Storage
 */
export async function deleteFile(
  bucket: 'fanzone-covers' | 'fanzone-media',
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseBrowserClient()
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) {
      console.error('Error deleting file:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtiene URL pública de archivo
 */
export function getPublicUrl(
  bucket: 'fanzone-covers' | 'fanzone-media',
  path: string
): string {
  const supabase = createSupabaseBrowserClient()
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

/**
 * Genera URL firmada para acceso temporal
 */
export async function getSignedUrl(
  bucket: 'fanzone-covers' | 'fanzone-media',
  path: string,
  expiresIn: number = 3600 // 1 hora por defecto
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = createSupabaseBrowserClient()
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: true,
      url: data.signedUrl
    }
    
  } catch (error) {
    console.error('Signed URL error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Valida y procesa múltiples archivos
 */
export async function processMultipleFiles(
  files: FileList,
  bucket: 'fanzone-covers' | 'fanzone-media',
  maxFiles: number = 10
): Promise<{ validFiles: File[]; errors: string[] }> {
  const validFiles: File[] = []
  const errors: string[] = []
  
  if (files.length > maxFiles) {
    errors.push(`Máximo ${maxFiles} archivos permitidos`)
    return { validFiles, errors }
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const validation = validateFileType(file, bucket)
    
    if (validation.valid) {
      validFiles.push(file)
    } else {
      errors.push(`${file.name}: ${validation.error}`)
    }
  }
  
  return { validFiles, errors }
}

/**
 * Genera nombre de archivo único
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  
  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`
}
