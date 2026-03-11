'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { useLanguage } from '@/context/LanguageContext'
import { ArrowLeft, Download, Printer, GraduationCap } from 'lucide-react'

interface CertificateData {
  enrollment_id: string
  student_name: string
  student_avatar: string | null
  course_title: string
  course_category: string
  course_level: string
  teaching_language: string
  total_classes: number
  class_duration_minutes: number
  instructor_name: string
  instructor_verified: boolean
  completed_at: string
  enrolled_at: string
  certificate_id: string
}

export default function CertificatePage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>()
  const router = useRouter()
  const { te } = useEducationTranslation()
  const { language } = useLanguage()
  const certRef = useRef<HTMLDivElement>(null)
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(`/api/education/certificates?enrollmentId=${enrollmentId}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || te('education.certificate.notFound'))
          setLoading(false)
          return
        }
        setCertificate(data.certificate)
      } catch {
        setError(te('education.certificate.loadError'))
      } finally {
        setLoading(false)
      }
    }
    if (enrollmentId) fetchCertificate()
  }, [enrollmentId])

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalHours = certificate
    ? Math.round((certificate.total_classes * certificate.class_duration_minutes) / 60)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Skeleton className="w-full max-w-[800px] h-[560px] rounded-2xl" />
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <GraduationCap className="w-16 h-16 text-gray-300" />
        <p className="text-lg text-gray-600 dark:text-gray-400">{error || te('education.certificate.notFound')}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {te('education.certificate.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      {/* Action Bar (hidden in print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {te('education.certificate.back')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {te('education.certificate.print')}
          </Button>
          <Button onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" />
            {te('education.certificate.download')}
          </Button>
        </div>
      </div>

      {/* Certificate */}
      <div
        ref={certRef}
        data-certificate
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
      >
        {/* Certificate Content */}
        <div className="relative p-12 md:p-16">
          {/* Decorative border */}
          <div className="absolute inset-4 border-2 border-purple-200 rounded-xl pointer-events-none" />
          <div className="absolute inset-6 border border-purple-100 rounded-lg pointer-events-none" />

          {/* Corner decorations */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-purple-500 rounded-tl-lg" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-purple-500 rounded-tr-lg" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-purple-500 rounded-bl-lg" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-purple-500 rounded-br-lg" />

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AMIKO
              </span>
            </div>
            <h1 className="text-sm font-medium tracking-[0.3em] uppercase text-gray-400 mb-2">
              {te('education.certificate.platformSubtitle')}
            </h1>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {te('education.certificate.completionTitle')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full" />
          </div>

          {/* Body */}
          <div className="text-center space-y-6 relative z-10">
            <p className="text-gray-500 text-sm">{te('education.certificate.certifyThat')}</p>
            <p className="text-3xl font-bold text-gray-800 font-serif">
              {certificate.student_name}
            </p>
            <p className="text-gray-500 text-sm">{te('education.certificate.hasCompleted')}</p>
            <p className="text-2xl font-semibold text-purple-700">
              {certificate.course_title}
            </p>

            {/* Course Details */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>{certificate.total_classes} {te('education.certificate.classes')}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{totalHours} {te('education.certificate.hours')}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{te('education.certificate.level')}: {certificate.course_level === 'basic' ? te('education.certificate.levelBasic') : certificate.course_level === 'intermediate' ? te('education.certificate.levelIntermediate') : te('education.certificate.levelAdvanced')}</span>
            </div>

            {/* Date */}
            <div className="pt-4">
              <p className="text-gray-500 text-sm">
                {te('education.certificate.dateLabel')}: <span className="font-medium text-gray-700">{formatDate(certificate.completed_at)}</span>
              </p>
            </div>
          </div>

          {/* Footer - Instructor & ID */}
          <div className="mt-12 flex items-end justify-between relative z-10">
            <div className="text-center">
              <div className="w-48 border-t-2 border-gray-300 pt-2">
                <p className="font-medium text-gray-700">{certificate.instructor_name}</p>
                <p className="text-xs text-gray-400">
                  {te('education.certificate.instructorLabel')} {certificate.instructor_verified ? `✓ ${te('education.certificate.verified')}` : ''}
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-48 border-t-2 border-gray-300 pt-2">
                <p className="font-medium text-gray-700">AMIKO Education</p>
                <p className="text-xs text-gray-400">{te('education.certificate.platform')}</p>
              </div>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="mt-6 text-center relative z-10">
            <p className="text-[10px] text-gray-300 tracking-wider">
              ID: {certificate.certificate_id}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [data-certificate],
          [data-certificate] * {
            visibility: visible;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
