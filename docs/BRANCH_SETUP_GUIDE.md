# Branch Setup Guide / Guía de Configuración de Ramas

This guide helps set up the initial branches for AMIKO Project collaboration. / Esta guía ayuda a configurar las ramas iniciales para la colaboración en el proyecto AMIKO.

---

## 🎯 Objective / Objetivo

Set up the following branch structure: / Configurar la siguiente estructura de ramas:

```
main (production)
  ↑
dev (development/integration)
  ↑
feature/payments-paypal-maria
feature/legal-policy-update
feature/class-tab-ui
```

---

## 📋 Branch List / Lista de Ramas

### Required Branches / Ramas Requeridas

#### 1. `dev` Branch
- **Purpose**: Integration branch for all features / Rama de integración para todas las funcionalidades
- **Status**: Must be created if it doesn't exist / Debe crearse si no existe

#### 2. `feature/payments-paypal-maria`
- **Owner**: María
- **Purpose**: PayPal payment system implementation / Implementación del sistema de pagos PayPal
- **Files**: `src/app/api/paypal/**`, `src/lib/paypal.ts`, `src/components/payments/**`

#### 3. `feature/legal-policy-update`
- **Owner**: Legal Expert
- **Purpose**: Privacy policy, terms of service, minor protection / Política de privacidad, términos de servicio, protección de menores
- **Files**: `docs/LEGAL/**`, `src/app/legal/**`, related components

#### 4. `feature/class-tab-ui`
- **Owner**: María (future)
- **Purpose**: Class/course tab development / Desarrollo de pestaña de clases/cursos
- **Status**: Planned / Planificado

---

## 🚀 Setup Commands / Comandos de Configuración

### Step 1: Create dev Branch / Crear Rama dev

**Note**: If `develop` branch exists, you can either use it or create `dev`. / **Nota**: Si la rama `develop` existe, puedes usarla o crear `dev`.

```bash
# Check if dev or develop branch exists / Verificar si la rama dev o develop existe
git branch -a | grep -E "(dev|develop)"

# Option 1: Use existing develop branch / Opción 1: Usar rama develop existente
git checkout develop
git pull origin develop

# Option 2: Create new dev branch from main / Opción 2: Crear nueva rama dev desde main
git checkout main
git checkout -b dev
git push -u origin dev

# Option 3: Rename develop to dev (if preferred) / Opción 3: Renombrar develop a dev (si se prefiere)
git branch -m develop dev
git push origin -u dev
git push origin --delete develop
```

### Step 2: Create Feature Branches / Crear Ramas de Funcionalidades

```bash
# Ensure you're on dev / Asegurarse de estar en dev
git checkout dev
git pull origin dev

# Create PayPal branch for María / Crear rama PayPal para María
git checkout -b feature/payments-paypal-maria
git push -u origin feature/payments-paypal-maria

# Switch back to dev / Volver a dev
git checkout dev

# Create legal policy branch / Crear rama de políticas legales
git checkout -b feature/legal-policy-update
git push -u origin feature/legal-policy-update

# Switch back to dev / Volver a dev
git checkout dev

# Create class tab branch (optional, for future) / Crear rama de pestaña de clases (opcional, para futuro)
git checkout -b feature/class-tab-ui
git push -u origin feature/class-tab-ui

# Return to dev / Volver a dev
git checkout dev
```

### Step 3: Verify Branches / Verificar Ramas

```bash
# List all branches / Listar todas las ramas
git branch -a

# Should see / Debería ver:
# * dev
#   feature/payments-paypal-maria
#   feature/legal-policy-update
#   feature/class-tab-ui
#   main
```

---

## 🔒 Branch Protection Setup / Configuración de Protección de Ramas

### GitHub Settings / Configuración de GitHub

1. Go to repository Settings → Branches / Ir a Configuración del repositorio → Branches
2. Add branch protection rule for `main` / Agregar regla de protección de rama para `main`
3. Add branch protection rule for `dev` / Agregar regla de protección de rama para `dev`

### main Branch Protection / Protección de Rama main

- ✅ Require a pull request before merging / Requerir un pull request antes de fusionar
- ✅ Require approvals: 1 / Requerir aprobaciones: 1
- ✅ Require status checks to pass / Requerir que las verificaciones de estado pasen
- ✅ Require branches to be up to date before merging / Requerir que las ramas estén actualizadas antes de fusionar
- ❌ Do not allow bypassing the above settings / No permitir omitir la configuración anterior
- ❌ Restrict pushes that create files / Restringir pushes que crean archivos

### dev Branch Protection / Protección de Rama dev

- ✅ Require a pull request before merging / Requerir un pull request antes de fusionar
- ✅ Require approvals: 1 / Requerir aprobaciones: 1
- ✅ Require status checks to pass / Requerir que las verificaciones de estado pasen
- ❌ Do not allow force pushes / No permitir force pushes
- ❌ Do not allow deletions / No permitir eliminaciones

---

## 📝 Quick Reference / Referencia Rápida

### For María (PayPal Development) / Para María (Desarrollo PayPal)

```bash
# Start work / Comenzar trabajo
git checkout feature/payments-paypal-maria
git pull origin dev  # Get latest changes / Obtener últimos cambios

# Work and commit / Trabajar y hacer commit
git add .
git commit -m "feat: implement PayPal order creation"
git push origin feature/payments-paypal-maria

# Create PR: feature/payments-paypal-maria → dev
```

### For Legal Expert / Para Experto Legal

```bash
# Start work / Comenzar trabajo
git checkout feature/legal-policy-update
git pull origin dev  # Get latest changes / Obtener últimos cambios

# Work and commit / Trabajar y hacer commit
git add .
git commit -m "docs: update privacy policy"
git push origin feature/legal-policy-update

# Create PR: feature/legal-policy-update → dev
```

---

## ✅ Verification Checklist / Lista de Verificación

After setup, verify: / Después de la configuración, verificar:

- [ ] `dev` branch exists and is up to date / La rama `dev` existe y está actualizada
- [ ] All feature branches created / Todas las ramas de funcionalidades creadas
- [ ] Branch protection rules configured / Reglas de protección de ramas configuradas
- [ ] Team members have access / Los miembros del equipo tienen acceso
- [ ] Documentation updated / Documentación actualizada

---

## 📞 Support / Soporte

If you encounter issues during setup: / Si encuentras problemas durante la configuración:

- Check [docs/GIT_WORKFLOW.md](GIT_WORKFLOW.md) for detailed workflow / Consultar [docs/GIT_WORKFLOW.md](GIT_WORKFLOW.md) para flujo de trabajo detallado
- Create an issue in the repository / Crear un issue en el repositorio
- Contact the project maintainer / Contactar al mantenedor del proyecto
