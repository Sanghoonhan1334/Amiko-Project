// FanZone Slug Utilities
// Utilidades para generación y validación de slugs

/**
 * Convierte texto a slug válido
 */
export function textToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[\s\W-]+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, '')
    // Eliminar guiones dobles
    .replace(/-{2,}/g, '-')
}

/**
 * Valida formato de slug
 */
export function isValidSlug(slug: string): boolean {
  // Solo letras minúsculas, números y guiones
  const slugRegex = /^[a-z0-9-]+$/
  
  // No puede empezar o terminar con guión
  const noLeadingTrailingHyphens = !slug.startsWith('-') && !slug.endsWith('-')
  
  // No puede tener guiones dobles
  const noDoubleHyphens = !slug.includes('--')
  
  // Longitud mínima y máxima
  const validLength = slug.length >= 3 && slug.length <= 50
  
  return slugRegex.test(slug) && noLeadingTrailingHyphens && noDoubleHyphens && validLength
}

/**
 * Genera slug único agregando sufijo numérico
 */
export function generateUniqueSlug(
  baseSlug: string, 
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }
  
  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }
  
  return uniqueSlug
}

/**
 * Genera slug con sufijo geográfico para evitar conflictos
 */
export function generateGeographicSlug(
  baseSlug: string,
  countryCode: string = 'mx'
): string {
  const countrySuffixes = {
    'mx': 'mx',
    'ar': 'ar', 
    'co': 'co',
    'pe': 'pe',
    'cl': 'cl',
    'br': 'br',
    'us': 'us'
  }
  
  const suffix = countrySuffixes[countryCode.toLowerCase() as keyof typeof countrySuffixes] || 'mx'
  return `${baseSlug}-${suffix}`
}

/**
 * Extrae información del slug
 */
export function parseSlug(slug: string): {
  base: string
  suffix?: string
  isGeographic: boolean
  countryCode?: string
} {
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  // Verificar si el último segmento es un código de país
  const countryCodes = ['mx', 'ar', 'co', 'pe', 'cl', 'br', 'us']
  const isGeographic = countryCodes.includes(lastPart)
  
  if (isGeographic) {
    return {
      base: parts.slice(0, -1).join('-'),
      suffix: lastPart,
      isGeographic: true,
      countryCode: lastPart
    }
  }
  
  // Verificar si es un sufijo numérico
  const isNumericSuffix = /^\d+$/.test(lastPart)
  
  if (isNumericSuffix) {
    return {
      base: parts.slice(0, -1).join('-'),
      suffix: lastPart,
      isGeographic: false
    }
  }
  
  return {
    base: slug,
    isGeographic: false
  }
}

/**
 * Sugiere slugs alternativos basados en el texto original
 */
export function suggestSlugs(text: string, maxSuggestions: number = 5): string[] {
  const suggestions: string[] = []
  
  // Slug básico
  const basicSlug = textToSlug(text)
  suggestions.push(basicSlug)
  
  // Variaciones con palabras clave comunes
  const keywords = ['fans', 'army', 'community', 'club', 'group']
  
  for (const keyword of keywords) {
    if (suggestions.length >= maxSuggestions) break
    
    const variation = textToSlug(`${text} ${keyword}`)
    if (!suggestions.includes(variation)) {
      suggestions.push(variation)
    }
  }
  
  // Variaciones con sufijos geográficos
  const countries = ['mx', 'latam', 'global']
  
  for (const country of countries) {
    if (suggestions.length >= maxSuggestions) break
    
    const variation = `${basicSlug}-${country}`
    if (!suggestions.includes(variation)) {
      suggestions.push(variation)
    }
  }
  
  return suggestions.slice(0, maxSuggestions)
}

/**
 * Valida slug en tiempo real mientras el usuario escribe
 */
export function validateSlugInput(input: string): {
  isValid: boolean
  slug: string
  error?: string
  suggestions?: string[]
} {
  const slug = textToSlug(input)
  
  if (slug.length < 3) {
    return {
      isValid: false,
      slug,
      error: 'El slug debe tener al menos 3 caracteres'
    }
  }
  
  if (slug.length > 50) {
    return {
      isValid: false,
      slug,
      error: 'El slug no puede tener más de 50 caracteres'
    }
  }
  
  if (!isValidSlug(slug)) {
    return {
      isValid: false,
      slug,
      error: 'El slug solo puede contener letras minúsculas, números y guiones'
    }
  }
  
  return {
    isValid: true,
    slug
  }
}

/**
 * Hook para manejo de slug en formularios
 */
export function useSlugGenerator(initialText: string = '') {
  const [text, setText] = useState(initialText)
  const [slug, setSlug] = useState(textToSlug(initialText))
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const updateText = (newText: string) => {
    setText(newText)
    const validation = validateSlugInput(newText)
    setSlug(validation.slug)
    setIsValid(validation.isValid)
    setError(validation.error || null)
  }
  
  const generateSuggestions = () => {
    return suggestSlugs(text)
  }
  
  const setCustomSlug = (customSlug: string) => {
    const validation = validateSlugInput(customSlug)
    if (validation.isValid) {
      setSlug(validation.slug)
      setIsValid(true)
      setError(null)
    } else {
      setError(validation.error || 'Slug inválido')
    }
  }
  
  return {
    text,
    slug,
    isValid,
    error,
    updateText,
    generateSuggestions,
    setCustomSlug
  }
}

/**
 * Utilidades para URLs amigables
 */
export const slugUtils = {
  /**
   * Convierte slug a título legible
   */
  slugToTitle: (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  },
  
  /**
   * Genera URL completa para FanRoom
   */
  generateFanroomUrl: (slug: string): string => {
    return `/community/fanzone/${slug}`
  },
  
  /**
   * Extrae slug de URL
   */
  extractSlugFromUrl: (url: string): string | null => {
    const match = url.match(/\/community\/fanzone\/([a-z0-9-]+)/)
    return match ? match[1] : null
  },
  
  /**
   * Valida slug de URL
   */
  isValidUrlSlug: (urlSlug: string): boolean => {
    return isValidSlug(urlSlug)
  }
}

/**
 * Constantes para slugs
 */
export const SLUG_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  PATTERN: /^[a-z0-9-]+$/,
  RESERVED_SLUGS: [
    'admin',
    'api',
    'app',
    'dashboard',
    'settings',
    'profile',
    'help',
    'support',
    'terms',
    'privacy',
    'about',
    'contact'
  ]
} as const

/**
 * Verifica si un slug está reservado
 */
export function isReservedSlug(slug: string): boolean {
  return SLUG_CONSTRAINTS.RESERVED_SLUGS.includes(slug.toLowerCase())
}

/**
 * Valida slug completo (formato + reservado)
 */
export function validateSlugComplete(slug: string): {
  isValid: boolean
  error?: string
} {
  if (!isValidSlug(slug)) {
    return {
      isValid: false,
      error: 'Formato de slug inválido'
    }
  }
  
  if (isReservedSlug(slug)) {
    return {
      isValid: false,
      error: 'Este slug está reservado'
    }
  }
  
  return {
    isValid: true
  }
}
