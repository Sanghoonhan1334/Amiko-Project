'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BookOpen, Plus, Search, Trash2, Save,
  Loader2, AlertCircle, RefreshCw, Edit2, X,
  Filter, ChevronDown, ChevronUp, Globe,
} from 'lucide-react'
import { toast } from 'sonner'

interface GlossaryEntry {
  id: string
  source_term: string
  source_language: 'ko' | 'es'
  rule: string
  target_value: string | null
  target_language: string | null
  category: string
  context_hint: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const RULES = [
  { value: 'translate', labelKo: '번역', labelEs: 'Traducir' },
  { value: 'no_translate', labelKo: '번역 안 함', labelEs: 'No traducir' },
  { value: 'preserve', labelKo: '보존', labelEs: 'Preservar' },
  { value: 'transliterate', labelKo: '음역', labelEs: 'Transliterar' },
  { value: 'annotate', labelKo: '주석', labelEs: 'Anotar' },
]

const CATEGORIES = [
  { value: 'food', labelKo: '음식', labelEs: 'Comida' },
  { value: 'honorific', labelKo: '경칭', labelEs: 'Honorífico' },
  { value: 'name', labelKo: '이름', labelEs: 'Nombre' },
  { value: 'expression', labelKo: '표현', labelEs: 'Expresión' },
  { value: 'cultural', labelKo: '문화', labelEs: 'Cultural' },
  { value: 'music', labelKo: '음악', labelEs: 'Música' },
  { value: 'fashion', labelKo: '패션', labelEs: 'Moda' },
  { value: 'place', labelKo: '장소', labelEs: 'Lugar' },
  { value: 'general', labelKo: '일반', labelEs: 'General' },
]

export default function AdminGlossariesPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterLang, setFilterLang] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterRule, setFilterRule] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    source_term: '',
    source_language: 'ko' as 'ko' | 'es',
    rule: 'preserve',
    target_value: '',
    target_language: 'es' as string,
    category: 'general',
    context_hint: '',
    priority: 0,
    is_active: true,
  })

  const loadEntries = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '30',
        active_only: 'false',
      })
      if (search) params.set('search', search)
      if (filterLang) params.set('language', filterLang)
      if (filterCategory) params.set('category', filterCategory)
      if (filterRule) params.set('rule', filterRule)

      const res = await fetch(`/api/admin/glossaries?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEntries(data.glossaries || [])
        setTotal(data.total || 0)
      } else {
        toast.error(t('용어집 로드 실패', 'Error al cargar glosario'))
      }
    } catch {
      toast.error(t('네트워크 오류', 'Error de red'))
    } finally {
      setLoading(false)
    }
  }, [token, page, search, filterLang, filterCategory, filterRule])

  useEffect(() => { loadEntries() }, [loadEntries])

  const resetForm = () => {
    setForm({
      source_term: '',
      source_language: 'ko',
      rule: 'preserve',
      target_value: '',
      target_language: 'es',
      category: 'general',
      context_hint: '',
      priority: 0,
      is_active: true,
    })
    setEditingId(null)
  }

  const startEdit = (entry: GlossaryEntry) => {
    setForm({
      source_term: entry.source_term,
      source_language: entry.source_language,
      rule: entry.rule,
      target_value: entry.target_value || '',
      target_language: entry.target_language || 'es',
      category: entry.category,
      context_hint: entry.context_hint || '',
      priority: entry.priority,
      is_active: entry.is_active,
    })
    setEditingId(entry.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!token || !form.source_term.trim()) return
    setSaving(true)
    try {
      const url = editingId
        ? `/api/admin/glossaries/${editingId}`
        : '/api/admin/glossaries'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          target_value: form.target_value || null,
          target_language: form.target_language || null,
          context_hint: form.context_hint || null,
        }),
      })

      if (res.ok) {
        toast.success(editingId
          ? t('용어 수정 완료', 'Término actualizado')
          : t('용어 추가 완료', 'Término agregado')
        )
        resetForm()
        setShowForm(false)
        loadEntries()
      } else {
        const data = await res.json()
        toast.error(data.error || t('저장 실패', 'Error al guardar'))
      }
    } catch {
      toast.error(t('네트워크 오류', 'Error de red'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm(t('정말 삭제하시겠습니까?', '¿Seguro que deseas eliminar?'))) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/glossaries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success(t('삭제 완료', 'Eliminado'))
        loadEntries()
      }
    } catch {
      toast.error(t('삭제 실패', 'Error al eliminar'))
    } finally {
      setDeleting(null)
    }
  }

  const ruleLabel = (rule: string) => {
    const r = RULES.find(r => r.value === rule)
    return r ? (language === 'ko' ? r.labelKo : r.labelEs) : rule
  }

  const categoryLabel = (cat: string) => {
    const c = CATEGORIES.find(c => c.value === cat)
    return c ? (language === 'ko' ? c.labelKo : c.labelEs) : cat
  }

  const ruleColor = (rule: string) => {
    switch (rule) {
      case 'no_translate': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'preserve': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'transliterate': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'annotate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'translate': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('문화 용어집 관리', 'Gestión de Glosarios Culturales')}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadEntries}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('새로고침', 'Refrescar')}
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>
            <Plus className="w-4 h-4 mr-1" />
            {t('용어 추가', 'Agregar término')}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 dark:bg-gray-700/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('용어 검색...', 'Buscar término...')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap"
          >
            <Filter className="w-4 h-4 mr-1" />
            {t('필터', 'Filtros')}
            {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <select
              value={filterLang}
              onChange={e => { setFilterLang(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
            >
              <option value="">{t('모든 언어', 'Todos los idiomas')}</option>
              <option value="ko">{t('한국어', 'Coreano')}</option>
              <option value="es">{t('스페인어', 'Español')}</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
            >
              <option value="">{t('모든 카테고리', 'Todas las categorías')}</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>
                  {language === 'ko' ? c.labelKo : c.labelEs}
                </option>
              ))}
            </select>
            <select
              value={filterRule}
              onChange={e => { setFilterRule(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
            >
              <option value="">{t('모든 규칙', 'Todas las reglas')}</option>
              {RULES.map(r => (
                <option key={r.value} value={r.value}>
                  {language === 'ko' ? r.labelKo : r.labelEs}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800 dark:bg-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {editingId ? t('용어 수정', 'Editar término') : t('새 용어 추가', 'Agregar nuevo término')}
            </h3>
            <button onClick={() => { setShowForm(false); resetForm() }}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('원어', 'Término original')}</label>
              <input
                type="text"
                value={form.source_term}
                onChange={e => setForm(f => ({ ...f, source_term: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm"
                placeholder={t('예: 김치', 'Ej: kimchi')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('원어 언어', 'Idioma original')}</label>
              <select
                value={form.source_language}
                onChange={e => setForm(f => ({ ...f, source_language: e.target.value as 'ko' | 'es' }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm"
              >
                <option value="ko">{t('한국어', 'Coreano')}</option>
                <option value="es">{t('스페인어', 'Español')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('규칙', 'Regla')}</label>
              <select
                value={form.rule}
                onChange={e => setForm(f => ({ ...f, rule: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm"
              >
                {RULES.map(r => (
                  <option key={r.value} value={r.value}>
                    {language === 'ko' ? r.labelKo : r.labelEs}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('대상 값', 'Valor destino')}</label>
              <input
                type="text"
                value={form.target_value}
                onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm"
                placeholder={form.rule === 'no_translate' ? t('(필요 없음)', '(no necesario)') : t('번역/음역', 'Traducción/transliteración')}
                disabled={form.rule === 'no_translate'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('카테고리', 'Categoría')}</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {language === 'ko' ? c.labelKo : c.labelEs}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('우선순위', 'Prioridad')}</label>
              <input
                type="number"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm"
                min={0}
                max={100}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('문맥 힌트', 'Contexto / Nota')}</label>
              <input
                type="text"
                value={form.context_hint}
                onChange={e => setForm(f => ({ ...f, context_hint: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm"
                placeholder={t('추가 설명 (선택)', 'Descripción adicional (opcional)')}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="rounded"
                id="active-check"
              />
              <label htmlFor="active-check" className="text-sm">{t('활성화', 'Activo')}</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm() }}>
              {t('취소', 'Cancelar')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.source_term.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              {editingId ? t('수정', 'Actualizar') : t('저장', 'Guardar')}
            </Button>
          </div>
        </Card>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="p-8 text-center dark:bg-gray-700/50">
          <Globe className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('등록된 용어가 없습니다', 'No hay términos registrados')}
          </p>
        </Card>
      ) : (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t(`총 ${total}개 용어`, `${total} términos en total`)}
          </div>

          <div className="space-y-2">
            {entries.map(entry => (
              <Card
                key={entry.id}
                className={`p-3 sm:p-4 dark:bg-gray-700/50 transition-opacity ${!entry.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {/* Term */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">{entry.source_term}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                        {entry.source_language.toUpperCase()}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${ruleColor(entry.rule)}`}>
                        {ruleLabel(entry.rule)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                        {categoryLabel(entry.category)}
                      </span>
                    </div>
                    {entry.target_value && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        → {entry.target_value}
                      </p>
                    )}
                    {entry.context_hint && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                        {entry.context_hint}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(entry)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {deleting === entry.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {total > 30 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                {t('이전', 'Anterior')}
              </Button>
              <span className="flex items-center text-sm text-gray-500">
                {page} / {Math.ceil(total / 30)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / 30)}
                onClick={() => setPage(p => p + 1)}
              >
                {t('다음', 'Siguiente')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
