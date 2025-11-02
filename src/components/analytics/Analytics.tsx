'use client'

import Script from 'next/script'

// GA4 직접 측정 (GTM 우회)
const GA4_MEASUREMENT_ID = 'G-5RM3B0CKWJ'

export default function Analytics() {
  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        id="ga4-measurement"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}
