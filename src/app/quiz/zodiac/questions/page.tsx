'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'

export default function ZodiacQuestionsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')

  const handleSubmit = () => {
    if (!year || !month || !day) {
      alert(language === 'ko' ? '모든 정보를 입력해주세요.' : 'Por favor completa todos los campos.')
      return
    }

    // LocalStorage에 저장
    localStorage.setItem('zodiac-birthdate', JSON.stringify({ year, month, day }))
    
    // Loading 페이지로 이동
    router.push('/quiz/zodiac/loading')
  }

  // Generate year options (1900 - 현재)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)
  
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* 제목 */}
          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
            {language === 'ko' ? '생년월일을 입력해주세요' : 'Ingresa tu Fecha de Nacimiento'}
          </h1>

          {/* 날짜 입력 폼 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg mb-6">
            <div className="space-y-6">
              {/* 연도 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'ko' ? '연도' : 'Año'}
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                >
                  <option value="">{language === 'ko' ? '연도 선택' : 'Selecciona el año'}</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* 월 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'ko' ? '월' : 'Mes'}
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                >
                  <option value="">{language === 'ko' ? '월 선택' : 'Selecciona el mes'}</option>
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* 일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'ko' ? '일' : 'Día'}
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                >
                  <option value="">{language === 'ko' ? '일 선택' : 'Selecciona el día'}</option>
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {language === 'ko' ? '띠 확인하기' : 'Descubrir mi Signo'}
          </button>
        </div>
      </div>

      <BottomTabNavigation />
    </div>
  )
}

