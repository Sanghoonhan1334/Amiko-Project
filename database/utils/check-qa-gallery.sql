SELECT id, slug, name_ko, name_es 
FROM galleries 
WHERE slug LIKE '%qa%' OR slug LIKE '%question%' OR name_ko LIKE '%질문%' OR name_ko LIKE '%Q&A%';
