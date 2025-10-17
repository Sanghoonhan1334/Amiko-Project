import { Resend } from 'resend';

// 환경변수가 없으면 빌드 시점에 오류를 방지하기 위해 조건부로 생성
let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('[EMAIL SERVICE] RESEND_API_KEY가 설정되지 않았습니다. 이메일 기능이 비활성화됩니다.');
}

export interface EmailTemplateData {
  // payment_confirmed
  amount?: number;
  paymentMethod?: string;
  consultantName?: string;
  bookingDate?: string;
  duration?: number;
  
  // payment_cancelled
  refundAmount?: number;
  cancelReason?: string;
  
  // new_booking
  topic?: string;
  startTime?: string;
  customerName?: string;
  
  // consultation_reminder
  reminderTime?: string;
  consultantSpecialty?: string;
  
  // admin_notification
  notificationType?: string;
  title?: string;
  message?: string;
  priority?: string;
  data?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  /**
   * 결제 완료 이메일 발송
   */
  async sendPaymentConfirmedEmail(
    to: string,
    data: {
      amount: number;
      paymentMethod: string;
      consultantName: string;
      bookingDate: string;
      duration: number;
    }
  ): Promise<EmailResult> {
    // Resend가 초기화되지 않았으면 오류 반환
    if (!resend) {
      console.warn('[EMAIL SERVICE] Resend가 초기화되지 않았습니다. 이메일을 발송할 수 없습니다.');
      return { success: false, error: '이메일 서비스가 설정되지 않았습니다.' };
    }

    try {
      const { data: result, error } = await resend.emails.send({
        from: 'Oz Coding School <noreply@ozcodingschool.com>',
        to: [to],
        subject: '✅ 결제 완료 - 상담 예약이 확정되었습니다',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">🎉 결제 완료!</h2>
            <p>안녕하세요! 상담 예약 결제가 성공적으로 완료되었습니다.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 예약 정보</h3>
              <p><strong>상담사:</strong> ${data.consultantName}</p>
              <p><strong>예약 일시:</strong> ${data.bookingDate}</p>
              <p><strong>상담 시간:</strong> ${data.duration}분</p>
              <p><strong>결제 금액:</strong> ${data.amount.toLocaleString()}원</p>
              <p><strong>결제 방법:</strong> ${data.paymentMethod}</p>
            </div>
            
            <p>상담 전 준비사항이나 문의사항이 있으시면 언제든 연락주세요.</p>
            <p>감사합니다!</p>
          </div>
        `
      });

      if (error) {
        console.error('❌ 이메일 발송 실패:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: result?.id };
    } catch (error) {
      console.error('❌ 이메일 발송 중 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }

  /**
   * 결제 취소 이메일 발송
   */
  async sendPaymentCancelledEmail(
    to: string,
    data: {
      consultantName: string;
      bookingDate: string;
      duration: number;
      refundAmount: number;
      cancelReason: string;
    }
  ): Promise<EmailResult> {
    // Resend가 초기화되지 않았으면 오류 반환
    if (!resend) {
      console.warn('[EMAIL SERVICE] Resend가 초기화되지 않았습니다. 이메일을 발송할 수 없습니다.');
      return { success: false, error: '이메일 서비스가 설정되지 않았습니다.' };
    }

    try {
      const { data: result, error } = await resend.emails.send({
        from: 'Oz Coding School <noreply@ozcodingschool.com>',
        to: [to],
        subject: '❌ 결제 취소 - 상담 예약이 취소되었습니다',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">결제 취소 완료</h2>
            <p>안녕하세요! 상담 예약 결제가 취소되었습니다.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 취소 정보</h3>
              <p><strong>상담사:</strong> ${data.consultantName}</p>
              <p><strong>예약 일시:</strong> ${data.bookingDate}</p>
              <p><strong>상담 시간:</strong> ${data.duration}분</p>
              <p><strong>환불 금액:</strong> ${data.refundAmount.toLocaleString()}원</p>
              <p><strong>취소 사유:</strong> ${data.cancelReason}</p>
            </div>
            
            <p>환불은 3-5일 내에 처리됩니다. 추가 문의사항이 있으시면 연락주세요.</p>
            <p>감사합니다!</p>
          </div>
        `
      });

      if (error) {
        console.error('❌ 이메일 발송 실패:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: result?.id };
    } catch (error) {
      console.error('❌ 이메일 발송 중 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }

  /**
   * 새 예약 알림 이메일 발송 (상담사용)
   */
  async sendNewBookingEmail(
    to: string,
    data: {
      customerName: string;
      bookingDate: string;
      duration: number;
      amount: number;
    }
  ): Promise<EmailResult> {
    // Resend가 초기화되지 않았으면 오류 반환
    if (!resend) {
      console.warn('[EMAIL SERVICE] Resend가 초기화되지 않았습니다. 이메일을 발송할 수 없습니다.');
      return { success: false, error: '이메일 서비스가 설정되지 않았습니다.' };
    }

    try {
      const { data: result, error } = await resend.emails.send({
        from: 'Oz Coding School <noreply@ozcodingschool.com>',
        to: [to],
        subject: '🎉 새로운 상담 예약이 있습니다',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">새로운 예약!</h2>
            <p>안녕하세요! 새로운 상담 예약이 들어왔습니다.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 예약 정보</h3>
              <p><strong>고객명:</strong> ${data.customerName}</p>
              <p><strong>예약 일시:</strong> ${data.bookingDate}</p>
              <p><strong>상담 시간:</strong> ${data.duration}분</p>
              <p><strong>결제 금액:</strong> ${data.amount.toLocaleString()}원</p>
            </div>
            
            <p>예약 일정을 확인하고 준비해주세요.</p>
            <p>감사합니다!</p>
          </div>
        `
      });

      if (error) {
        console.error('❌ 이메일 발송 실패:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: result?.id };
    } catch (error) {
      console.error('❌ 이메일 발송 중 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }

  /**
   * 상담 리마인더 이메일 발송 (고객용)
   */
  async sendConsultationReminderEmail(
    to: string,
    data: {
      consultantName: string;
      bookingDate: string;
      duration: number;
      consultantSpecialty: string;
    }
  ): Promise<EmailResult> {
    // Resend가 초기화되지 않았으면 오류 반환
    if (!resend) {
      console.warn('[EMAIL SERVICE] Resend가 초기화되지 않았습니다. 이메일을 발송할 수 없습니다.');
      return { success: false, error: '이메일 서비스가 설정되지 않았습니다.' };
    }

    try {
      const { data: result, error } = await resend.emails.send({
        from: 'Oz Coding School <noreply@ozcodingschool.com>',
        to: [to],
        subject: '⏰ 상담 리마인더 - 내일 상담 예정입니다',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffa500;">⏰ 상담 리마인더</h2>
            <p>안녕하세요! 내일 예정된 상담을 잊지 마세요.</p>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffa500;">
              <h3>📅 상담 정보</h3>
              <p><strong>상담사:</strong> ${data.consultantName}</p>
              <p><strong>전문 분야:</strong> ${data.consultantSpecialty}</p>
              <p><strong>상담 일시:</strong> ${data.bookingDate}</p>
              <p><strong>상담 시간:</strong> ${data.duration}분</p>
            </div>
            
            <div style="background: #e7f1ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>💡 상담 준비 팁</h3>
              <ul>
                <li>궁금한 점들을 미리 정리해보세요</li>
                <li>안정적인 인터넷 환경을 확인해주세요</li>
                <li>조용한 장소에서 상담받으시길 권합니다</li>
                <li>상담 5분 전에 미리 접속해주세요</li>
              </ul>
            </div>
            
            <p>좋은 상담이 되시길 바랍니다!</p>
          </div>
        `
      });

      if (error) {
        console.error('❌ 이메일 발송 실패:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: result?.id };
    } catch (error) {
      console.error('❌ 이메일 발송 중 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }

  /**
   * 상담 리마인더 이메일 발송 (상담사용)
   */
  async sendConsultationReminderConsultantEmail(
    to: string,
    data: {
      customerName: string;
      bookingDate: string;
      duration: number;
    }
  ): Promise<EmailResult> {
    // Resend가 초기화되지 않았으면 오류 반환
    if (!resend) {
      console.warn('[EMAIL SERVICE] Resend가 초기화되지 않았습니다. 이메일을 발송할 수 없습니다.');
      return { success: false, error: '이메일 서비스가 설정되지 않았습니다.' };
    }

    try {
      const { data: result, error } = await resend.emails.send({
        from: 'Oz Coding School <noreply@ozcodingschool.com>',
        to: [to],
        subject: '⏰ 상담 리마인더 - 내일 상담 예정입니다',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffa500;">⏰ 상담 리마인더</h2>
            <p>안녕하세요! 내일 예정된 상담을 안내드립니다.</p>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffa500;">
              <h3>📅 상담 정보</h3>
              <p><strong>고객명:</strong> ${data.customerName}</p>
              <p><strong>상담 일시:</strong> ${data.bookingDate}</p>
              <p><strong>상담 시간:</strong> ${data.duration}분</p>
            </div>
            
            <div style="background: #e7f1ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 상담 준비 사항</h3>
              <ul>
                <li>고객의 배경과 요청사항을 미리 확인해보세요</li>
                <li>상담 자료나 참고 링크를 준비해주세요</li>
                <li>안정적인 인터넷 환경을 확인해주세요</li>
                <li>상담 5분 전에 미리 접속해주세요</li>
              </ul>
            </div>
            
            <p>좋은 상담이 되시길 바랍니다!</p>
          </div>
        `
      });

      if (error) {
        console.error('❌ 이메일 발송 실패:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: result?.id };
    } catch (error) {
      console.error('❌ 이메일 발송 중 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }

  /**
   * 관리자 알림 이메일 발송
   */
  async sendAdminNotificationEmail(
    to: string,
    data: {
      notificationType: string;
      title: string;
      message: string;
      priority: string;
      data?: string;
    }
  ): Promise<EmailResult> {
    // Resend가 초기화되지 않았으면 오류 반환
    if (!resend) {
      console.warn('[EMAIL SERVICE] Resend가 초기화되지 않았습니다. 이메일을 발송할 수 없습니다.');
      return { success: false, error: '이메일 서비스가 설정되지 않았습니다.' };
    }

    try {
      const priorityColors = {
        low: '#6b7280',
        normal: '#3b82f6',
        high: '#f59e0b',
        urgent: '#ef4444'
      };

      const priorityColor = priorityColors[data.priority as keyof typeof priorityColors] || '#3b82f6';

      const { data: result, error } = await resend.emails.send({
        from: 'Oz Coding School <noreply@ozcodingschool.com>',
        to: [to],
        subject: `🔔 [${data.priority.toUpperCase()}] ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${priorityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; color: white;">🔔 관리자 알림</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">우선순위: ${data.priority.toUpperCase()}</p>
            </div>
            
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <h3 style="color: ${priorityColor}; margin-top: 0;">${data.title}</h3>
              <p style="line-height: 1.6;">${data.message}</p>
              
              ${data.data ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <h4 style="margin-top: 0; color: #374151;">📋 상세 정보</h4>
                  <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; color: #374151;">${data.data}</pre>
                </div>
              ` : ''}
              
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  이 알림은 자동으로 발송되었습니다.<br>
                  관리자 패널에서 자세한 내용을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        `
      });

      if (error) {
        console.error('❌ 이메일 발송 실패:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: result?.id };
    } catch (error) {
      console.error('❌ 이메일 발송 중 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }

  /**
   * 통합 이메일 발송 메서드
   */
  async sendNotificationEmail(
    to: string,
    template: 'payment_confirmed' | 'payment_cancelled' | 'new_booking' | 'consultation_reminder' | 'consultation_reminder_consultant' | 'admin_notification',
    data: EmailTemplateData
  ): Promise<EmailResult> {
    switch (template) {
      case 'payment_confirmed':
        if (!data.amount || !data.paymentMethod || !data.consultantName || !data.bookingDate || !data.duration) {
          return { success: false, error: 'payment_confirmed 템플릿에 필요한 데이터가 누락되었습니다' };
        }
        return this.sendPaymentConfirmedEmail(to, {
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          consultantName: data.consultantName,
          bookingDate: data.bookingDate,
          duration: data.duration
        });
      case 'payment_cancelled':
        if (!data.consultantName || !data.bookingDate || !data.duration || !data.refundAmount || !data.cancelReason) {
          return { success: false, error: 'payment_cancelled 템플릿에 필요한 데이터가 누락되었습니다' };
        }
        return this.sendPaymentCancelledEmail(to, {
          consultantName: data.consultantName,
          bookingDate: data.bookingDate,
          duration: data.duration,
          refundAmount: data.refundAmount,
          cancelReason: data.cancelReason
        });
      case 'new_booking':
        if (!data.customerName || !data.bookingDate || !data.duration || !data.amount) {
          return { success: false, error: 'new_booking 템플릿에 필요한 데이터가 누락되었습니다' };
        }
        return this.sendNewBookingEmail(to, {
          customerName: data.customerName,
          bookingDate: data.bookingDate,
          duration: data.duration,
          amount: data.amount
        });
      case 'consultation_reminder':
        if (!data.consultantName || !data.bookingDate || !data.duration || !data.consultantSpecialty) {
          return { success: false, error: 'consultation_reminder 템플릿에 필요한 데이터가 누락되었습니다' };
        }
        return this.sendConsultationReminderEmail(to, {
          consultantName: data.consultantName,
          bookingDate: data.bookingDate,
          duration: data.duration,
          consultantSpecialty: data.consultantSpecialty
        });
      case 'consultation_reminder_consultant':
        if (!data.customerName || !data.bookingDate || !data.duration) {
          return { success: false, error: 'consultation_reminder_consultant 템플릿에 필요한 데이터가 누락되었습니다' };
        }
        return this.sendConsultationReminderConsultantEmail(to, {
          customerName: data.customerName,
          bookingDate: data.bookingDate,
          duration: data.duration
        });
      case 'admin_notification':
        if (!data.notificationType || !data.title || !data.message || !data.priority) {
          return { success: false, error: 'admin_notification 템플릿에 필요한 데이터가 누락되었습니다' };
        }
        return this.sendAdminNotificationEmail(to, {
          notificationType: data.notificationType,
          title: data.title,
          message: data.message,
          priority: data.priority,
          data: data.data
        });
      default:
        return { success: false, error: '알 수 없는 이메일 템플릿' };
    }
  }
}

export const emailService = new EmailService();

// 인증 이메일 발송 함수
export async function sendVerificationEmail(email: string, code: string, language: 'ko' | 'es' = 'ko'): Promise<boolean> {
  try {
    // Resend가 초기화되지 않았으면 오류 반환
    if (!resend) {
      console.warn('[EMAIL SERVICE] Resend가 초기화되지 않았습니다. 이메일을 발송할 수 없습니다.');
      return false;
    }

    const { data: result, error } = await resend.emails.send({
      from: 'Amiko <noreply@helloamiko.com>',
      to: [email],
      subject: language === 'ko' ? 'Amiko 인증코드' : 'Código de verificación Amiko',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">${language === 'ko' ? '🎉 인증코드가 발송되었습니다!' : '🎉 ¡Código de verificación enviado!'}</h2>
          <p>${language === 'ko' ? '안녕하세요! 아래 인증코드를 입력해주세요.' : '¡Hola! Por favor ingresa el siguiente código de verificación.'}</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h1>
          </div>
          
          <p>${language === 'ko' ? '이 코드는 10분 후 만료됩니다.' : 'Este código expirará en 10 minutos.'}</p>
          <p>${language === 'ko' ? '감사합니다!' : '¡Gracias!'}</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ 이메일 발송 실패:', error);
      return false;
    }

    console.log('✅ 인증 이메일 발송 성공:', result?.id);
    return true;
  } catch (error) {
    console.error('인증 이메일 발송 실패:', error);
    return false;
  }
}

// 이메일 서비스 상태 확인 함수
export function getEmailServiceStatus(): { available: boolean; service: string; error?: string } {
  if (!resend) {
    return { available: false, service: 'resend', error: '이메일 서비스가 설정되지 않았습니다.' };
  }
  return { available: true, service: 'resend' };
}
