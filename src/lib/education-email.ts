// Education Email Notifications utility
// Uses the existing SMTP infrastructure from emailService.ts

async function sendRealEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtps.hiworks.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '465')
    const smtpUser = process.env.SMTP_USER || ''
    const smtpPass = process.env.SMTP_PASS || ''
    const smtpFrom = process.env.SMTP_FROM || `"AMIKO Education" <${smtpUser}>`

    if (!smtpUser || !smtpPass) {
      console.warn('[EDU_EMAIL] SMTP not configured, skipping email')
      return false
    }

    // Use nodemailer if available, otherwise fetch-based
    try {
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      })

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html
      })

      console.log(`[EDU_EMAIL] Sent to ${to}: ${subject}`)
      return true
    } catch {
      console.warn('[EDU_EMAIL] nodemailer not available, email skipped')
      return false
    }
  } catch (err) {
    console.error('[EDU_EMAIL] Error:', err)
    return false
  }
}

export async function sendEducationReminderEmail(
  email: string,
  studentName: string,
  courseTitle: string,
  sessionTitle: string,
  sessionNumber: number,
  scheduledAt: string,
  reminderType: '24h' | '1h' | '15min'
): Promise<boolean> {
  const timeLabel = reminderType === '24h' ? '24 horas'
    : reminderType === '1h' ? '1 hora' : '15 minutos'

  const formattedDate = new Date(scheduledAt).toLocaleString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const subject = `⏰ Tu clase "${courseTitle}" comienza en ${timeLabel}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8B5CF6, #3B82F6); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px; }
    .course-card { background: #F5F3FF; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #8B5CF6; }
    .course-card h3 { margin: 0 0 8px; color: #6D28D9; }
    .course-card p { margin: 4px 0; color: #4B5563; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #3B82F6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 AMIKO Education</h1>
      <p>Recordatorio de clase</p>
    </div>
    <div class="content">
      <p>Hola <strong>${studentName}</strong>,</p>
      <p>Tu clase comienza en <strong>${timeLabel}</strong>.</p>
      
      <div class="course-card">
        <h3>${courseTitle}</h3>
        <p>📚 Sesión ${sessionNumber}: ${sessionTitle}</p>
        <p>📅 ${formattedDate}</p>
      </div>
      
      <p>Asegúrate de tener una buena conexión a internet y un espacio tranquilo para la clase.</p>
      
      <center>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://helloamiko.com'}/education" class="cta-button">
          Ir a Educación
        </a>
      </center>
    </div>
    <div class="footer">
      <p>AMIKO - Plataforma educativa de intercambio cultural</p>
    </div>
  </div>
</body>
</html>`

  return sendRealEmail(email, subject, html)
}

export async function sendCertificateEmail(
  email: string,
  studentName: string,
  courseTitle: string,
  certificateUrl: string
): Promise<boolean> {
  const subject = `🎓 ¡Certificado disponible! - ${courseTitle}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8B5CF6, #3B82F6); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 32px; text-align: center; }
    .badge { display: inline-block; background: #FEF3C7; color: #92400E; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 16px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #3B82F6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 ¡Felicidades!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${studentName}</strong>,</p>
      <p>Has completado exitosamente el curso:</p>
      <div class="badge">🎓 ${courseTitle}</div>
      <p>Tu certificado de finalización está listo para descargar.</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://helloamiko.com'}${certificateUrl}" class="cta-button">
        Descargar Certificado
      </a>
    </div>
    <div class="footer">
      <p>AMIKO - Plataforma educativa de intercambio cultural</p>
    </div>
  </div>
</body>
</html>`

  return sendRealEmail(email, subject, html)
}

export async function sendRefundEmail(
  email: string,
  studentName: string,
  courseTitle: string,
  amount: number
): Promise<boolean> {
  const subject = `💰 Reembolso procesado - ${courseTitle}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: #1F2937; padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 32px; }
    .amount { font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AMIKO Education</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${studentName}</strong>,</p>
      <p>Tu reembolso para el curso <strong>"${courseTitle}"</strong> ha sido procesado exitosamente.</p>
      <div class="amount">$${amount.toFixed(2)} USD</div>
      <p>El reembolso será reflejado en tu cuenta de PayPal en 5-10 días hábiles.</p>
    </div>
    <div class="footer">
      <p>AMIKO - Plataforma educativa de intercambio cultural</p>
    </div>
  </div>
</body>
</html>`

  return sendRealEmail(email, subject, html)
}
