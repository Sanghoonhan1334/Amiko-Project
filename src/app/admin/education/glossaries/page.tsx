'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BookOpen, Plus, Search, Trash2, Save,
  Loader2, AlertCircle, RefreshCw, Edit2, X,
  Filter, ChevronDown, ChevronUp, Languages,
  ShieldCheck, ListFilter, AlignLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface GlossaryEntry {
  id: string
  term: string
  source_language: 'ko' | 'es' | 'en'
  target_language: 'ko' | 'es' | 'en' | null
  action: string
  preferred_translation: string | null
  category: string
  context: string | null
  context_hint: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TranslationRule {
  id: string
  name: string
  description: string | null
  pattern: string
  replacement: string
  phase: 'pre' | 'post'
  source_language: string | null
  target_language: string | null
  context: string | null
  flags: string
  priority: number
  is_active: boolean
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIONS = [
  { value: 'no_translate',  labelEs: 'No traducir',      color: 'bg-red-500/20 text-red-300'     },
  { value: 'preserve',      labelEs: 'Preservar',        color: 'bg-blue-500/20 text-blue-300'   },
  { value: 'transliterate', labelEs: 'Transliterar',     color: 'bg-purple-500/20 text-purple-300'},
  { value: 'annotate',      labelEs: 'Anotar',           color: 'bg-amber-500/20 text-amber-300' },
  { value: 'translate',     labelEs: 'Forzar traducción',color: 'bg-green-500/20 text-green-300' },
]

const CATEGORIES = [
  { value: 'food',       labelEs: 'Comida'       },
  { value: 'honorific',  labelEs: 'Honorífico'   },
  { value: 'name',       labelEs: 'Nombre propio'},
  { value: 'expression', labelEs: 'Expresión'    },
  { value: 'cultural',   labelEs: 'Cultural'     },
  { value: 'education',  labelEs: 'Educativo'    },
  { value: 'music',      labelEs: 'Música'       },
  { value: 'fashion',    labelEs: 'Moda'         },
  { value: 'place',      labelEs: 'Lugar'        },
  { value: 'general',    labelEs: 'General'      },
]

const CONTEXT_OPTIONS = [
  { value: 'education', labelEs: 'Educación' },
  { value: 'general',   labelEs: 'General'   },
  { value: 'meet',      labelEs: 'Meet'      },
]

const LANGUAGES = [
  { value: 'ko', label: '한국어 (KO)' },
  { value: 'es', label: 'Español (ES)' },
  { value: 'en', label: 'English (EN)' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminEducationGlossariesPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [activeTab, setActiveTab] = useState<'glossaries' | 'rules'>('glossaries')

  // ── Glossary state ──────────────────────────────────────────────────────
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterLang, setFilterLang] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const EMPTY_FORM = {
    term: '',
    source_language: 'ko' as 'ko' | 'es' | 'en',
    target_language: '' as string,
    action: 'no_translate',
    preferred_translation: '',
    category: 'general',
    context: 'education',
    context_hint: '',
    priority: 0,
    is_active: true,
  }
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ── Rules state ─────────────────────────────────────────────────────────
  const [rules, setRules] = useState<TranslationRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [savingRule, setSavingRule] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  const EMPTY_RULE_FORM = {
    name: '', description: '', pattern: '', replacement: '',
    phase: 'pre' as 'pre' | 'post', source_language: '', target_language: '',
    context: 'education', flags: 'gi', priority: 0, is_active: true,
  }
  const [ruleForm, setRuleForm] = useState({ ...EMPTY_RULE_FORM })

  // ── Load glossary entries ───────────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '40', active_only: 'false', context: 'all',
      })
      if (search) params.set('search', search)
      if (filterLang) params.set('language', filterLang)
      if (filterCategory) params.set('category', filterCategory)
      if (filterAction) params.set('action', filterAction)

      const res = await fetch(`/api/admin/education/glossaries?${params}`, {
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
  }, [token, page, search, filterLang, filterCategory, filterAction])

  // ── Load translation rules ──────────────────────────────────────────────
  const loadRules = useCallback(async () => {
    if (!token) return
    setRulesLoading(true)
    try {
      const res = await fetch('/api/admin/education/glossaries/rules?active_only=false&context=all', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || [])
      }
    } catch {
      // ignore
    } finally {
      setRulesLoading(false)
    }
  }, [token])

  useEffect(() => { loadEntries() }, [loadEntries])
  useEffect(() => { if (activeTab === 'rules') loadRules() }, [activeTab, loadRules])

  // ── Reset form ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
  }

  const startEdit = (entry: GlossaryEntry) => {
    setForm({
      term: entry.term,
      source_language: entry.source_language,
      target_language: entry.target_language || '',
      action: entry.action,
      preferred_translation: entry.preferred_translation || '',
      category: entry.category,
      context: entry.context || 'education',
      context_hint: entry.context_hint || '',
      priority: entry.priority,
      is_active: entry.is_active,
    })
    setEditingId(entry.id)
    setShowForm(true)
  }

  // ── Save glossary entry ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!token || !form.term.trim()) return
    setSaving(true)
    try {
      const url    = editingId ? `/api/admin/education/glossaries/${editingId}` : '/api/admin/education/glossaries'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          target_language: form.target_language || null,
          preferred_translation: form.preferred_translation || null,
          context_hint: form.context_hint || null,
        }),
      })
      if (res.ok) {
        toast.success(t(editingId ? '수정 완료' : '추가 완료', editingId ? 'Actualizado' : 'Agregado'))
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

  // ── Delete glossary entry ───────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!token || !confirm(t('비활성화하시겠습니까?', '¿Desactivar esta entrada?'))) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/education/glossaries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success(t('비활성화됨', 'Desactivada'))
        loadEntries()
      }
    } catch {
      toast.error(t('네트워크 오류', 'Error de red'))
    } finally {
      setDeletingId(null)
    }
  }

  // ── Save translation rule ───────────────────────────────────────────────
  const resetRuleForm = () => { setRuleForm({ ...EMPTY_RULE_FORM }); setEditingRuleId(null) }
  const startEditRule = (r: TranslationRule) => {
    setRuleForm({
      name: r.name, description: r.description || '',
      pattern: r.pattern, replacement: r.replacement, phase: r.phase,
      source_language: r.source_language || '', target_language: r.target_language || '',
      context: r.context || 'education', flags: r.flags, priority: r.priority, is_active: r.is_active,
    })
    setEditingRuleId(r.id)
    setShowRuleForm(true)
  }

  const handleSaveRule = async () => {
    if (!token || !ruleForm.name.trim() || !ruleForm.pattern.trim()) return
    setSavingRule(true)
    try {
      const url    = editingRuleId ? `/api/admin/education/glossaries/rules/${editingRuleId}` : '/api/admin/education/glossaries/rules'
      const method = editingRuleId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ruleForm,
          source_language: ruleForm.source_language || null,
          target_language: ruleForm.target_language || null,
          description: ruleForm.description || null,
        }),
      })
      if (res.ok) {
        toast.success(t(editingRuleId ? '규칙 수정됨' : '규칙 추가됨', editingRuleId ? 'Regla actualizada' : 'Regla creada'))
        resetRuleForm()
        setShowRuleForm(false)
        loadRules()
      } else {
        const data = await res.json()
        toast.error(data.error || t('저장 실패', 'Error al guardar'))
      }
    } catch {
      toast.error(t('네트워크 오류', 'Error de red'))
    } finally {
      setSavingRule(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!token || !confirm(t('규칙을 비활성화하시겠습니까?', '¿Desactivar esta regla?'))) return
    setDeletingRuleId(id)
    try {
      const res = await fetch(`/api/admin/education/glossaries/rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { toast.success(t('비활성화됨', 'Desactivada')); loadRules() }
    } catch {
      toast.error(t('네트워크 오류', 'Error de red'))
    } finally {
      setDeletingRuleId(null)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  const actionMeta = (a: string) => ACTIONS.find(x => x.value === a)
  const categoryLabel = (c: string) => CATEGORIES.find(x => x.value === c)?.labelEs ?? c
  const needsTranslation = (action: string) => action !== 'no_translate'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {t('문화 용어집 관리', 'Glosarios Culturales — Educación')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t(
              'DeepSeek 번역 전/후에 적용되는 문화 용어 및 번역 규칙을 관리합니다.',
              'Gestiona términos culturales y reglas de transformación aplicadas antes/después de la traducción DeepSeek.'
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 gap-1">
        {(
          [
            { key: 'glossaries', icon: Languages,  label: t('용어집', 'Términos') },
            { key: 'rules',      icon: ListFilter, label: t('번역 규칙', 'Reglas de transformación') },
          ] as const
        ).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'glossaries' && (
              <span className="ml-1 bg-gray-700 text-gray-300 text-xs rounded-full px-1.5 py-0.5">{total}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Glossaries Tab ── */}
      {activeTab === 'glossaries' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('용어 검색…', 'Buscar término…')}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(f => !f)}
              className="border-gray-600 text-gray-300 gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              {t('필터', 'Filtros')}
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadEntries()} className="border-gray-600 text-gray-300">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={() => { resetForm(); setShowForm(true) }}
              className="gap-1.5 ml-auto"
            >
              <Plus className="w-4 h-4" />
              {t('용어 추가', 'Agregar término')}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="bg-gray-800/50 border-gray-700 p-3">
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterLang}
                  onChange={e => { setFilterLang(e.target.value); setPage(1) }}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                >
                  <option value="">{t('전체 언어', 'Todos los idiomas')}</option>
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <select
                  value={filterCategory}
                  onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                >
                  <option value="">{t('전체 카테고리', 'Todas las categorías')}</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.labelEs}</option>)}
                </select>
                <select
                  value={filterAction}
                  onChange={e => { setFilterAction(e.target.value); setPage(1) }}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                >
                  <option value="">{t('전체 동작', 'Todas las acciones')}</option>
                  {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.labelEs}</option>)}
                </select>
              </div>
            </Card>
          )}

          {/* Form */}
          {showForm && (
            <Card className="bg-gray-800/60 border-gray-600 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {editingId ? t('용어 수정', 'Editar término') : t('새 용어 추가', 'Nuevo término')}
                </h3>
                <button onClick={() => { setShowForm(false); resetForm() }} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Term */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('용어 *', 'Término *')}</label>
                  <input
                    type="text"
                    value={form.term}
                    onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                    placeholder="예: 김치, oppa, arepa"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Source language */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('원어 *', 'Idioma origen *')}</label>
                  <select
                    value={form.source_language}
                    onChange={e => setForm(f => ({ ...f, source_language: e.target.value as 'ko' | 'es' | 'en' }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>

                {/* Target language (optional) */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('대상 언어 (선택)', 'Idioma destino (opcional)')}</label>
                  <select
                    value={form.target_language}
                    onChange={e => setForm(f => ({ ...f, target_language: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    <option value="">{t('모든 언어', 'Todos los idiomas')}</option>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>

                {/* Action */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('동작 *', 'Acción *')}</label>
                  <select
                    value={form.action}
                    onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.labelEs}</option>)}
                  </select>
                </div>

                {/* Preferred translation */}
                {needsTranslation(form.action) && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-gray-400">
                      {t('변환값 *', 'Traducción/transliteración preferida *')}
                    </label>
                    <input
                      type="text"
                      value={form.preferred_translation}
                      onChange={e => setForm(f => ({ ...f, preferred_translation: e.target.value }))}
                      placeholder="Ej: kimchi, oppa, tteokbokki"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('카테고리', 'Categoría')}</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.labelEs}</option>)}
                  </select>
                </div>

                {/* Context */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('컨텍스트', 'Contexto')}</label>
                  <select
                    value={form.context}
                    onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    {CONTEXT_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.labelEs}</option>)}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('우선순위', 'Prioridad')}</label>
                  <input
                    type="number"
                    value={form.priority}
                    min={0} max={100}
                    onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  />
                </div>

                {/* Context hint */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-gray-400">{t('관리자 메모 (선택)', 'Nota para admins (opcional)')}</label>
                  <input
                    type="text"
                    value={form.context_hint}
                    onChange={e => setForm(f => ({ ...f, context_hint: e.target.value }))}
                    placeholder={t('예: 경칭, 음식, 문화 용어', 'Ej: honorífico, plato típico…')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      form.is_active ? 'bg-primary' : 'bg-gray-600'
                    )}
                    role="switch" aria-checked={form.is_active}
                  >
                    <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', form.is_active ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                  <span className="text-sm text-gray-300">{t('활성', 'Activo')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm() }} className="border-gray-600 text-gray-300">
                  {t('취소', 'Cancelar')}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !form.term.trim()} className="gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {t('저장', 'Guardar')}
                </Button>
              </div>
            </Card>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <Card className="bg-gray-800/30 border-gray-700 p-10 text-center">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">{t('용어가 없습니다', 'No hay términos registrados')}</p>
              <p className="text-gray-500 text-sm mt-1">{t('추가 버튼을 눌러 첫 용어를 만드세요', 'Haz clic en "Agregar término" para comenzar')}</p>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/60">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('용어', 'Término')}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('동작', 'Acción')}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">{t('변환값', 'Traducción preferida')}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">{t('카테고리', 'Categoría')}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">{t('컨텍스트', 'Contexto')}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('상태', 'Estado')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => {
                    const action = actionMeta(entry.action)
                    return (
                      <tr key={entry.id} className={cn('border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors', !entry.is_active && 'opacity-50')}>
                        <td className="px-4 py-3">
                          <div className="font-mono text-white">{entry.term}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{entry.source_language.toUpperCase()} → {entry.target_language?.toUpperCase() ?? '*'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', action?.color ?? 'bg-gray-700 text-gray-300')}>
                            {action?.labelEs ?? entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-300 font-mono text-xs">
                            {entry.preferred_translation || <span className="text-gray-600 italic">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-gray-400 text-xs">{categoryLabel(entry.category)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-gray-500 text-xs">{entry.context ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('w-2 h-2 rounded-full inline-block', entry.is_active ? 'bg-green-400' : 'bg-gray-600')} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => startEdit(entry)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingId === entry.id}
                              className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              {deletingId === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 40 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="border-gray-600 text-gray-300">
                ←
              </Button>
              <span className="text-gray-400 text-sm">Pág. {page} de {Math.ceil(total / 40)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={entries.length < 40 || loading} className="border-gray-600 text-gray-300">
                →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Rules Tab ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">
              {t(
                '정규식 기반 변환 규칙 (번역 전/후 적용)',
                'Reglas regex aplicadas antes/después de la llamada a DeepSeek.'
              )}
            </p>
            <Button size="sm" onClick={() => { resetRuleForm(); setShowRuleForm(true) }} className="gap-1.5">
              <Plus className="w-4 h-4" />
              {t('규칙 추가', 'Nueva regla')}
            </Button>
          </div>

          {/* Rule form */}
          {showRuleForm && (
            <Card className="bg-gray-800/60 border-gray-600 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-primary" />
                  {editingRuleId ? t('규칙 수정', 'Editar regla') : t('새 규칙', 'Nueva regla regex')}
                </h3>
                <button onClick={() => { setShowRuleForm(false); resetRuleForm() }} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-gray-400">{t('규칙 이름 *', 'Nombre de la regla *')}</label>
                  <input type="text" value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Preserve YouTube links"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-gray-400">{t('정규식 패턴 *', 'Patrón regex *')}</label>
                  <input type="text" value={ruleForm.pattern} onChange={e => setRuleForm(f => ({ ...f, pattern: e.target.value }))}
                    placeholder="Ej: (https?://[^\s]+)"
                    className="w-full font-mono bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-gray-400">{t('대체값 *', 'Reemplazo *')}</label>
                  <input type="text" value={ruleForm.replacement} onChange={e => setRuleForm(f => ({ ...f, replacement: e.target.value }))}
                    placeholder="Ej: __URL_$1__ o $1$2"
                    className="w-full font-mono bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('적용 단계', 'Fase de aplicación')}</label>
                  <select value={ruleForm.phase} onChange={e => setRuleForm(f => ({ ...f, phase: e.target.value as 'pre' | 'post' }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                    <option value="pre">{t('번역 전 (pre)', 'Antes de traducir (pre)')}</option>
                    <option value="post">{t('번역 후 (post)', 'Después de traducir (post)')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">{t('플래그', 'Flags regex')}</label>
                  <input type="text" value={ruleForm.flags} onChange={e => setRuleForm(f => ({ ...f, flags: e.target.value }))}
                    placeholder="gi"
                    className="w-full font-mono bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowRuleForm(false); resetRuleForm() }} className="border-gray-600 text-gray-300">
                  {t('취소', 'Cancelar')}
                </Button>
                <Button size="sm" onClick={handleSaveRule} disabled={savingRule || !ruleForm.name.trim() || !ruleForm.pattern.trim()} className="gap-1.5">
                  {savingRule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {t('저장', 'Guardar')}
                </Button>
              </div>
            </Card>
          )}

          {/* Rules list */}
          {rulesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <Card className="bg-gray-800/30 border-gray-700 p-10 text-center">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">{t('등록된 규칙이 없습니다', 'No hay reglas registradas')}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <Card key={rule.id} className={cn('bg-gray-800/40 border-gray-700 p-4', !rule.is_active && 'opacity-50')}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{rule.name}</span>
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          rule.phase === 'pre' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300')}>
                          {rule.phase}
                        </span>
                        <span className="text-gray-500 text-xs">{rule.context ?? '—'}</span>
                        <span className={cn('w-1.5 h-1.5 rounded-full', rule.is_active ? 'bg-green-400' : 'bg-gray-500')} />
                      </div>
                      {rule.description && <p className="text-gray-400 text-xs">{rule.description}</p>}
                      <div className="flex gap-2 flex-wrap text-xs font-mono">
                        <span className="bg-gray-900 rounded px-2 py-0.5 text-amber-300">{rule.pattern}</span>
                        <span className="text-gray-500">→</span>
                        <span className="bg-gray-900 rounded px-2 py-0.5 text-green-300">{rule.replacement}</span>
                        <span className="text-gray-600">flags: {rule.flags}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEditRule(rule)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteRule(rule.id)} disabled={deletingRuleId === rule.id}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                        {deletingRuleId === rule.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
