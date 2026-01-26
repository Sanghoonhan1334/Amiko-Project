-- Fix post_reactions table to reference gallery_posts instead of posts
-- This fixes the foreign key constraint issue

-- Drop the existing foreign key constraint
ALTER TABLE public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey;

-- Add the correct foreign key constraint to gallery_posts
ALTER TABLE public.post_reactions ADD CONSTRAINT post_reactions_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.gallery_posts(id) ON DELETE CASCADE;

-- Verify the constraint was added
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'post_reactions' AND tc.constraint_type = 'FOREIGN KEY';

-- Check if there are any orphaned reactions (reactions pointing to non-existent posts)
SELECT COUNT(*) as orphaned_reactions
FROM public.post_reactions pr
LEFT JOIN public.gallery_posts gp ON pr.post_id = gp.id
WHERE gp.id IS NULL;

-- If there are orphaned reactions, you might want to clean them up:
-- DELETE FROM public.post_reactions WHERE post_id NOT IN (SELECT id FROM public.gallery_posts);

SELECT 'Post reactions table fixed to reference gallery_posts' as status;
