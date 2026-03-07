'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search, Filter, Star, Users, Clock, BookOpen,
  GraduationCap, Globe, X
} from 'lucide-react'
import type { EducationCourse, CourseCategory, CourseLevel } from '@/types/education'

const CATEGORIES: CourseCategory[] = [
  'korean_language', 'korean_culture', 'korea_business',
  'gastronomy', 'history', 'k_culture', 'cultural_exchange'
]

const LEVELS: CourseLevel[] = ['basic', 'intermediate', 'advanced']

function getCategoryEmoji(cat: CourseCategory) {
  const emojis: Record<CourseCategory, string> = {
    korean_language: '🗣️',
    korean_culture: '🎎',
    korea_business: '💼',
    gastronomy: '🍜',
    history: '📜',
    k_culture: '🎵',
    cultural_exchange: '🤝'
  }
  return emojis[cat] || '📚'
}

export default function MarketplaceTab() {
  const { te } = useEducationTranslation()
  const router = useRouter()
  const [courses, setCourses] = useState<EducationCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [language, setLanguage] = useState<string>('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' })
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (level) params.set('level', level)
      if (language) params.set('language', language)

      const res = await fetch(`/api/education/courses?${params}`)
      const data = await res.json()
      setCourses(data.courses || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, category, level, language])

  useEffect(() => {
    const debounce = setTimeout(fetchCourses, 300)
    return () => clearTimeout(debounce)
  }, [fetchCourses])

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setLevel('')
    setLanguage('')
    setPage(1)
  }

  const hasFilters = search || category || level || language

  const getCategoryColor = (cat: CourseCategory) => {
    const colors: Record<CourseCategory, string> = {
      korean_language: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      korean_culture: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
      korea_business: 'bg-banana-100 text-banana-700 dark:bg-banana-900/30 dark:text-banana-300',
      gastronomy: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      history: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      k_culture: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      cultural_exchange: 'bg-mint-100 text-mint-700 dark:bg-mint-900/30 dark:text-mint-300'
    }
    return colors[cat] || 'bg-muted text-muted-foreground'
  }

  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case 'basic': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'intermediate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'advanced': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={te('education.course.searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`text-xs ${showFilters ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 text-purple-600 dark:text-purple-400' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          {te('education.course.filters')}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  {te('education.course.category')}
                </label>
                <Select value={category} onValueChange={v => { setCategory(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder={te('education.form.selectCategory')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{te('education.categories.all')}</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{getCategoryEmoji(cat)} {te(`education.categories.${cat}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  {te('education.course.level')}
                </label>
                <Select value={level} onValueChange={v => { setLevel(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder={te('education.form.selectLevel')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{te('education.categories.all')}</SelectItem>
                    {LEVELS.map(lvl => (
                      <SelectItem key={lvl} value={lvl}>{te(`education.levels.${lvl}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  {te('education.course.teachingLanguage')}
                </label>
                <Select value={language} onValueChange={v => { setLanguage(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder={te('education.form.selectLanguage')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{te('education.categories.all')}</SelectItem>
                    <SelectItem value="es">{te('education.languages.es')}</SelectItem>
                    <SelectItem value="ko">{te('education.languages.ko')}</SelectItem>
                    <SelectItem value="bilingual">{te('education.languages.bilingual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-gray-500 dark:text-gray-400">
                  <X className="w-3 h-3 mr-1" />{te('education.course.clearFilters')}
                </Button>
              </div>
            )}
        </div>
      )}

      {/* Category Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => { setCategory(''); setPage(1) }}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            !category
              ? 'bg-purple-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >{te('education.categories.all')}</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat === category ? '' : cat); setPage(1) }}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              category === cat
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >{getCategoryEmoji(cat)} {te(`education.categories.${cat}`)}</button>
        ))}
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {total} {total === 1 ? 'curso' : 'cursos'}
        </p>
      )}

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {te('education.course.noCoursesFound')}
          </p>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4 text-xs">
              {te('education.course.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              te={te}
              getCategoryColor={getCategoryColor}
              getLevelColor={getLevelColor}
              onClick={() => router.push(`/education/course/${course.slug || course.id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs">←</Button>
          <span className="flex items-center px-3 text-xs text-gray-500 dark:text-gray-400">{page} / {Math.ceil(total / 12)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)} className="text-xs">→</Button>
        </div>
      )}
    </div>
  )
}

/* CourseCard */
function CourseCard({
  course, te, getCategoryColor, getLevelColor, onClick
}: {
  course: EducationCourse
  te: (key: string, params?: Record<string, string | number>) => string
  getCategoryColor: (cat: CourseCategory) => string
  getLevelColor: (lvl: string) => string
  onClick: () => void
}) {
  const spotsLeft = course.max_students - course.enrolled_count
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0
  const isFull = spotsLeft <= 0

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-200 group"
    >
        {/* Top section: Category + Level */}
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{getCategoryEmoji(course.category)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {te(`education.categories.${course.category}`)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-0 ${getLevelColor(course.level)}`}>
              {te(`education.levels.${course.level}`)}
            </Badge>
            {isFull && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                {te('education.course.full')}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="px-3 pb-2">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
            {course.description}
          </p>
        </div>

        {/* Instructor info */}
        {course.instructor && (
          <div className="px-3 pb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {course.instructor.photo_url ? (
                <img src={course.instructor.photo_url} alt={course.instructor.display_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-xs text-white font-bold">
                  {course.instructor.display_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                {course.instructor.display_name}
              </p>
              <div className="flex items-center gap-1">
                {course.instructor.is_verified && <span className="text-[10px] text-blue-500">✓</span>}
                {course.instructor.average_rating > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                    <Star className="w-2.5 h-2.5 fill-yellow-400" />{course.instructor.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom section: Meta + Price */}
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <BookOpen className="w-3 h-3" /><span>{course.total_classes} cls</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" /><span>{course.class_duration_minutes}m</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <Users className="w-3 h-3" />
              <span className={isAlmostFull ? 'text-orange-500 font-medium' : isFull ? 'text-red-500 font-medium' : ''}>
                {course.enrolled_count}/{course.max_students}
              </span>
            </div>
          </div>
          <div className="text-right">
            {course.price_usd > 0 ? (
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">${course.price_usd.toFixed(2)}</span>
            ) : (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Free</span>
            )}
          </div>
        </div>

        {/* Language tag */}
        <div className="px-3 pb-2 pt-1">
          <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
            {te(`education.languages.${course.teaching_language}`)}
          </span>
        </div>
    </div>
  )
}
