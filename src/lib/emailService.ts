import nodemailer from 'nodemailer'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailOptions {
  to: string
  template: EmailTemplate
  data?: Record<string, any>
}

// 이메일 템플릿 생성
export function createEmailTemplate(type: 'verification' | 'passwordReset' | 'passwordResetVerification' | 'new_inquiry' | 'new_partnership_inquiry', data: Record<string, any>, language: 'ko' | 'es' = 'ko'): EmailTemplate {
  switch (type) {
    case 'passwordResetVerification':
      if (language === 'es') {
        return {
          subject: `[AMIKO] Código de verificación para restablecer contraseña`,
          html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Restablecer Contraseña - AMIKO</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px 30px; }
                .verification-code { text-align: center; margin: 30px 0; }
                .verification-code .code { font-size: 64px; font-weight: 900; color: #000000; letter-spacing: 10px; margin: 20px 0; font-family: Arial, sans-serif; }
                .verification-code .expires { color: #666666; font-size: 18px; margin-top: 15px; font-weight: bold; }
                .info { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                .info h3 { margin: 0 0 10px 0; color: #856404; font-size: 16px; }
                .info p { margin: 0; color: #856404; font-size: 14px; line-height: 1.5; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .footer a { color: #667eea; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🇰🇷🇲🇽 AMIKO</h1>
                  <p>El comienzo del intercambio cultural entre Corea y Centroamérica</p>
                </div>
                
                <div class="content">
                  <h2>Restablecer Contraseña</h2>
                  
                  <p>Hola,</p>
                  
                  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de <strong>AMIKO</strong>.</p>
                  
                  <p>Para restablecer tu contraseña, por favor ingresa el código de verificación a continuación:</p>
                  
                  <div class="verification-code">
                    <div class="code">${data.code}</div>
                    <div class="expires">⏰ Este código expira en 5 minutos</div>
                  </div>
                  
                  <div class="info">
                    <h3>🔒 Información de Seguridad</h3>
                    <p>• Este código de verificación es solo para tu uso personal</p>
                    <p>• No lo compartas con otros</p>
                    <p>• Si no solicitaste este cambio, puedes ignorar este email</p>
                    <p>• Tu contraseña no cambiará hasta que ingreses este código</p>
                  </div>
                  
                  <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.</p>
                </div>
                
                <div class="footer">
                  <p><strong>Equipo AMIKO</strong></p>
                  <p>Plataforma de intercambio cultural que conecta Corea y Centroamérica</p>
                  <p>Email: <a href="mailto:info@helloamiko.com">info@helloamiko.com</a></p>
                  <p>Sitio web: <a href="https://helloamiko.com">https://helloamiko.com</a></p>
                  <p>Este email fue enviado automáticamente para restablecer tu contraseña.</p>
                  <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                  <p>© 2025 AMIKO. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
Restablecer Contraseña

Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta de AMIKO.

Para restablecer tu contraseña, por favor ingresa el código de verificación a continuación:

═══════════════════════════════════════
    🔐 CÓDIGO DE VERIFICACIÓN: ${data.code}
═══════════════════════════════════════
Tiempo de expiración: 5 minutos

Información de Seguridad:
- Este código de verificación es solo para tu uso personal
- No lo compartas con otros
- Si no solicitaste este cambio, puedes ignorar este email
- Tu contraseña no cambiará hasta que ingreses este código

Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.

Equipo AMIKO
Plataforma de intercambio cultural que conecta Corea y Centroamérica
Email: info@helloamiko.com
Sitio web: https://helloamiko.com

Este email fue enviado automáticamente para restablecer tu contraseña.
Si tienes alguna pregunta, no dudes en contactarnos.

© 2025 AMIKO. Todos los derechos reservados.
          `
        }
      } else {
        return {
          subject: `[AMIKO] 비밀번호 재설정을 위한 인증코드`,
          html: `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>비밀번호 재설정 - AMIKO</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px 30px; }
                .verification-code { text-align: center; margin: 30px 0; }
                .verification-code .code { font-size: 64px; font-weight: 900; color: #000000; letter-spacing: 10px; margin: 20px 0; font-family: Arial, sans-serif; }
                .verification-code .expires { color: #666666; font-size: 18px; margin-top: 15px; font-weight: bold; }
                .info { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                .info h3 { margin: 0 0 10px 0; color: #856404; font-size: 16px; }
                .info p { margin: 0; color: #856404; font-size: 14px; line-height: 1.5; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .footer a { color: #667eea; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🇰🇷🇲🇽 AMIKO</h1>
                  <p>한국과 중남미간의 문화교류의 시작</p>
                </div>
                
                <div class="content">
                  <h2>비밀번호 재설정</h2>
                  
                  <p>안녕하세요,</p>
                  
                  <p><strong>AMIKO</strong> 계정의 비밀번호 재설정을 요청하셨습니다.</p>
                  
                  <p>비밀번호를 재설정하려면 아래 인증코드를 입력해 주세요:</p>
                  
                  <div class="verification-code">
                    <div class="code">${data.code}</div>
                    <div class="expires">⏰ 이 코드는 5분 후에 만료됩니다</div>
                  </div>
                  
                  <div class="info">
                    <h3>🔒 보안 안내</h3>
                    <p>• 이 인증코드는 본인만 사용할 수 있습니다</p>
                    <p>• 타인에게 공유하지 마세요</p>
                    <p>• 비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다</p>
                    <p>• 이 코드를 입력하기 전까지는 비밀번호가 변경되지 않습니다</p>
                  </div>
                  
                  <p>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 안전하게 무시하셔도 됩니다.</p>
                </div>
                
                <div class="footer">
                  <p><strong>AMIKO 팀</strong></p>
                  <p>한국과 중남미를 연결하는 문화교류 플랫폼</p>
                  <p>이메일: <a href="mailto:info@helloamiko.com">info@helloamiko.com</a></p>
                  <p>웹사이트: <a href="https://helloamiko.com">https://helloamiko.com</a></p>
                  <p>이 이메일은 비밀번호 재설정을 위해 자동으로 발송되었습니다.</p>
                  <p>문의사항이 있으시면 언제든지 연락해 주세요.</p>
                  <p>© 2025 AMIKO. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
비밀번호 재설정

안녕하세요,

AMIKO 계정의 비밀번호 재설정을 요청하셨습니다.

비밀번호를 재설정하려면 아래 인증코드를 입력해 주세요:

═══════════════════════════════════════
    🔐 인증코드: ${data.code}
═══════════════════════════════════════
만료시간: 5분

보안 안내:
- 이 인증코드는 본인만 사용할 수 있습니다
- 타인에게 공유하지 마세요
- 비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다
- 이 코드를 입력하기 전까지는 비밀번호가 변경되지 않습니다

비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 안전하게 무시하셔도 됩니다.

AMIKO 팀
한국과 중남미를 연결하는 문화교류 플랫폼
이메일: info@helloamiko.com
웹사이트: https://helloamiko.com

이 이메일은 비밀번호 재설정을 위해 자동으로 발송되었습니다.
문의사항이 있으시면 언제든지 연락해 주세요.

© 2025 AMIKO. All rights reserved.
          `
        }
      }
    case 'verification':
      if (language === 'es') {
        return {
          subject: `[AMIKO] Guía de verificación para completar el registro`,
          html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verificación de Email AMIKO</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px 30px; }
                .verification-code { text-align: center; margin: 30px 0; }
                .verification-code .code { font-size: 64px; font-weight: 900; color: #000000; letter-spacing: 10px; margin: 20px 0; font-family: Arial, sans-serif; }
                .verification-code .expires { color: #666666; font-size: 18px; margin-top: 15px; font-weight: bold; }
                .info { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
                .info h3 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
                .info p { margin: 0; color: #424242; font-size: 14px; line-height: 1.5; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .footer a { color: #667eea; text-decoration: none; }
                .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🇰🇷🇲🇽 AMIKO</h1>
                  <p>El comienzo del intercambio cultural entre Corea y Centroamérica</p>
                </div>
                
                <div class="content">
                  <h2>¡Hola! Somos el equipo de AMIKO</h2>
                  
                  <p>Gracias por unirte a <strong>AMIKO</strong>, la plataforma de intercambio cultural que conecta Corea y Centroamérica.</p>
                  
                  <p>AMIKO es una plataforma innovadora que conecta Corea y Centroamérica a través del intercambio cultural. A través de nuestro servicio, esperamos que aprendan las culturas mutuas y formen nuevas amistades.</p>
                  
                  <p>Para completar tu registro, por favor ingresa el código de verificación a continuación:</p>
                  
                  <div class="verification-code">
                    <div class="code">${data.code}</div>
                    <div class="expires">⏰ Este código expira en 5 minutos</div>
                  </div>
                  
                  <div class="info">
                    <h3>🔒 Información de Seguridad</h3>
                    <p>• Este código de verificación es solo para tu uso personal</p>
                    <p>• No lo compartas con otros</p>
                    <p>• Si hay actividad sospechosa, contacta inmediatamente al soporte</p>
                  </div>
                  
                  <p>Una vez completada la verificación, podrás usar las diversas funciones de AMIKO:</p>
                  <ul>
                    <li>🎥 Aprendizaje de español en tiempo real con chat de video AI</li>
                    <li>💬 Intercambio cultural coreano en la comunidad global</li>
                    <li>🎁 Participación en diversos beneficios y eventos con el sistema de puntos</li>
                    <li>📚 Contenido de aprendizaje personalizado y gestión de progreso</li>
                  </ul>
                  
                  <p>También puedes verificar directamente en la web:</p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="https://helloamiko.com/verification?code=${data.code}" class="button">Verificar en la Web</a>
                  </div>
                </div>
                
                <div class="footer">
                  <p><strong>Equipo AMIKO</strong></p>
                  <p>Plataforma de intercambio cultural que conecta Corea y Centroamérica</p>
                  <p>Email: <a href="mailto:info@helloamiko.com">info@helloamiko.com</a></p>
                  <p>Sitio web: <a href="https://helloamiko.com">https://helloamiko.com</a></p>
                  <p>Este email fue enviado automáticamente durante el proceso de registro de AMIKO.</p>
                  <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                  <p>© 2025 AMIKO. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
¡Hola! Somos el equipo de AMIKO

Gracias por unirte a AMIKO, la plataforma de intercambio cultural que conecta Corea y Centroamérica.

AMIKO es una plataforma innovadora que conecta Corea y Centroamérica a través del intercambio cultural. A través de nuestro servicio, esperamos que aprendan las culturas mutuas y formen nuevas amistades.

Para completar tu registro, por favor ingresa el código de verificación a continuación:

═══════════════════════════════════════
    🔐 CÓDIGO DE VERIFICACIÓN: ${data.code}
═══════════════════════════════════════
Tiempo de expiración: 5 minutos

Información de Seguridad:
- Este código de verificación es solo para tu uso personal
- No lo compartas con otros
- Si hay actividad sospechosa, contacta inmediatamente al soporte

Una vez completada la verificación, podrás usar las diversas funciones de AMIKO:
- Aprendizaje de español en tiempo real con chat de video AI
- Intercambio cultural coreano en la comunidad global
- Participación en diversos beneficios y eventos con el sistema de puntos
- Contenido de aprendizaje personalizado y gestión de progreso

Verificar directamente en la web: https://helloamiko.com/verification?code=${data.code}

Equipo AMIKO
Plataforma de intercambio cultural que conecta Corea y Centroamérica
Email: info@helloamiko.com
Sitio web: https://helloamiko.com

Este email fue enviado automáticamente durante el proceso de registro de AMIKO.
Si tienes alguna pregunta, no dudes en contactarnos.

© 2025 AMIKO. Todos los derechos reservados.
          `
        }
      } else {
        return {
          subject: `[AMIKO] 가입 완료를 위한 인증 안내`,
          html: `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>AMIKO 이메일 인증</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px 30px; }
                .verification-code { text-align: center; margin: 30px 0; }
                .verification-code .code { font-size: 64px; font-weight: 900; color: #000000; letter-spacing: 10px; margin: 20px 0; font-family: Arial, sans-serif; }
                .verification-code .expires { color: #666666; font-size: 18px; margin-top: 15px; font-weight: bold; }
                .info { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
                .info h3 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
                .info p { margin: 0; color: #424242; font-size: 14px; line-height: 1.5; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .footer a { color: #667eea; text-decoration: none; }
                .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🇰🇷🇲🇽 AMIKO</h1>
                  <p>한국과 중남미간의 문화교류의 시작</p>
                </div>
                
                <div class="content">
                  <h2>안녕하세요! AMIKO 팀입니다</h2>
                  
                  <p>한국과 중남미를 연결하는 문화교류 플랫폼 <strong>AMIKO</strong>에 가입해 주셔서 진심으로 감사합니다.</p>
                  
                  <p>Amiko는 문화교류를 통해 한국과 중남미를 연결하는 혁신적인 플랫폼입니다. 저희 서비스를 통해 서로 간의 문화를 배우고, 새로운 인연을 만들어가시길 바랍니다.</p>
                  
                  <p>회원가입을 완료하기 위해 아래 인증코드를 입력해 주세요:</p>
                  
                  <div class="verification-code">
                    <div class="code">${data.code}</div>
                    <div class="expires">⏰ 이 코드는 5분 후에 만료됩니다</div>
                  </div>
                  
                  <div class="info">
                    <h3>🔒 보안 안내</h3>
                    <p>• 이 인증코드는 본인만 사용할 수 있습니다</p>
                    <p>• 타인에게 공유하지 마세요</p>
                    <p>• 의심스러운 활동이 있다면 즉시 고객지원에 연락하세요</p>
                  </div>
                  
                  <p>인증이 완료되시면 Amiko의 다양한 기능을 이용하실 수 있습니다:</p>
                  <ul>
                    <li>🎥 AI 화상 채팅으로 실시간 한국어 학습</li>
                    <li>💬 글로벌 커뮤니티에서 한국 문화 교류</li>
                    <li>🎁 포인트 시스템으로 다양한 혜택과 이벤트 참여</li>
                    <li>📚 맞춤형 학습 콘텐츠와 진도 관리</li>
                  </ul>
                  
                  <p>또한 웹에서 직접 인증하실 수도 있습니다:</p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="https://helloamiko.com/verification?code=${data.code}" class="button">웹에서 인증하기</a>
                  </div>
                </div>
                
                <div class="footer">
                  <p><strong>AMIKO 팀</strong></p>
                  <p>한국과 중남미를 연결하는 문화교류 플랫폼</p>
                  <p>이메일: <a href="mailto:info@helloamiko.com">info@helloamiko.com</a></p>
                  <p>웹사이트: <a href="https://helloamiko.com">https://helloamiko.com</a></p>
                  <p>이 이메일은 AMIKO 회원가입 과정에서 자동으로 발송되었습니다.</p>
                  <p>문의사항이 있으시면 언제든지 연락해 주세요.</p>
                  <p>© 2025 AMIKO. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
안녕하세요! AMIKO 팀입니다

한국과 중남미를 연결하는 문화교류 플랫폼 Amiko에 가입해 주셔서 진심으로 감사합니다.

Amiko는 문화교류를 통해 한국과 중남미를 연결하는 혁신적인 플랫폼입니다. 저희 서비스를 통해 서로 간의 문화를 배우고, 새로운 인연을 만들어가시길 바랍니다.

회원가입을 완료하기 위해 아래 인증코드를 입력해 주세요:

═══════════════════════════════════════
    🔐 인증코드: ${data.code}
═══════════════════════════════════════
만료시간: 5분

보안 안내:
- 이 인증코드는 본인만 사용할 수 있습니다
- 타인에게 공유하지 마세요
- 의심스러운 활동이 있다면 즉시 고객지원에 연락하세요

인증이 완료되시면 Amiko의 다양한 기능을 이용하실 수 있습니다:
- AI 화상 채팅으로 실시간 한국어 학습
- 글로벌 커뮤니티에서 한국 문화 교류
- 포인트 시스템으로 다양한 혜택과 이벤트 참여
- 맞춤형 학습 콘텐츠와 진도 관리

웹에서 직접 인증하기: https://helloamiko.com/verification?code=${data.code}

AMIKO 팀
한국과 중남미를 연결하는 문화교류 플랫폼
이메일: info@helloamiko.com
웹사이트: https://helloamiko.com

이 이메일은 AMIKO 회원가입 과정에서 자동으로 발송되었습니다.
문의사항이 있으시면 언제든지 연락해 주세요.

© 2025 AMIKO. All rights reserved.
          `
        }
      }
    case 'passwordReset':
      if (language === 'es') {
        return {
          subject: `[AMIKO] Restablecer contraseña`,
          html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Restablecer Contraseña AMIKO</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px 30px; }
                .reset-button { text-align: center; margin: 30px 0; }
                .reset-button .button { display: inline-block; background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; }
                .info { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
                .info h3 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
                .info p { margin: 0; color: #424242; font-size: 14px; line-height: 1.5; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .footer a { color: #667eea; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🇰🇷🇲🇽 AMIKO</h1>
                  <p>El comienzo del intercambio cultural entre Corea y Centroamérica</p>
                </div>
                
                <div class="content">
                  <h2>Restablecer Contraseña</h2>
                  
                  <p>Hola,</p>
                  
                  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de <strong>AMIKO</strong>.</p>
                  
                  <p>Si solicitaste este cambio, haz clic en el botón de abajo para restablecer tu contraseña:</p>
                  
                  <div class="reset-button">
                    <a href="${data.resetLink}" class="button">Restablecer Contraseña</a>
                  </div>
                  
                  <div class="info">
                    <h3>🔒 Información de Seguridad</h3>
                    <p>• Este enlace es válido por 24 horas</p>
                    <p>• Si no solicitaste este cambio, puedes ignorar este email</p>
                    <p>• Tu contraseña no cambiará hasta que hagas clic en el enlace</p>
                  </div>
                  
                  <p>Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
                  <p style="word-break: break-all; color: #667eea;">${data.resetLink}</p>
                  
                  <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                  
                  <p>Saludos,<br>Equipo AMIKO</p>
                </div>
                
                <div class="footer">
                  <p><strong>Equipo AMIKO</strong></p>
                  <p>Plataforma de intercambio cultural que conecta Corea y Centroamérica</p>
                  <p>Email: <a href="mailto:info@helloamiko.com">info@helloamiko.com</a></p>
                  <p>Sitio web: <a href="https://helloamiko.com">https://helloamiko.com</a></p>
                  <p>© 2025 AMIKO. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
Restablecer Contraseña

Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta de AMIKO.

Si solicitaste este cambio, haz clic en el enlace de abajo para restablecer tu contraseña:

${data.resetLink}

Información de Seguridad:
- Este enlace es válido por 24 horas
- Si no solicitaste este cambio, puedes ignorar este email
- Tu contraseña no cambiará hasta que hagas clic en el enlace

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
Equipo AMIKO

Plataforma de intercambio cultural que conecta Corea y Centroamérica
Email: info@helloamiko.com
Sitio web: https://helloamiko.com

© 2025 AMIKO. Todos los derechos reservados.
          `
        }
      } else {
        return {
          subject: `[AMIKO] 비밀번호 재설정`,
          html: `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>비밀번호 재설정 AMIKO</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px 30px; }
                .reset-button { text-align: center; margin: 30px 0; }
                .reset-button .button { display: inline-block; background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; }
                .info { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
                .info h3 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
                .info p { margin: 0; color: #424242; font-size: 14px; line-height: 1.5; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .footer a { color: #667eea; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🇰🇷🇲🇽 AMIKO</h1>
                  <p>한국과 중남미간의 문화교류의 시작</p>
                </div>
                
                <div class="content">
                  <h2>비밀번호 재설정</h2>
                  
                  <p>안녕하세요,</p>
                  
                  <p><strong>AMIKO</strong> 계정의 비밀번호 재설정 요청을 받았습니다.</p>
                  
                  <p>이 요청을 하신 것이 맞다면, 아래 버튼을 클릭하여 비밀번호를 재설정하세요:</p>
                  
                  <div class="reset-button">
                    <a href="${data.resetLink}" class="button">비밀번호 재설정</a>
                  </div>
                  
                  <div class="info">
                    <h3>🔒 보안 안내</h3>
                    <p>• 이 링크는 24시간 동안 유효합니다</p>
                    <p>• 본인이 요청하지 않았다면 이 이메일을 무시하세요</p>
                    <p>• 링크를 클릭하기 전까지 비밀번호는 변경되지 않습니다</p>
                  </div>
                  
                  <p>버튼이 작동하지 않는다면, 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
                  <p style="word-break: break-all; color: #667eea;">${data.resetLink}</p>
                  
                  <p>문의사항이 있으시면 언제든지 연락해 주세요.</p>
                  
                  <p>감사합니다,<br>AMIKO 팀</p>
                </div>
                
                <div class="footer">
                  <p><strong>AMIKO 팀</strong></p>
                  <p>한국과 중남미를 연결하는 문화교류 플랫폼</p>
                  <p>이메일: <a href="mailto:info@helloamiko.com">info@helloamiko.com</a></p>
                  <p>웹사이트: <a href="https://helloamiko.com">https://helloamiko.com</a></p>
                  <p>© 2025 AMIKO. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
비밀번호 재설정

안녕하세요,

AMIKO 계정의 비밀번호 재설정 요청을 받았습니다.

이 요청을 하신 것이 맞다면, 아래 링크를 클릭하여 비밀번호를 재설정하세요:

${data.resetLink}

보안 안내:
- 이 링크는 24시간 동안 유효합니다
- 본인이 요청하지 않았다면 이 이메일을 무시하세요
- 링크를 클릭하기 전까지 비밀번호는 변경되지 않습니다

문의사항이 있으시면 언제든지 연락해 주세요.

감사합니다,
AMIKO 팀

한국과 중남미를 연결하는 문화교류 플랫폼
이메일: info@helloamiko.com
웹사이트: https://helloamiko.com

© 2025 AMIKO. All rights reserved.
          `
        }
      }
    case 'new_inquiry':
      return {
        subject: `[AMIKO] 새로운 문의가 접수되었습니다 - ${data.subject}`,
        html: `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>새로운 문의 알림</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 40px 30px; }
              .info-box { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 새로운 문의 알림</h1>
              </div>
              <div class="content">
                <h2>새로운 문의가 접수되었습니다</h2>
                <div class="info-box">
                  <h3>문의 정보</h3>
                  <p><strong>문의 ID:</strong> ${data.inquiryId}</p>
                  <p><strong>유형:</strong> ${data.type}</p>
                  <p><strong>제목:</strong> ${data.subject}</p>
                  <p><strong>우선순위:</strong> ${data.priority}</p>
                  <p><strong>사용자:</strong> ${data.userName} (${data.userEmail})</p>
                </div>
                <div class="info-box">
                  <h3>문의 내용</h3>
                  <p>${data.content}</p>
                </div>
                <p>관리자 대시보드에서 확인하세요: <a href="https://www.helloamiko.com/admin/inquiries">https://www.helloamiko.com/admin/inquiries</a></p>
              </div>
              <div class="footer">
                <p>AMIKO - 한국 문화 교류 플랫폼</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `새로운 문의가 접수되었습니다.\n\n문의 ID: ${data.inquiryId}\n유형: ${data.type}\n제목: ${data.subject}\n우선순위: ${data.priority}\n사용자: ${data.userName} (${data.userEmail})\n\n문의 내용:\n${data.content}\n\n관리자 대시보드: https://www.helloamiko.com/admin/inquiries`
      }
    case 'new_partnership_inquiry':
      return {
        subject: `[AMIKO] 새로운 제휴 문의가 접수되었습니다 - ${data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>새로운 제휴 문의 알림</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 40px 30px; }
              .info-box { background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🤝 새로운 제휴 문의 알림</h1>
              </div>
              <div class="content">
                <h2>새로운 제휴 문의가 접수되었습니다</h2>
                <div class="info-box">
                  <h3>회사 정보</h3>
                  <p><strong>회사명:</strong> ${data.companyName}</p>
                  <p><strong>담당자:</strong> ${data.representativeName}</p>
                  <p><strong>이메일:</strong> ${data.email}</p>
                  <p><strong>전화번호:</strong> ${data.phone}</p>
                  <p><strong>업종:</strong> ${data.businessField}</p>
                  <p><strong>제휴 유형:</strong> ${data.partnershipType}</p>
                  <p><strong>예산:</strong> ${data.budget}</p>
                </div>
                <div class="info-box">
                  <h3>제휴 문의 내용</h3>
                  <p>${data.message}</p>
                </div>
                <p>관리자 대시보드에서 확인하세요: <a href="https://www.helloamiko.com/admin/inquiries">https://www.helloamiko.com/admin/inquiries</a></p>
              </div>
              <div class="footer">
                <p>AMIKO - 한국 문화 교류 플랫폼</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `새로운 제휴 문의가 접수되었습니다.\n\n회사명: ${data.companyName}\n담당자: ${data.representativeName}\n이메일: ${data.email}\n전화번호: ${data.phone}\n업종: ${data.businessField}\n제휴 유형: ${data.partnershipType}\n예산: ${data.budget}\n\n제휴 문의 내용:\n${data.message}\n\n관리자 대시보드: https://www.helloamiko.com/admin/inquiries`
      }
    default:
      throw new Error(`지원되지 않는 이메일 템플릿 타입: ${type}`)
  }
}

// 실제 이메일 발송 함수 (하이웍스 SMTP 사용)
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { to, template, data = {} } = options
    
    console.log(`[EMAIL_SEND] ${to}로 이메일 발송 시도: ${template.subject}`)
    
    // 템플릿 데이터 치환
    let html = template.html
    let text = template.text
    let subject = template.subject
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
      html = html.replace(regex, data[key])
      text = text.replace(regex, data[key])
      subject = subject.replace(regex, data[key])
    })
    
    // 실제 이메일 발송 (하이웍스 SMTP 사용)
    return await sendRealEmail(to, subject, html)
    
  } catch (error) {
    console.error('[EMAIL_SEND] 오류:', error)
    return false
  }
}

// 이메일 인증 발송
export async function sendVerificationEmail(email: string, code: string, language: 'ko' | 'es' = 'ko', purpose: 'signup' | 'passwordReset' = 'signup'): Promise<boolean> {
  const templateType = purpose === 'passwordReset' ? 'passwordResetVerification' : 'verification'
  const template = createEmailTemplate(templateType, { code }, language)
  
  return await sendEmail({
    to: email,
    template,
    data: { code }
  })
}

// 비밀번호 재설정 이메일 발송
export async function sendPasswordResetEmail(email: string, resetLink: string, language: 'ko' | 'es' = 'ko'): Promise<boolean> {
  const template = createEmailTemplate('passwordReset', { resetLink }, language)
  
  return await sendEmail({
    to: email,
    template,
    data: { resetLink }
  })
}

// 실제 이메일 발송 함수 (하이웍스 SMTP 사용)
async function sendRealEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // 환경 변수 확인
    const smtpHost = process.env.SMTP_HOST || 'smtps.hiworks.com'
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpPort = parseInt(process.env.SMTP_PORT || '465')
    
    if (!smtpUser || !smtpPass) {
      console.warn('⚠️ SMTP 인증 정보가 설정되지 않았습니다.')
      console.warn('SMTP_USER:', smtpUser ? '설정됨' : '미설정')
      console.warn('SMTP_PASS:', smtpPass ? '설정됨' : '미설정')
      
      // 개발 환경에서는 콘솔에 출력하고 true 반환
      if (process.env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(80))
        console.log('📧 이메일 발송 (개발 환경 - SMTP 미설정)')
        console.log('='.repeat(80))
        console.log(`받는 사람: ${to}`)
        console.log(`제목: ${subject}`)
        console.log(`내용: ${html.substring(0, 200)}...`)
        console.log('='.repeat(80) + '\n')
        return true
      }
      
      return false
    }
    
    console.log(`[EMAIL_SEND] SMTP 설정 확인:`)
    console.log(`- 호스트: ${smtpHost}`)
    console.log(`- 포트: ${smtpPort}`)
    console.log(`- 사용자: ${smtpUser}`)
    console.log(`- 비밀번호: ${smtpPass ? '설정됨' : '미설정'}`)
    
    // Nodemailer 트랜스포터 생성 (465 포트용 SSL)
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true, // 465 포트는 SSL 사용
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false // 개발 환경에서 SSL 인증서 오류 방지
      },
      connectionTimeout: 10000, // 10초 연결 타임아웃
      greetingTimeout: 10000, // 10초 인사 타임아웃
      socketTimeout: 10000 // 10초 소켓 타임아웃
    })
    
    // 연결 테스트
    console.log('[EMAIL_SEND] SMTP 연결 테스트 중...')
    await transporter.verify()
    console.log('[EMAIL_SEND] SMTP 연결 테스트 성공')
    
    // 이메일 발송 (하이웍스 계정과 동일한 발송자 주소 사용)
    const info = await transporter.sendMail({
      from: 'AMIKO <info@helloamiko.com>',
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, '') // HTML 태그 제거하여 텍스트 버전 생성
    })
    
    console.log(`✅ 하이웍스 SMTP 이메일 발송 성공: ${to}`)
    console.log(`📧 메시지 ID: ${info.messageId}`)
    return true
    
  } catch (error) {
    console.error('❌ 하이웍스 SMTP 이메일 발송 실패:', error)
    console.error('❌ 에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    return false
  }
}

// 이메일 서비스 상태 확인
export function getEmailServiceStatus() {
  const smtpHost = process.env.SMTP_HOST || 'smtps.hiworks.com'
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpPort = process.env.SMTP_PORT || '465'
  
  const isConfigured = !!(smtpHost && smtpUser && smtpPass)
  
  return {
    service: smtpHost.includes('hiworks') ? '하이웍스 SMTP' : '기타 SMTP',
    configured: isConfigured,
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    hasPassword: !!smtpPass
  }
}