# Branch Protection Rules / Reglas de Protección de Ramas

This document describes the branch protection rules for Amiko Project. / Este documento describe las reglas de protección de ramas para el proyecto Amiko.

---

## 🔒 main Branch Protection / Protección de Rama main

### Rules / Reglas

- ❌ **Direct push FORBIDDEN** / Push directo PROHIBIDO
  - All changes must go through PR from `dev` / Todos los cambios deben pasar por PR desde `dev`
  
- ✅ **Require Pull Request** / Requerir Pull Request
  - Minimum 1 approval required / Mínimo 1 aprobación requerida
  - Dismiss stale reviews when new commits are pushed / Descartar revisiones obsoletas cuando se suben nuevos commits
  
- ✅ **Require Status Checks** / Requerir Verificaciones de Estado
  - CI must pass before merging / CI debe pasar antes de fusionar
  - Require branches to be up to date / Requerir que las ramas estén actualizadas
  
- ❌ **Restrictions** / Restricciones
  - Do not allow force pushes / No permitir force pushes
  - Do not allow deletions / No permitir eliminaciones
  - Do not allow bypassing the above settings / No permitir omitir la configuración anterior

### GitHub Configuration / Configuración de GitHub

1. Go to repository **Settings** → **Branches** / Ir a **Configuración** del repositorio → **Branches**
2. Click **Add branch protection rule** / Hacer clic en **Agregar regla de protección de rama**
3. Branch name pattern: `main` / Patrón de nombre de rama: `main`
4. Enable the following: / Habilitar lo siguiente:
   - ✅ Require a pull request before merging / Requerir un pull request antes de fusionar
   - ✅ Require approvals: **1** / Requerir aprobaciones: **1**
   - ✅ Require status checks to pass before merging / Requerir que las verificaciones de estado pasen antes de fusionar
   - ✅ Require branches to be up to date before merging / Requerir que las ramas estén actualizadas antes de fusionar
   - ❌ Do not allow bypassing the above settings / No permitir omitir la configuración anterior
   - ❌ Restrict pushes that create files / Restringir pushes que crean archivos

---

## 🔒 dev Branch Protection / Protección de Rama dev

### Rules / Reglas

- ✅ **Require Pull Request** / Requerir Pull Request
  - Minimum 1 approval required / Mínimo 1 aprobación requerida
  - Allow merge commits / Permitir commits de fusión
  
- ✅ **Require Status Checks** / Requerir Verificaciones de Estado
  - CI must pass before merging / CI debe pasar antes de fusionar
  
- ❌ **Restrictions** / Restricciones
  - Do not allow force pushes / No permitir force pushes
  - Do not allow deletions / No permitir eliminaciones

### GitHub Configuration / Configuración de GitHub

1. Go to repository **Settings** → **Branches** / Ir a **Configuración** del repositorio → **Branches**
2. Click **Add branch protection rule** / Hacer clic en **Agregar regla de protección de rama**
3. Branch name pattern: `dev` (or `develop` if using that) / Patrón de nombre de rama: `dev` (o `develop` si se usa ese)
4. Enable the following: / Habilitar lo siguiente:
   - ✅ Require a pull request before merging / Requerir un pull request antes de fusionar
   - ✅ Require approvals: **1** / Requerir aprobaciones: **1**
   - ✅ Require status checks to pass before merging / Requerir que las verificaciones de estado pasen antes de fusionar
   - ❌ Do not allow force pushes / No permitir force pushes
   - ❌ Do not allow deletions / No permitir eliminaciones

---

## 📋 Status Checks / Verificaciones de Estado

### Required Checks / Verificaciones Requeridas

- **Build** - Code must compile / El código debe compilarse
- **Lint** - ESLint must pass / ESLint debe pasar
- **Type Check** - TypeScript type checking / Verificación de tipos de TypeScript

### CI Configuration / Configuración de CI

The project should have CI configured to run: / El proyecto debe tener CI configurado para ejecutar:

```yaml
# Example GitHub Actions workflow / Ejemplo de flujo de trabajo de GitHub Actions
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run lint
```

---

## 🚨 What Happens When Rules Are Violated / Qué Sucede Cuando se Violan las Reglas

### Attempting Direct Push to main / Intentar Push Directo a main

```bash
# This will FAIL / Esto FALLARÁ
git push origin main

# Error: You are not allowed to push code directly to main
# Error: No se permite hacer push directo a main
```

### Solution / Solución

1. Create feature branch / Crear rama de funcionalidad
2. Create PR to `dev` / Crear PR a `dev`
3. After merge to `dev`, create PR to `main` / Después de fusionar a `dev`, crear PR a `main`

---

## ✅ Verification / Verificación

After setting up protection rules, verify: / Después de configurar las reglas de protección, verificar:

1. Try to push directly to `main` (should fail) / Intentar hacer push directo a `main` (debe fallar)
2. Create a test PR to `dev` (should require approval) / Crear un PR de prueba a `dev` (debe requerir aprobación)
3. Check that status checks are required / Verificar que se requieran verificaciones de estado

---

## 📞 Support / Soporte

If you need help setting up branch protection: / Si necesitas ayuda para configurar la protección de ramas:

- See [GitHub Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- Create an issue in the repository / Crear un issue en el repositorio
- Contact the project maintainer / Contactar al mantenedor del proyecto
