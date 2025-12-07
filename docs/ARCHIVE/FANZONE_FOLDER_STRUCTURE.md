# FanZone Phase B - Estructura de Carpetas

## 📁 Estructura Final (Consistente con proyecto existente)

```
src/
├── app/
│   └── community/
│       └── fanzone/
│           ├── page.tsx                    (FanZone Home)
│           ├── layout.tsx                  (Layout wrapper)
│           └── [slug]/
│               ├── page.tsx                (FanRoom Detail)
│               └── layout.tsx              (Detail layout)
│
├── components/
│   └── main/
│       └── app/
│           └── community/
│               └── fanzone/                (← Consistente con estructura existente)
│                   ├── FanzoneHome.tsx
│                   ├── FanzoneCard.tsx
│                   ├── MyFanzones.tsx
│                   ├── ExploreFanzones.tsx
│                   ├── CreateFanzoneFAB.tsx
│                   └── detail/
│                       ├── FanzoneDetailHeader.tsx
│                       ├── FanzoneDetailTabs.tsx
│                       ├── PostsTab.tsx
│                       ├── MediaTab.tsx
│                       ├── ChatTab.tsx
│                       ├── MembersTab.tsx
│                       └── CreatePostModal.tsx
│
├── i18n/
│   └── community/
│       ├── es.ts                          (Español)
│       ├── ko.ts                          (Coreano - futuro)
│       └── en.ts                          (Inglés - futuro)
│
├── lib/
│   ├── fanzone/
│   │   ├── storage.ts                     (Upload helpers)
│   │   ├── slug.ts                        (Slug generation)
│   │   └── validation.ts                   (Form validation)
│   └── supabase/
│       └── fanzone.ts                      (Fanzone queries)
│
└── types/
    └── fanzone.ts                         (TypeScript interfaces)
```

## 🎯 Principios de Organización

### **Consistencia con estructura existente:**
- `src/components/main/app/community/` ← Mantener patrón
- `src/app/community/` ← App Router pages
- `src/lib/` ← Utilidades y helpers
- `src/types/` ← Interfaces TypeScript

### **Separación de responsabilidades:**
- **Pages:** Solo routing y layout
- **Components:** Lógica de UI y estado
- **Lib:** Utilidades puras (storage, validation, etc.)
- **Types:** Definiciones TypeScript
- **i18n:** Strings de traducción

### **Escalabilidad:**
- Fácil agregar nuevas funcionalidades
- Componentes reutilizables
- APIs modulares
- i18n preparado para múltiples idiomas

