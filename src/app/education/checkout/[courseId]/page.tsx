'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GraduationCap, BookOpen, Clock, Users, CheckCircle,
  ArrowLeft, ShieldCheck, XCircle
} from 'lucide-react'
import type { EducationCourse } from '@/types/education'

export default function EducationCheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const { te } = useEducationTranslation()
  const [course, setCourse] = useState<EducationCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  // Capture payment after PayPal redirect
  const capturePayment = useCallback(async (paypalOrderId: string, cId: string) => {
    setProcessing(true)
    setError('')
    try {
      const captureRes = await fetch(`/api/education/courses/${cId}/payments/paypal/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paypal_order_id: paypalOrderId })
      })

      if (captureRes.ok) {
        setSuccess(true)
      } else {
        const captureData = await captureRes.json()
        setError(captureData.error || te('education.payment.failed'))
      }
    } catch {
      setError(te('education.payment.failed'))
    } finally {
      setProcessing(false)
    }
  }, [te, token])

  useEffect(() => {
    if (!user?.id) {
      router.push('/sign-in?redirectTo=/education/checkout/' + courseId)
      return
    }

    // Check if returning from PayPal approval
    const status = searchParams.get('status')
    const paypalToken = searchParams.get('token') // PayPal appends token=ORDER_ID

    if (status === 'cancel') {
      setCancelled(true)
      setLoading(false)
      return
    }

    if (status === 'success' && paypalToken) {
      // User approved on PayPal — capture the payment
      capturePayment(paypalToken, courseId)
    }

    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/education/courses/${courseId}`)
        const data = await res.json()
        setCourse(data.course)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [courseId, user?.id, router, searchParams, capturePayment])

  const handleFreeEnroll = async () => {
    if (!course || !user) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch(`/api/education/courses/${course.id}/enroll-free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || te('education.payment.failed'))
      }
    } catch {
      setError(te('education.payment.failed'))
    } finally {
      setProcessing(false)
    }
  }

  const handlePayPalPayment = async () => {
    if (!course || !user) return
    setProcessing(true)
    setError('')

    try {
      // Create PayPal order — returns approve_url for redirect
      const createRes = await fetch(`/api/education/courses/${course.id}/payments/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customer_name: user.user_metadata?.display_name,
          customer_email: user.email
        })
      })

      const createData = await createRes.json()

      if (!createRes.ok) {
        setError(createData.error || te('education.payment.failed'))
        setProcessing(false)
        return
      }

      // Redirect to PayPal for user approval
      if (createData.approve_url) {
        window.location.href = createData.approve_url
        // Don't setProcessing(false) — page will navigate away
      } else {
        setError(te('education.payment.failed'))
        setProcessing(false)
      }
    } catch {
      setError(te('education.payment.failed'))
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {te('education.payment.success')}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {te('education.course.enrolled')}
        </p>
        <Button onClick={() => router.push(`/education/course/${course?.slug || course?.id || courseId}`)}>
          {te('education.course.goToCourse')}
        </Button>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {te('education.payment.cancelled')}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {te('education.payment.cancelledDescription')}
        </p>
        <Button variant="outline" onClick={() => router.push(`/education/course/${courseId}`)}>
          {te('education.certificate.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {te('education.form.cancel')}
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">{te('education.payment.title')}</h1>

        {/* Order Summary */}
        <Card className="border-border/50 mb-6">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground">{te('education.payment.orderSummary')}</h3>

            <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <GraduationCap className="w-8 h-8 text-primary/30" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{course.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {course.instructor?.display_name}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-0.5">
                    <BookOpen className="w-3 h-3" />
                    {course.total_classes}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {course.class_duration_minutes}min
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {course.enrolled_count}/{course.max_students}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <span className="font-medium text-foreground">{te('education.payment.totalAmount')}</span>
              <span className="text-2xl font-bold text-foreground">
                {Number(course.price_usd) === 0 ? (
                  <span className="text-green-600">{te('education.course.free') || 'Gratis'}</span>
                ) : (
                  `$${course.price_usd}`
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Enroll / Pay Button */}
        {Number(course.price_usd) === 0 ? (
          <Button
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
            onClick={handleFreeEnroll}
            disabled={processing}
          >
            {processing ? (
              te('education.payment.processing')
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                {te('education.course.enrollFree') || 'Inscribirse gratis'}
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              className="w-full h-12 text-base"
              onClick={handlePayPalPayment}
              disabled={processing}
            >
              {processing ? (
                te('education.payment.processing')
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  {te('education.payment.payWithPaypal')} — ${course.price_usd}
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              {te('education.securePayment')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
