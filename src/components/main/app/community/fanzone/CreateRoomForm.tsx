'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Upload, Image, Loader2, Check } from 'lucide-react'
import { useFanZone } from '@/hooks/useFanZone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

/**
 * CreateRoomForm - Formulario para crear FanRoom
 * Incluye: Upload de portada, nombre, descripción, categoría, visibilidad
 */
export default function CreateRoomForm() {
  const router = useRouter()
  const params = useParams()
  const { createFanroom, generateSlug } = useFanZone()
  
  // Obtener país de la URL o usar 'latam' por defecto
  const country = (params.country as string) || 'latam'
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'kpop',
    country: country,
    visibility: 'public',
    tags: ''
  })
  
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [step, setStep] = useState(1)

  // Categorías disponibles
  const categories = [
    { value: 'kpop', label: 'K-Pop', icon: '🎵' },
    { value: 'kdrama', label: 'K-Drama', icon: '📺' },
    { value: 'kbeauty', label: 'K-Beauty', icon: '💄' },
    { value: 'kfood', label: 'K-Food', icon: '🍜' },
    { value: 'kgaming', label: 'K-Gaming', icon: '🎮' },
    { value: 'learning', label: 'Aprendizaje', icon: '📚' },
    { value: 'other', label: 'Otro', icon: '🌟' }
  ]

  /**
   * Maneja cambio en inputs
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([])
    }
  }

  /**
   * Maneja selección de imagen de portada
   */
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setErrors(['Solo se permiten archivos de imagen'])
        return
      }
      
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(['La imagen no puede ser mayor a 5MB'])
        return
      }
      
      setCoverImage(file)
      
      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      setErrors([])
    }
  }

  /**
   * Elimina imagen de portada
   */
  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverPreview(null)
  }

  /**
   * Valida el formulario
   */
  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.name.trim()) {
      newErrors.push('El nombre es obligatorio')
    } else if (formData.name.length < 3) {
      newErrors.push('El nombre debe tener al menos 3 caracteres')
    } else if (formData.name.length > 50) {
      newErrors.push('El nombre no puede tener más de 50 caracteres')
    }
    
    if (formData.description && formData.description.length > 200) {
      newErrors.push('La descripción no puede tener más de 200 caracteres')
    }
    
    if (!formData.category) {
      newErrors.push('Debes seleccionar una categoría')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  /**
   * Maneja envío del formulario
   */
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      setUploading(true)
      
      // Preparar datos para envío
      const fanroomData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        country: formData.country,
        visibility: formData.visibility,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        coverImage: coverPreview // TODO: Implementar upload real a Supabase Storage
      }
      
      // Crear FanRoom usando el hook
      const result = await createFanroom(fanroomData)
      
      if (result.success) {
        // Navegar al FanRoom creado
        router.push(`/community/fanzone/${formData.country}/${result.fanroom.slug}`)
      } else {
        throw new Error(result.error || 'Error al crear FanRoom')
      }
      
    } catch (error) {
      console.error('Error creating fanroom:', error)
      setErrors([error instanceof Error ? error.message : 'Error al crear el FanRoom. Inténtalo de nuevo.'])
    } finally {
      setUploading(false)
    }
  }

  /**
   * Maneja navegación hacia atrás
   */
  const handleBack = () => {
    if (country && country !== 'latam') {
      router.push(`/community/fanzone/${country}`)
    } else {
      router.push('/community/fanzone')
    }
  }

  /**
   * Genera slug sugerido usando el hook
   */
  const generateSlugSuggestion = (name: string) => {
    return generateSlug(name)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Crear tu FanRoom
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comparte tu pasión con el mundo
          </p>
        </div>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700 dark:text-red-300">
                • {error}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Formulario */}
      <Card className="p-6 space-y-6">
        {/* Paso 1: Información básica */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 1 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <h2 className="text-lg font-semibold">Información básica</h2>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del FanRoom *</Label>
            <Input
              id="name"
              placeholder="Ej: BTS Army México"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              maxLength={50}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>URL sugerida: fanzone.com/{country}/{generateSlugSuggestion(formData.name)}</span>
              <span>{formData.name.length}/50</span>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Cuéntanos de qué trata tu comunidad..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              maxLength={200}
              rows={3}
            />
            <div className="text-right text-xs text-gray-500">
              {formData.description.length}/200
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-3">
            <Label>Categoría *</Label>
            <RadioGroup
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                      formData.category === category.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <RadioGroupItem
                      value={category.value}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-1">{category.icon}</div>
                      <div className="text-sm font-medium">{category.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Paso 2: Portada */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <h2 className="text-lg font-semibold">Imagen de portada</h2>
          </div>

          {/* Upload de portada */}
          <div className="space-y-4">
            {coverPreview ? (
              <div className="relative">
                <div className="aspect-video w-full max-w-md mx-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={coverPreview}
                    alt="Preview de portada"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeCoverImage}
                  className="absolute top-2 right-2"
                >
                  Eliminar
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Sube una imagen de portada
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Recomendado: 1200x630px, máximo 5MB
                </p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Seleccionar imagen
                </Button>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Paso 3: Configuración */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 3 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <h2 className="text-lg font-semibold">Configuración</h2>
          </div>

          {/* Visibilidad */}
          <div className="space-y-3">
            <Label>Visibilidad</Label>
            <RadioGroup
              value={formData.visibility}
              onValueChange={(value) => handleInputChange('visibility', value)}
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex-1">
                    <div className="font-medium">Público</div>
                    <div className="text-sm text-gray-500">
                      Cualquiera puede ver y unirse al FanRoom
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1">
                    <div className="font-medium">Privado</div>
                    <div className="text-sm text-gray-500">
                      Solo miembros invitados pueden acceder
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <Input
              id="tags"
              placeholder="bts, army, mexico, kpop"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Separa las etiquetas con comas. Ayuda a otros fans a encontrarte.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleBack} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={uploading || !formData.name.trim()}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear FanRoom'
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
