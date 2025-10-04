'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/context/LanguageContext'

interface PostFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
  currentFilters: FilterOptions
}

export interface FilterOptions {
  sortBy: 'latest' | 'popular' | 'hot' | 'most_commented' | 'most_viewed'
  timeRange: 'all' | 'today' | 'week' | 'month'
  postType: 'all' | 'with_images' | 'text_only'
  status: 'all' | 'hot' | 'popular' | 'pinned'
  searchQuery: string
}

// PostFilters.tsx - 갤러리 시스템용 필터 컴포넌트 (GalleryPostList에서 사용)
export default function PostFilters({ onFilterChange, currentFilters }: PostFiltersProps) {
  const { t, language } = useLanguage()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchQuery, setSearchQuery] = useState(currentFilters.searchQuery || '')

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    onFilterChange({ ...currentFilters, sortBy })
  }

  const handleTimeRangeChange = (timeRange: FilterOptions['timeRange']) => {
    onFilterChange({ ...currentFilters, timeRange })
  }

  const handlePostTypeChange = (postType: FilterOptions['postType']) => {
    onFilterChange({ ...currentFilters, postType })
  }

  const handleStatusChange = (status: FilterOptions['status']) => {
    onFilterChange({ ...currentFilters, status })
  }

  const handleSearchSubmit = () => {
    onFilterChange({ ...currentFilters, searchQuery })
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    onFilterChange({ ...currentFilters, searchQuery: '' })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    onFilterChange({
      sortBy: 'latest',
      timeRange: 'all',
      postType: 'all',
      status: 'all',
      searchQuery: ''
    })
  }

  const getSortLabel = (sortBy: FilterOptions['sortBy']) => {
    switch (sortBy) {
      case 'latest': return t('community.galleryList.latest')
      case 'popular': return t('community.galleryList.popular')
      case 'hot': return t('community.galleryList.hot')
      case 'most_commented': return t('community.galleryList.mostCommented')
      case 'most_viewed': return t('community.galleryList.mostViewed')
      default: return t('community.galleryList.latest')
    }
  }

  const getTimeRangeLabel = (timeRange: FilterOptions['timeRange']) => {
    switch (timeRange) {
      case 'all': return t('community.galleryList.all')
      case 'today': return t('community.galleryList.today')
      case 'week': return t('community.galleryList.week')
      case 'month': return t('community.galleryList.month')
      default: return t('community.galleryList.all')
    }
  }

  const getPostTypeLabel = (postType: FilterOptions['postType']) => {
    switch (postType) {
      case 'all': return t('community.galleryList.all')
      case 'with_images': return t('community.galleryList.withImages')
      case 'text_only': return t('community.galleryList.textOnly')
      default: return t('community.galleryList.all')
    }
  }

  const getStatusLabel = (status: FilterOptions['status']) => {
    switch (status) {
      case 'all': return t('community.galleryList.all')
      case 'hot': return t('community.galleryList.hotPosts')
      case 'popular': return t('community.galleryList.popularPosts')
      case 'pinned': return t('community.galleryList.pinned')
      default: return t('community.galleryList.all')
    }
  }

  const hasActiveFilters = () => {
    return currentFilters.sortBy !== 'latest' ||
           currentFilters.timeRange !== 'all' ||
           currentFilters.postType !== 'all' ||
           currentFilters.status !== 'all' ||
           currentFilters.searchQuery !== ''
  }

  return (
    <div className="flex-1">
      <div className="space-y-4">
        {/* 기본 필터 - 한 줄로 배치 */}
        <div className="flex items-center gap-3">
          {/* 전체글 드롭다운 */}
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="전체글" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체글</SelectItem>
              <SelectItem value="kpop">K-POP</SelectItem>
              <SelectItem value="kdrama">K-Drama</SelectItem>
              <SelectItem value="beauty">뷰티</SelectItem>
              <SelectItem value="korean">한국어</SelectItem>
              <SelectItem value="spanish">스페인어</SelectItem>
            </SelectContent>
          </Select>
          
          {/* 최신순 드롭다운 */}
          <Select value={currentFilters.sortBy} onValueChange={(value: FilterOptions['sortBy']) => handleSortChange(value)}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t('community.galleryList.latest')}</SelectItem>
              <SelectItem value="popular">{t('community.galleryList.popular')}</SelectItem>
              <SelectItem value="hot">{t('community.galleryList.hot')}</SelectItem>
              <SelectItem value="most_commented">{t('community.galleryList.mostCommented')}</SelectItem>
              <SelectItem value="most_viewed">{t('community.galleryList.mostViewed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 검색 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">{t('community.galleryList.search')}:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('community.galleryList.searchPlaceholder')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
          />
          <Button
            onClick={handleSearchSubmit}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            {t('community.galleryList.search')}
          </Button>
          {searchQuery && (
            <Button
              onClick={handleSearchClear}
              variant="outline"
              size="sm"
            >
              {t('community.galleryList.clear')}
            </Button>
          )}
        </div>

        {/* 고급 필터 토글 */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="sm"
          >
            {showAdvanced ? t('community.galleryList.simpleView') : t('community.galleryList.advancedFilters')}
          </Button>
          
          {hasActiveFilters() && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
{t('community.galleryList.clearFilters')}
            </Button>
          )}
        </div>

        {/* 고급 필터 */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* 시간 범위 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">{t('community.galleryList.period')}:</span>
              {(['all', 'today', 'week', 'month'] as const).map((timeRange) => (
                <Button
                  key={timeRange}
                  onClick={() => handleTimeRangeChange(timeRange)}
                  variant={currentFilters.timeRange === timeRange ? 'default' : 'outline'}
                  size="sm"
                  className={currentFilters.timeRange === timeRange ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {getTimeRangeLabel(timeRange)}
                </Button>
              ))}
            </div>

            {/* 게시물 타입 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">{t('community.galleryList.type')}:</span>
              {(['all', 'with_images', 'text_only'] as const).map((postType) => (
                <Button
                  key={postType}
                  onClick={() => handlePostTypeChange(postType)}
                  variant={currentFilters.postType === postType ? 'default' : 'outline'}
                  size="sm"
                  className={currentFilters.postType === postType ? 'bg-purple-500 hover:bg-purple-600' : ''}
                >
                  {getPostTypeLabel(postType)}
                </Button>
              ))}
            </div>

            {/* 상태 필터 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">{t('community.galleryList.status')}:</span>
              {(['all', 'hot', 'popular', 'pinned'] as const).map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  variant={currentFilters.status === status ? 'default' : 'outline'}
                  size="sm"
                  className={currentFilters.status === status ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {getStatusLabel(status)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 활성 필터 표시 */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">{t('community.galleryList.appliedFilters')}:</span>
            
            {currentFilters.sortBy !== 'latest' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
{t('community.galleryList.sort')}: {getSortLabel(currentFilters.sortBy)}
              </Badge>
            )}
            
            {currentFilters.timeRange !== 'all' && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
{t('community.galleryList.period')}: {getTimeRangeLabel(currentFilters.timeRange)}
              </Badge>
            )}
            
            {currentFilters.postType !== 'all' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
{t('community.galleryList.type')}: {getPostTypeLabel(currentFilters.postType)}
              </Badge>
            )}
            
            {currentFilters.status !== 'all' && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
{t('community.galleryList.status')}: {getStatusLabel(currentFilters.status)}
              </Badge>
            )}
            
            {currentFilters.searchQuery && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
{t('community.galleryList.search')}: "{currentFilters.searchQuery}"
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
