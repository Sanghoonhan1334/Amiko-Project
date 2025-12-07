# Contributing Guide / Guía de Contribución

Thank you for contributing to the Amiko project! / ¡Gracias por contribuir al proyecto Amiko!

This document provides guidelines for contributing to the project. / Este documento proporciona pautas para contribuir al proyecto.

---

## 📋 Table of Contents / Tabla de Contenidos

1. [Branch Strategy / Estrategia de Ramas](#branch-strategy--estrategia-de-ramas)
2. [Important Rules / Reglas Importantes](#important-rules--reglas-importantes)
3. [Workflow Process / Proceso de Flujo de Trabajo](#workflow-process--proceso-de-flujo-de-trabajo)
4. [Code Style / Estilo de Código](#code-style--estilo-de-código)
5. [Commit Message Rules / Reglas de Mensajes de Commit](#commit-message-rules--reglas-de-mensajes-de-commit)
6. [PR (Pull Request) Process / Proceso de PR](#pr-pull-request-process--proceso-de-pr)
7. [Development Environment Setup / Configuración del Entorno de Desarrollo](#development-environment-setup--configuración-del-entorno-de-desarrollo)

---

## 🌿 Branch Strategy / Estrategia de Ramas

### Main Branches / Ramas Principales

- **`main`** - Production branch (stable code only) / Rama de producción (solo código estable)
  - ❌ **Direct push is FORBIDDEN** / El push directo está PROHIBIDO
  - ✅ Only merged from `dev` after testing / Solo se fusiona desde `dev` después de pruebas
  
- **`dev`** - Development/Integration branch / Rama de desarrollo/integración
  - ✅ Integration point for all features / Punto de integración para todas las funcionalidades
  - ✅ Requires PR and code review / Requiere PR y revisión de código

### Feature Branches / Ramas de Funcionalidades

Create `feature/*` branches from `dev` for new features. / Crear ramas `feature/*` desde `dev` para nuevas funcionalidades.

**Branch Naming Convention / Convención de Nomenclatura:**
- `feature/payments-paypal-maria` - PayPal payment integration (María) / Integración de pagos PayPal (María)
- `feature/legal-policy-update` - Legal policy updates (Legal Expert) / Actualizaciones de políticas legales (Experto Legal)
- `feature/class-tab-ui` - Class/course tab development / Desarrollo de pestaña de clases/cursos
- `fix/payment-bug` - Bug fixes / Correcciones de errores
- `chore/update-dependencies` - Maintenance tasks / Tareas de mantenimiento

**Example / Ejemplo:**
```bash
# Start from dev branch / Comenzar desde la rama dev
git checkout dev
git pull origin dev

# Create new feature branch / Crear nueva rama de funcionalidad
git checkout -b feature/payments-paypal-maria

# Work and commit / Trabajar y hacer commit
git add .
git commit -m "feat: add PayPal payment integration"

# Push to remote / Subir a remoto
git push origin feature/payments-paypal-maria
```

---

## 🚨 Important Rules / Reglas Importantes

### ❌ FORBIDDEN / PROHIBIDO

1. **❌ NEVER push directly to `main` branch** / NUNCA hacer push directo a la rama `main`
   - `main` is production and must be protected / `main` es producción y debe estar protegida
   - All changes must go through PR process / Todos los cambios deben pasar por el proceso de PR

2. **❌ NEVER force push to shared branches** / NUNCA forzar push a ramas compartidas
   - This can break other developers' work / Esto puede romper el trabajo de otros desarrolladores

3. **❌ NEVER commit sensitive data** / NUNCA hacer commit de datos sensibles
   - API keys, passwords, private keys / Claves API, contraseñas, claves privadas

### ✅ REQUIRED / REQUERIDO

1. **✅ Always create feature branch from `dev`** / Siempre crear rama de funcionalidad desde `dev`
2. **✅ Always pull latest changes before starting** / Siempre obtener los últimos cambios antes de comenzar
3. **✅ Always create PR for code review** / Siempre crear PR para revisión de código
4. **✅ Always test before creating PR** / Siempre probar antes de crear PR

---

## 🔄 Workflow Process / Proceso de Flujo de Trabajo

### Step 1: Start Development / Iniciar Desarrollo

```bash
# Switch to dev branch / Cambiar a la rama dev
git checkout dev

# Pull latest changes / Obtener últimos cambios
git pull origin dev

# Create your feature branch / Crear tu rama de funcionalidad
git checkout -b feature/payments-paypal-maria
```

### Step 2: Develop and Commit / Desarrollar y Hacer Commit

```bash
# Make your changes / Hacer tus cambios
# ... edit files ...

# Stage changes / Preparar cambios
git add .

# Commit with proper message / Hacer commit con mensaje apropiado
git commit -m "feat: add PayPal order creation API"

# Push to remote / Subir a remoto
git push origin feature/payments-paypal-maria
```

### Step 3: Create Pull Request / Crear Pull Request

1. Go to GitHub repository / Ir al repositorio de GitHub
2. Click "New Pull Request" / Hacer clic en "New Pull Request"
3. Select: `feature/payments-paypal-maria` → `dev` / Seleccionar: `feature/payments-paypal-maria` → `dev`
4. Fill PR description / Completar descripción del PR
5. Request review / Solicitar revisión
6. Wait for approval / Esperar aprobación

### Step 4: Code Review / Revisión de Código

- Reviewer checks code quality / El revisor verifica la calidad del código
- Reviewer approves or requests changes / El revisor aprueba o solicita cambios
- Make changes if needed / Hacer cambios si es necesario
- Re-request review / Volver a solicitar revisión

### Step 5: Merge to dev / Fusionar a dev

- After approval, merge PR to `dev` / Después de la aprobación, fusionar PR a `dev`
- Delete feature branch (optional) / Eliminar rama de funcionalidad (opcional)
- `dev` branch is automatically tested / La rama `dev` se prueba automáticamente

### Step 6: Merge dev to main / Fusionar dev a main

- After testing in `dev`, create PR: `dev` → `main` / Después de probar en `dev`, crear PR: `dev` → `main`
- Requires additional review / Requiere revisión adicional
- Merge only when production-ready / Fusionar solo cuando esté listo para producción

---

## 💻 Code Style / Estilo de Código

### TypeScript

- Use TypeScript strict mode / Usar modo estricto de TypeScript
- Explicit types (avoid `any`) / Tipos explícitos (evitar `any`)
- Interfaces/types in `src/types/` / Interfaces/tipos en `src/types/`

### ESLint

The project uses ESLint. Run lint before creating PR: / El proyecto usa ESLint. Ejecutar lint antes de crear PR:

```bash
npm run lint
```

Fix lint errors before PR. / Corregir errores de lint antes del PR.

### File Structure / Estructura de Archivos

- Components: `src/components/`
- API Routes: `src/app/api/`
- Utilities: `src/lib/`
- Type Definitions: `src/types/`

---

## 📝 Commit Message Rules / Reglas de Mensajes de Commit

### Format / Formato

```
<type>: <subject>

<body> (optional)

<footer> (optional)
```

### Types / Tipos

- `feat`: New feature / Nueva funcionalidad
- `fix`: Bug fix / Corrección de error
- `docs`: Documentation changes / Cambios en documentación
- `style`: Code formatting (no functional changes) / Formato de código (sin cambios funcionales)
- `refactor`: Code refactoring / Refactorización de código
- `test`: Test additions / Adiciones de pruebas
- `chore`: Maintenance tasks / Tareas de mantenimiento

### Examples / Ejemplos

```bash
# Feature / Funcionalidad
git commit -m "feat: add PayPal payment integration"

# Bug fix / Corrección de error
git commit -m "fix: resolve payment webhook validation issue"

# Documentation / Documentación
git commit -m "docs: update API documentation"

# Refactoring / Refactorización
git commit -m "refactor: improve error handling in payment flow"
```

---

## 🔄 PR (Pull Request) Process / Proceso de PR

### Before Creating PR / Antes de Crear PR

Checklist / Lista de verificación:

- [ ] Code builds successfully / El código se compila correctamente (`npm run build`)
- [ ] ESLint passes / ESLint pasa (`npm run lint`)
- [ ] Commit messages follow rules / Los mensajes de commit siguen las reglas
- [ ] Documentation updated (if needed) / Documentación actualizada (si es necesario)
- [ ] Tests performed (if possible) / Pruebas realizadas (si es posible)

### PR Title Format / Formato del Título del PR

Follow commit message format: / Seguir formato de mensaje de commit:

```
feat: PayPal payment integration
fix: Payment webhook validation issue
docs: Update API documentation
```

### PR Description Template / Plantilla de Descripción del PR

```markdown
## Changes / Cambios
- PayPal payment API integration
- Payment button component added
- Webhook processing logic implemented

## Related Issue / Issue Relacionado
Closes #123

## Testing / Pruebas
1. Click PayPal button on payment page
2. Complete payment with PayPal sandbox account
3. Verify payment completion

## Screenshots / Capturas de Pantalla
(If UI changes / Si hay cambios de UI)
```

### Code Review / Revisión de Código

- Respond actively to reviewer feedback / Responder activamente al feedback del revisor
- Make changes if requested / Hacer cambios si se solicitan
- Re-request review after changes / Volver a solicitar revisión después de cambios
- After all reviews complete, PR is merged to `dev` / Después de completar todas las revisiones, el PR se fusiona a `dev`

---

## 🛠️ Development Environment Setup / Configuración del Entorno de Desarrollo

### Requirements / Requisitos

- Node.js 18 or higher / Node.js 18 o superior
- npm or yarn
- Git

### Initial Setup / Configuración Inicial

1. Clone repository / Clonar repositorio:
   ```bash
   git clone <repository-url>
   cd Amiko-Project-main
   ```

2. Install dependencies / Instalar dependencias:
   ```bash
   npm install
   ```

3. Setup environment variables / Configurar variables de entorno:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with actual values / Editar .env.local con valores reales
   ```

4. Run development server / Ejecutar servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Useful Commands / Comandos Útiles

```bash
# Development server / Servidor de desarrollo
npm run dev

# Production build / Compilación de producción
npm run build

# Run linter / Ejecutar linter
npm run lint

# Production server (after build) / Servidor de producción (después de compilar)
npm start
```

---

## 📚 Additional Resources / Recursos Adicionales

- **Detailed Git Workflow**: See [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
- **Project Overview**: See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- **Code Improvement Guide**: See [docs/CODE_IMPROVEMENT_GUIDE.md](docs/CODE_IMPROVEMENT_GUIDE.md)

---

## 🔒 Branch Protection Rules / Reglas de Protección de Ramas

### main Branch / Rama main

- ❌ **Direct push forbidden** / Push directo prohibido
- ✅ **Requires PR from dev** / Requiere PR desde dev
- ✅ **Minimum 1 reviewer required** / Mínimo 1 revisor requerido
- ✅ **CI must pass** / CI debe pasar
- ✅ **No force push allowed** / No se permite forzar push

### dev Branch / Rama dev

- ✅ **Requires PR from feature branches** / Requiere PR desde ramas de funcionalidades
- ✅ **Minimum 1 reviewer required** / Mínimo 1 revisor requerido
- ✅ **CI must pass** / CI debe pasar

---

## 📞 Support / Soporte

If you have questions, please: / Si tienes preguntas, por favor:

- Create an issue in the repository / Crear un issue en el repositorio
- Ask in team chat / Preguntar en el chat del equipo
- Refer to [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) for detailed workflow / Consultar [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) para flujo de trabajo detallado

Thank you! / ¡Gracias! 🎉
