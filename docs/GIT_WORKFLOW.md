# Git Workflow Guide / Guía de Flujo de Trabajo con Git

## 📋 Overview / Resumen

This document describes the Git branching strategy for Amiko Project collaboration.

Este documento describe la estrategia de ramificación de Git para la colaboración en el proyecto Amiko.

---

## 🌿 Branch Strategy / Estrategia de Ramas

### Main Branches / Ramas Principales

```
main (Production)
  ↑
dev (Development/Integration)
  ↑
feature/* (Feature Development)
```

**Note**: If `develop` branch exists, it can be used as `dev`. / **Nota**: Si la rama `develop` existe, puede usarse como `dev`.

#### 1. `main` Branch
- **Purpose**: Production-ready code only
- **Protection**: ❌ Direct push is **FORBIDDEN**
- **Merge**: Only from `dev` after thorough testing
- **Purpose**: Solo código listo para producción
- **Protección**: ❌ El push directo está **PROHIBIDO**
- **Merge**: Solo desde `dev` después de pruebas exhaustivas

#### 2. `dev` Branch
- **Purpose**: Integration branch for all features
- **Protection**: Requires pull request and code review
- **Merge**: From `feature/*` branches via PR
- **Purpose**: Rama de integración para todas las funcionalidades
- **Protección**: Requiere pull request y revisión de código
- **Merge**: Desde ramas `feature/*` mediante PR

#### 3. `feature/*` Branches
- **Purpose**: Individual feature development
- **Naming**: `feature/description-developer` (e.g., `feature/payments-paypal-maria`)
- **Lifecycle**: Created from `dev`, merged back to `dev` via PR
- **Purpose**: Desarrollo de funcionalidades individuales
- **Nomenclatura**: `feature/descripción-desarrollador` (ej: `feature/payments-paypal-maria`)
- **Ciclo de vida**: Creada desde `dev`, fusionada de vuelta a `dev` mediante PR

---

## 🚀 Workflow Process / Proceso de Flujo de Trabajo

### Step-by-Step / Paso a Paso

#### 1. Start New Feature / Iniciar Nueva Funcionalidad

```bash
# Switch to dev branch
git checkout dev

# Pull latest changes
git pull origin dev

# Create feature branch
git checkout -b feature/payments-paypal-maria

# Start development...
```

```bash
# Cambiar a la rama dev
git checkout dev

# Obtener los últimos cambios
git pull origin dev

# Crear rama de funcionalidad
git checkout -b feature/payments-paypal-maria

# Comenzar desarrollo...
```

#### 2. Develop and Commit / Desarrollar y Hacer Commit

```bash
# Make changes...
git add .
git commit -m "feat: add PayPal payment integration"

# Push to remote
git push origin feature/payments-paypal-maria
```

```bash
# Hacer cambios...
git add .
git commit -m "feat: add PayPal payment integration"

# Subir a remoto
git push origin feature/payments-paypal-maria
```

#### 3. Create Pull Request / Crear Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select: `feature/payments-paypal-maria` → `dev`
4. Fill PR description
5. Request review
6. Wait for approval

1. Ir al repositorio de GitHub
2. Hacer clic en "New Pull Request"
3. Seleccionar: `feature/payments-paypal-maria` → `dev`
4. Completar descripción del PR
5. Solicitar revisión
6. Esperar aprobación

#### 4. Code Review / Revisión de Código

- Reviewer checks code quality
- Reviewer approves or requests changes
- Make changes if needed
- Re-request review

- El revisor verifica la calidad del código
- El revisor aprueba o solicita cambios
- Hacer cambios si es necesario
- Volver a solicitar revisión

#### 5. Merge to dev / Fusionar a dev

- After approval, merge PR to `dev`
- Delete feature branch (optional)
- `dev` branch is automatically tested

- Después de la aprobación, fusionar PR a `dev`
- Eliminar rama de funcionalidad (opcional)
- La rama `dev` se prueba automáticamente

#### 6. Merge dev to main / Fusionar dev a main

- After testing in `dev`, create PR: `dev` → `main`
- Requires additional review
- Merge only when production-ready

- Después de probar en `dev`, crear PR: `dev` → `main`
- Requiere revisión adicional
- Fusionar solo cuando esté listo para producción

---

## 📝 Branch List / Lista de Ramas

### Current Feature Branches / Ramas de Funcionalidades Actuales

#### 1. `feature/payments-paypal-maria`
- **Owner**: María
- **Purpose**: PayPal payment system implementation
- **Status**: Ready for development
- **Propósito**: Implementación del sistema de pagos PayPal
- **Estado**: Listo para desarrollo

#### 2. `feature/legal-policy-update`
- **Owner**: Legal Expert
- **Purpose**: Privacy policy, terms of service, minor protection policies
- **Status**: Ready for development
- **Propósito**: Política de privacidad, términos de servicio, políticas de protección de menores
- **Estado**: Listo para desarrollo

#### 3. `feature/class-tab-ui`
- **Owner**: María (future)
- **Purpose**: Class/course tab development
- **Status**: Planned
- **Propósito**: Desarrollo de pestaña de clases/cursos
- **Estado**: Planificado

### Recommended Additional Branches / Ramas Adicionales Recomendadas

- `feature/latin-america-ui` - UI improvements for Latin American users
- `feature/kyc-integration` - KYC (Know Your Customer) integration
- `feature/email-receipts` - Automatic email receipt generation

---

## 🔒 Branch Protection Rules / Reglas de Protección de Ramas

### main Branch / Rama main

- ❌ **Direct push forbidden** / Push directo prohibido
- ✅ **Requires PR from dev** / Requiere PR desde dev
- ✅ **Minimum 1 reviewer** / Mínimo 1 revisor
- ✅ **CI must pass** / CI debe pasar
- ✅ **No force push** / No forzar push

### dev Branch / Rama dev

- ✅ **Requires PR from feature branches** / Requiere PR desde ramas de funcionalidades
- ✅ **Minimum 1 reviewer** / Mínimo 1 revisor
- ✅ **CI must pass** / CI debe pasar

---

## 📋 Commit Message Rules / Reglas de Mensajes de Commit

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
- `chore`: Maintenance tasks / Tareas de mantenimiento
- `refactor`: Code refactoring / Refactorización de código
- `test`: Test additions / Adiciones de pruebas
- `style`: Code style changes / Cambios de estilo de código

### Examples / Ejemplos

```bash
feat: add PayPal payment integration
fix: resolve payment webhook validation issue
docs: update API documentation
chore: update dependencies
refactor: improve error handling in payment flow
```

```bash
feat: agregar integración de pagos PayPal
fix: resolver problema de validación de webhook de pago
docs: actualizar documentación de API
chore: actualizar dependencias
refactor: mejorar manejo de errores en flujo de pago
```

---

## 🎯 Quick Reference / Referencia Rápida

### Common Commands / Comandos Comunes

```bash
# Check current branch
git branch

# Switch branch
git checkout dev

# Create and switch to new branch
git checkout -b feature/my-feature

# Pull latest changes
git pull origin dev

# Push to remote
git push origin feature/my-feature

# View commit history
git log --oneline
```

```bash
# Ver rama actual
git branch

# Cambiar de rama
git checkout dev

# Crear y cambiar a nueva rama
git checkout -b feature/mi-funcionalidad

# Obtener últimos cambios
git pull origin dev

# Subir a remoto
git push origin feature/mi-funcionalidad

# Ver historial de commits
git log --oneline
```

---

## 🚨 Important Rules / Reglas Importantes

### ❌ DO NOT / NO HACER

1. ❌ **Never push directly to main** / Nunca hacer push directo a main
2. ❌ **Never force push to shared branches** / Nunca forzar push a ramas compartidas
3. ❌ **Never commit sensitive data** / Nunca hacer commit de datos sensibles
4. ❌ **Never skip code review** / Nunca saltarse la revisión de código

### ✅ DO / HACER

1. ✅ **Always pull before starting work** / Siempre hacer pull antes de comenzar
2. ✅ **Always create feature branch from dev** / Siempre crear rama de funcionalidad desde dev
3. ✅ **Always write clear commit messages** / Siempre escribir mensajes de commit claros
4. ✅ **Always test before creating PR** / Siempre probar antes de crear PR

---

## 📞 Support / Soporte

If you have questions about Git workflow, please:
- Create an issue in the repository
- Ask in team chat
- Refer to [CONTRIBUTING.md](../CONTRIBUTING.md)

Si tienes preguntas sobre el flujo de trabajo con Git, por favor:
- Crear un issue en el repositorio
- Preguntar en el chat del equipo
- Consultar [CONTRIBUTING.md](../CONTRIBUTING.md)
