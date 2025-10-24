# 🚀 Próximos Pasos: Implementación FanZone

## ✅ Fase A Completada

**Community Home con 6 íconos** está implementado y funcionando perfectamente.

---

## 🎯 Fase B: Implementar FanZone

### **Objetivo:**
Crear el módulo completo de FanZone siguiendo el diseño aprobado:
1. **Home de FanZone** (exploración + mis comunidades)
2. **Detalle de FanRoom** (cover + tabs)
3. **Modal Crear FanRoom** (formulario)

---

## 📋 Checklist de Implementación

### **🅱️1 - FanZone Home**

#### Archivos a crear:
```
src/app/community/fanzone/
├── page.tsx                    (Main page)
├── layout.tsx                  (Optional wrapper)

src/components/fanzone/
├── FanzoneHome.tsx             (Home component)
├── FanzoneCard.tsx             (Card para cada FanRoom)
├── MyFanzones.tsx              (Scroll horizontal)
├── ExploreFanzones.tsx         (Grid Masonry)
├── CreateFanzoneFAB.tsx        (Floating Action Button)
└── types.ts                    (TypeScript interfaces)
```

#### Características:
- [x] Header sticky con búsqueda y avatar
- [x] Sección "Mis Comunidades" (scroll horizontal)
- [x] Filtros (Popular, Recientes, K-Pop, K-Drama)
- [x] Grid Masonry estilo Pinterest (2 columnas mobile)
- [x] FAB "Crear FanRoom" con sparkle
- [x] Estados vacíos (sin comunidades)
- [x] Loading skeletons
- [x] Infinite scroll o paginación

#### Base de datos necesaria:
```sql
-- Tabla fanrooms
CREATE TABLE fanrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  category TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  member_count INT DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla fanroom_members
CREATE TABLE fanroom_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'creator', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fanroom_id, user_id)
);

-- RLS Policies
ALTER TABLE fanrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_members ENABLE ROW LEVEL SECURITY;

-- Policies para lectura pública, escritura autenticada
```

---

### **🅱️2 - FanZone Detalle**

#### Archivos a crear:
```
src/app/community/fanzone/[roomId]/
├── page.tsx                    (Detail page)
├── layout.tsx                  (Optional)

src/components/fanzone/detail/
├── FanzoneDetailHeader.tsx     (Cover + info + botones)
├── FanzoneDetailTabs.tsx       (Tabs sticky)
├── PostsTab.tsx                (Feed de posts)
├── MediaTab.tsx                (Grid 3×3 de fotos/videos)
├── ChatTab.tsx                 (Chat en tiempo real)
├── MembersTab.tsx              (Lista de miembros)
└── CreatePostModal.tsx         (Modal para crear post)
```

#### Características:
- [x] Cover image 16:9 con overlay
- [x] Botón "Unirme" / "Unido"
- [x] Stats (miembros, activos)
- [x] Tabs sticky: Posts | Media | Chat | Miembros
- [x] Chat en tiempo real (Supabase Realtime)
- [x] Upload de imágenes/videos
- [x] Sistema de likes y comentarios
- [x] Notificaciones

#### Base de datos necesaria:
```sql
-- Tabla fanroom_posts
CREATE TABLE fanroom_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  content TEXT,
  media_urls TEXT[],
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla fanroom_chat
CREATE TABLE fanroom_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_fanroom_posts_fanroom ON fanroom_posts(fanroom_id);
CREATE INDEX idx_fanroom_chat_fanroom ON fanroom_chat(fanroom_id);
```

---

### **🅱️3 - Modal Crear FanRoom**

#### Archivos a crear:
```
src/components/fanzone/
├── CreateFanzoneModal.tsx      (Main modal)
├── CoverImageUpload.tsx        (Component de upload)
└── CategorySelect.tsx          (Selector de categoría)
```

#### Características:
- [x] Upload de imagen de portada (drag & drop)
- [x] Input de nombre (3-50 caracteres)
- [x] Textarea de descripción (opcional, max 200)
- [x] Select de categoría (K-Pop, K-Drama, etc.)
- [x] Validación inline
- [x] Confetti animation al crear
- [x] Redirect a FanRoom creado

#### API necesaria:
```typescript
// src/app/api/fanzone/create/route.ts
export async function POST(request: Request) {
  // 1. Validar usuario autenticado
  // 2. Upload imagen a Supabase Storage
  // 3. Crear registro en fanrooms
  // 4. Añadir creator como primer miembro
  // 5. Return fanroom id
}
```

---

## 🗄️ Estructura de Base de Datos Completa

### **Schema SQL:**
```sql
-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla fanrooms
CREATE TABLE fanrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  category TEXT NOT NULL CHECK (category IN ('kpop', 'kdrama', 'kbeauty', 'kfood', 'kgaming', 'learning', 'other')),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INT DEFAULT 1,
  active_members INT DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla fanroom_members
CREATE TABLE fanroom_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fanroom_id, user_id)
);

-- 3. Tabla fanroom_posts
CREATE TABLE fanroom_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla fanroom_post_likes
CREATE TABLE fanroom_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES fanroom_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. Tabla fanroom_post_comments
CREATE TABLE fanroom_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES fanroom_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla fanroom_chat
CREATE TABLE fanroom_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_fanrooms_category ON fanrooms(category);
CREATE INDEX idx_fanrooms_trending ON fanrooms(is_trending) WHERE is_trending = true;
CREATE INDEX idx_fanroom_members_user ON fanroom_members(user_id);
CREATE INDEX idx_fanroom_posts_fanroom ON fanroom_posts(fanroom_id);
CREATE INDEX idx_fanroom_chat_fanroom ON fanroom_chat(fanroom_id);

-- Triggers para actualizar member_count
CREATE OR REPLACE FUNCTION update_fanroom_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fanrooms SET member_count = member_count + 1 WHERE id = NEW.fanroom_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fanrooms SET member_count = member_count - 1 WHERE id = OLD.fanroom_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR DELETE ON fanroom_members
FOR EACH ROW EXECUTE FUNCTION update_fanroom_member_count();

-- RLS Policies
ALTER TABLE fanrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_chat ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver fanrooms
CREATE POLICY "Fanrooms are viewable by everyone"
  ON fanrooms FOR SELECT
  USING (true);

-- Policy: Solo autenticados pueden crear fanrooms
CREATE POLICY "Authenticated users can create fanrooms"
  ON fanrooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Policy: Solo creator puede editar/eliminar
CREATE POLICY "Creators can update their fanrooms"
  ON fanrooms FOR UPDATE
  USING (auth.uid() = creator_id);

-- Policy: Ver miembros si eres miembro
CREATE POLICY "Members can view other members"
  ON fanroom_members FOR SELECT
  USING (
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Unirse a fanrooms
CREATE POLICY "Users can join fanrooms"
  ON fanroom_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Ver posts si eres miembro
CREATE POLICY "Members can view posts"
  ON fanroom_posts FOR SELECT
  USING (
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Crear posts si eres miembro
CREATE POLICY "Members can create posts"
  ON fanroom_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Similar policies para chat...
```

---

## 🎨 Componentes Reutilizables

### **Ya creados (de Phase A):**
- `CommunityCard.tsx` (puede servir de base para `FanzoneCard`)
- Animación `glow-pulse` en `globals.css`
- Sistema de colores definido

### **A crear (nuevos):**
```typescript
// src/components/fanzone/shared/
├── FanzoneCard.tsx         (Card para grid Masonry)
├── FanzoneAvatar.tsx       (Avatar con online status)
├── FanzoneButton.tsx       (Botones con estilo Weverse)
├── FanzoneInput.tsx        (Inputs con estilo unified)
├── FanzoneSkeleton.tsx     (Loading states)
└── FanzoneEmptyState.tsx   (Estados vacíos)
```

---

## 🔧 APIs Necesarias

### **Crear estos endpoints:**
```
src/app/api/fanzone/
├── create/route.ts         (POST: crear fanroom)
├── join/route.ts           (POST: unirse a fanroom)
├── leave/route.ts          (DELETE: salir de fanroom)
├── posts/route.ts          (GET/POST: posts del fanroom)
├── chat/route.ts           (GET: mensajes chat)
└── members/route.ts        (GET: lista de miembros)
```

---

## 📝 TypeScript Interfaces

### **Crear archivo de tipos:**
```typescript
// src/types/fanzone.ts

export interface Fanroom {
  id: string
  name: string
  description?: string
  cover_image?: string
  category: FanzoneCategory
  creator_id: string
  member_count: number
  active_members: number
  is_trending: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export type FanzoneCategory = 
  | 'kpop' 
  | 'kdrama' 
  | 'kbeauty' 
  | 'kfood' 
  | 'kgaming' 
  | 'learning' 
  | 'other'

export interface FanroomMember {
  id: string
  fanroom_id: string
  user_id: string
  role: 'creator' | 'admin' | 'moderator' | 'member'
  joined_at: string
  last_active_at: string
}

export interface FanroomPost {
  id: string
  fanroom_id: string
  author_id: string
  author_name?: string
  author_avatar?: string
  content: string
  media_urls: string[]
  likes_count: number
  comments_count: number
  is_liked?: boolean // por usuario actual
  created_at: string
  updated_at: string
}

export interface FanroomChatMessage {
  id: string
  fanroom_id: string
  user_id: string
  user_name?: string
  user_avatar?: string
  message: string
  created_at: string
}
```

---

## 🎯 Orden de Implementación Recomendado

### **Semana 1: Base**
1. ✅ Crear schema SQL en Supabase
2. ✅ Crear tipos TypeScript (`fanzone.ts`)
3. ✅ Crear página `/community/fanzone/page.tsx`
4. ✅ Crear componente `FanzoneHome.tsx` básico
5. ✅ Implementar header sticky

### **Semana 2: Exploración**
6. ✅ Crear `FanzoneCard.tsx`
7. ✅ Implementar grid Masonry
8. ✅ Crear filtros (Popular, Recientes, etc.)
9. ✅ API para listar fanrooms (`GET /api/fanzone`)
10. ✅ Loading states y skeletons

### **Semana 3: Detalle**
11. ✅ Crear página `/community/fanzone/[roomId]/page.tsx`
12. ✅ Implementar header con cover image
13. ✅ Sistema de tabs sticky
14. ✅ Tab "Posts" con feed
15. ✅ Tab "Media" con grid 3×3

### **Semana 4: Interacción**
16. ✅ Tab "Chat" con Supabase Realtime
17. ✅ Tab "Miembros" con lista
18. ✅ Sistema de likes y comentarios
19. ✅ Botón "Unirme" / "Salir"
20. ✅ Notificaciones básicas

### **Semana 5: Creación**
21. ✅ FAB "Crear FanRoom"
22. ✅ Modal con formulario
23. ✅ Upload de imagen de portada
24. ✅ Validación completa
25. ✅ Confetti animation

### **Semana 6: Polish**
26. ✅ Animaciones y transiciones
27. ✅ Estados vacíos
28. ✅ Manejo de errores
29. ✅ Testing completo
30. ✅ Optimizaciones de performance

---

## 🚦 Prioridades

### **Must Have (MVP):**
- ✅ Home de FanZone con exploración
- ✅ Detalle de FanRoom con tabs
- ✅ Unirse/salir de fanrooms
- ✅ Ver posts y media
- ✅ Chat básico
- ✅ Crear fanroom

### **Nice to Have (V1.1):**
- [ ] Búsqueda de fanrooms
- [ ] Recomendaciones personalizadas
- [ ] Notificaciones push
- [ ] Sistema de roles (admin/moderator)
- [ ] Reportes y moderación

### **Future (V2.0):**
- [ ] Video chat grupal
- [ ] Eventos y meetups
- [ ] Marketplace (venta de merch)
- [ ] Integración con sistema de puntos
- [ ] Gamificación

---

## 📚 Recursos Útiles

### **Documentación:**
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

### **Referencias de diseño:**
- Weverse UI patterns
- Discord community structure
- Pinterest Masonry layout
- Instagram Stories/Posts

---

## ✅ Checklist Final Antes de Empezar

- [x] **Fase A completada:** Community Home con 6 íconos ✅
- [x] **Diseño aprobado:** Wireframes y specs de FanZone ✅
- [ ] **Base de datos:** Schema SQL ejecutado en Supabase
- [ ] **Storage:** Bucket "fanzone-covers" creado en Supabase
- [ ] **Tipos:** Interfaces TypeScript creadas
- [ ] **Rutas:** Estructura de carpetas planeada
- [ ] **API:** Endpoints mapeados

---

## 🎉 ¡Listo para Implementar!

Con todo lo preparado en la Fase A, ahora puedes:

1. **Ejecutar SQL schema** en Supabase
2. **Crear estructura de carpetas** mencionada arriba
3. **Comenzar con FanzoneHome** (más simple)
4. **Iterar hacia FanRoom Detail** (más complejo)
5. **Terminar con Create Modal** (integración final)

**Tiempo estimado:** 4-6 semanas para MVP completo

**¡Adelante con FanZone! 💜✨**

