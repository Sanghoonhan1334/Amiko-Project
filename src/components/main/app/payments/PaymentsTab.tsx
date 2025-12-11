'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Receipt, DollarSign } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import PayPalPaymentButton from '@/components/payments/PayPalPaymentButton'

export default function PaymentsTab() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  // Sample payment options - you can customize these
  const paymentOptions = [
    {
      id: 'vip_monthly',
      name: t('payments.vipMonthly'),
      amount: 9.99,
      description: t('payments.vipMonthlyDesc'),
      orderId: `vip_monthly_${Date.now()}`,
      orderName: 'VIP Monthly Subscription'
    },
    {
      id: 'vip_yearly',
      name: t('payments.vipYearly'),
      amount: 99.99,
      description: t('payments.vipYearlyDesc'),
      orderId: `vip_yearly_${Date.now()}`,
      orderName: 'VIP Yearly Subscription'
    }
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('payments.loginRequired')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('payments.loginRequiredDescription')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('payments.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('payments.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {paymentOptions.map((option) => (
          <Card key={option.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                {option.name}
              </CardTitle>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-lg font-bold">
                  ${option.amount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {option.description}
              </p>

              <PayPalPaymentButton
                amount={option.amount}
                orderId={option.orderId}
                orderName={option.orderName}
                customerName={user?.user_metadata?.full_name || user?.email || ''}
                customerEmail={user?.email || ''}
                className="w-full"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {t('payments.paymentHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {t('payments.paymentHistoryEmpty')}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.open('/payments', '_blank')}
            >
              {t('payments.viewFullHistory')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
