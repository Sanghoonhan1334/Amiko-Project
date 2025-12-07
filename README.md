# Amiko - Plataforma de Intercambio Cultural/Educativo Corea-Latinoamérica

**Amiko** es una plataforma diseñada para facilitar el intercambio cultural y educativo entre Corea y Latinoamérica. Construida con Next.js (App Router), Supabase y Tailwind CSS, actualmente cuenta con un sistema de pagos centrado en Toss Payments.

---

# Amiko - 한국-라틴아메리카 문화/교육 교류 플랫폼

**Amiko**는 한국과 라틴아메리카 간의 문화 및 교육 교류를 위한 플랫폼입니다. Next.js(App Router), Supabase, Tailwind CSS를 기반으로 구축되었으며, 현재는 Toss Payments를 중심으로 한 결제 시스템이 구현되어 있습니다.

---

## 🚀 Inicio Rápido / 빠른 시작

### 1. Instalación de Dependencias / 의존성 설치

```bash
npm install
```

### 2. Configuración de Variables de Entorno / 환경 변수 설정

Crea un archivo `.env.local` en la raíz del proyecto y configura las variables de entorno necesarias.

**Para ver la lista completa de variables de entorno, consulta el archivo `.env.local.example`.**

Variables principales:
- Relacionadas con Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Relacionadas con Toss Payments (`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`)
- Otros servicios (traducción, notificaciones push, SMS, etc.)

`.env.local` 파일을 프로젝트 루트에 생성하고 필요한 환경 변수를 설정하세요.

**자세한 환경 변수 목록은 `.env.local.example` 파일을 참고하세요.**

주요 환경 변수:
- Supabase 관련 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Toss Payments 관련 (`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`)
- 기타 서비스 (번역, 푸시 알림, SMS 등)

### 3. Ejecutar el Servidor de Desarrollo / 개발 서버 실행

```bash
npm run dev
```

El puerto predeterminado es 3000. Accede a `http://localhost:3000` en tu navegador.

기본 포트는 3000입니다. 브라우저에서 `http://localhost:3000`으로 접속하세요.

---

## 🔧 Funcionalidades Principales Implementadas / 구현된 주요 기능

### ✅ Funcionalidades Completadas / 완료된 기능

- **Autenticación de Usuarios**: Inicio de sesión y registro basados en Supabase Auth, verificación por teléfono, autenticación biométrica
- **Sistema de Pagos**: Integración con Toss Payments (procesamiento automático basado en webhooks)
- **Comunidad**: Sistema de publicaciones, comentarios, likes y galerías
- **Zona de Fans**: Fotos de ídolos, fan art, noticias, funcionalidad de historias
- **Cuestionarios**: Pruebas de nivel de coreano, cuestionarios de posición de ídolos, etc.
- **Sistema de Puntos**: Actividades diarias, rankings, puntos de eventos
- **Eventos**: Eventos en Zep, sistema de sorteos
- **Traducción**: Integración con APIs de OpenAI/Google Translate
- **Notificaciones Push**: Notificaciones push web basadas en claves VAPID
- **SMS/WhatsApp**: Integración con Twilio (verificación, notificaciones)
- **Panel de Administración**: Consulta de estadísticas de usuarios, pagos y reservas
- **Sistema de Reservas**: Gestión de reservas con consultores/socios

- **사용자 인증**: Supabase Auth 기반 로그인/회원가입, 전화번호 인증, 생체인증
- **결제 시스템**: Toss Payments 연동 (웹훅 기반 자동 처리)
- **커뮤니티**: 게시글, 댓글, 좋아요, 갤러리 시스템
- **팬존**: 아이돌 사진, 팬아트, 뉴스, 스토리 기능
- **퀴즈**: 한국어 레벨 테스트, 아이돌 포지션 퀴즈 등
- **포인트 시스템**: 일일 활동, 랭킹, 이벤트 포인트
- **이벤트**: Zep 이벤트, 추첨 시스템
- **번역**: OpenAI/Google Translate API 연동
- **푸시 알림**: VAPID 키 기반 웹 푸시 알림
- **SMS/WhatsApp**: Twilio 연동 (인증, 알림)
- **관리자 대시보드**: 사용자, 결제, 예약 통계 조회
- **예약 시스템**: 상담사/파트너 예약 관리

### 🚧 Funcionalidades Planificadas / 예정 기능

- **Pagos con PayPal**: Sistema de pagos PayPal para usuarios de Latinoamérica (estructura preparada, implementación pendiente)
- **Pestaña de Clases/Cursos**: Sistema de gestión y toma de contenidos educativos
- **Refuerzo de Políticas Legales**: Protección de menores, políticas de privacidad, términos y condiciones, cláusulas de exención de responsabilidad

- **PayPal 결제**: 라틴아메리카 사용자용 PayPal 결제 시스템 (구조 준비 완료, 구현 예정)
- **강의/수업 탭**: 교육 콘텐츠 관리 및 수강 시스템
- **법적 정책 강화**: 미성년자 보호, 개인정보 처리방침, 약관/면책 조항 개선

---

## 📁 Estructura del Proyecto / 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Rutas API
│   │   ├── auth/         # API de autenticación
│   │   ├── paypal/       # API de pagos PayPal (estructura preparada)
│   │   ├── posts/        # API de publicaciones
│   │   └── ...
│   ├── main/              # Páginas principales de la app
│   ├── community/         # Páginas de comunidad
│   ├── admin/             # Páginas de administración
│   └── ...
├── components/            # Componentes React
│   ├── main/app/         # Componentes principales de la app
│   ├── auth/             # Componentes de autenticación
│   ├── common/           # Componentes comunes
│   └── ...
├── lib/                   # Librerías de utilidades
│   ├── supabase.ts       # Cliente de Supabase
│   ├── translation.ts    # Servicio de traducción
│   ├── paypal.ts         # Configuración de PayPal (estructura preparada)
│   └── ...
└── types/                 # Definiciones de tipos TypeScript
```

Para más detalles sobre la estructura, consulta `PROJECT_OVERVIEW.md`.

자세한 구조는 `PROJECT_OVERVIEW.md`를 참고하세요.

---

## 💳 Sistema de Pagos / 결제 시스템

### Toss Payments (Implementación Completada) / (구현 완료)

- Ubicación: `src/app/api/toss/` (estimado)
- Procesamiento automático de pagos basado en webhooks
- Dirigido a usuarios coreanos

- 위치: `src/app/api/toss/` (예상)
- 웹훅 기반 자동 결제 처리
- 한국 사용자 대상

### PayPal (Estructura Preparada, Implementación Pendiente) / (구조 준비 완료, 구현 예정)

- Ubicación: `src/app/api/paypal/`
  - `create-order/route.ts` - Creación de pedidos
  - `approve-order/route.ts` - Aprobación de pedidos
  - `webhook/route.ts` - Procesamiento de webhooks
- Dirigido a usuarios de Latinoamérica
- **Estado**: La estructura básica y las definiciones de tipos están preparadas. María continuará con la implementación.
- **Documentación**: Consulta `docs/PAYMENTS/PAYPAL_PLAN.md`

- 위치: `src/app/api/paypal/`
  - `create-order/route.ts` - 주문 생성
  - `approve-order/route.ts` - 주문 승인
  - `webhook/route.ts` - 웹훅 처리
- 라틴아메리카 사용자 대상
- **상태**: 기본 구조와 타입 정의는 준비되어 있으며, 마리아가 이어서 구현할 예정
- **문서**: `docs/PAYMENTS/PAYPAL_PLAN.md` 참고

---

## 📚 Documentación / 문서

La documentación detallada del proyecto se puede encontrar en la carpeta `docs/`:

- `docs/LEGAL/` - Documentos legales (políticas de privacidad, términos y condiciones, etc.)
- `docs/PAYMENTS/` - Documentos de diseño relacionados con pagos
- `docs/UI_GUIDES/` - Guías de UI/UX
- `docs/ARCHIVE/` - Documentos de estructuras anteriores

프로젝트의 상세 문서는 `docs/` 폴더에서 확인할 수 있습니다:

- `docs/LEGAL/` - 법적 문서 (개인정보 처리방침, 약관 등)
- `docs/PAYMENTS/` - 결제 관련 설계 문서
- `docs/UI_GUIDES/` - UI/UX 가이드
- `docs/ARCHIVE/` - 과거 구조 문서

---

## 🤝 Resumen para Colaboradores / 협업자용 요약

### Estrategia de Ramas / 브랜치 전략

- `main` - Rama de producción
- `dev` - Rama de desarrollo
- `feature/*` - Rama de desarrollo de funcionalidades (ej: `feature/paypal-integration`, `feature/legal-terms`)

- `main` - 프로덕션 브랜치
- `dev` - 개발 브랜치
- `feature/*` - 기능 개발 브랜치 (예: `feature/paypal-integration`, `feature/legal-terms`)

### Estilo de Código / 코드 스타일

- Uso de ESLint (`npm run lint`)
- Modo estricto de TypeScript
- Prettier actualmente no está configurado (pendiente de agregar)

- ESLint 사용 (`npm run lint`)
- TypeScript 엄격 모드
- Prettier는 현재 설정되지 않음 (추가 예정)

### Proceso de PR / PR 절차

1. Crear un issue (opcional)
2. Crear una rama `feature/*` desde la rama `dev`
3. Desarrollar y probar
4. Crear un PR hacia la rama `dev`
5. Revisión de código y merge

1. 이슈 생성 (선택사항)
2. `dev` 브랜치에서 `feature/*` 브랜치 생성
3. 개발 및 테스트
4. `dev` 브랜치로 PR 생성
5. 코드 리뷰 후 머지

Para más detalles, consulta `CONTRIBUTING.md`.

자세한 내용은 `CONTRIBUTING.md`를 참고하세요.

---

## 📄 Licencia / 라이선스

Este proyecto está bajo la licencia MIT. Para más detalles, consulta el archivo `LICENSE`.

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 📞 Soporte / 지원

Si encuentras algún problema o tienes preguntas, por favor crea un issue.

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.
