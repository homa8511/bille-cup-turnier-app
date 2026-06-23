-- Führe dieses Skript auf deiner Produktionsdatenbank aus
CREATE TABLE IF NOT EXISTS pages (
    slug VARCHAR(255) PRIMARY KEY,
    title_de VARCHAR(255),
    title_en VARCHAR(255),
    content_de TEXT,
    content_en TEXT,
    sidebar_boxes_de JSONB DEFAULT '[]'::jsonb,
    sidebar_boxes_en JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tournament_settings ADD COLUMN IF NOT EXISTS footer_text_de TEXT;
ALTER TABLE tournament_settings ADD COLUMN IF NOT EXISTS footer_text_en TEXT;