-- Diese Erweiterung ermöglicht die Generierung von eindeutigen UUIDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Diese Tabelle speichert alle teilnehmenden Mannschaften für das Turnier.
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diese Tabelle verwaltet die Gruppen inklusive der neuen Feld-Arrays.
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    phase VARCHAR(50) NOT NULL CHECK (phase IN ('VORRUNDE', 'ZWISCHENRUNDE', 'FINALRUNDE')),
    field_numbers INTEGER[] NOT NULL
);

-- Diese Tabelle speichert die Platzierungen der Mannschaften in ihren Gruppen.
CREATE TABLE IF NOT EXISTS group_teams (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    PRIMARY KEY (group_id, team_id)
);

-- Diese Tabelle enthält alle Spiele inklusive der neuen Platzhalter-Spalten.
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_number INTEGER NOT NULL,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    home_placeholder VARCHAR(100),
    away_placeholder VARCHAR(100),
    goals_home INTEGER,
    goals_away INTEGER,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'GEPLANT' CHECK (status IN ('GEPLANT', 'LIVE', 'BEENDET'))
);

-- Diese Tabelle sichert die globalen Turniereinstellungen und Layout-Pfade.
CREATE TABLE IF NOT EXISTS tournament_settings (
    id INTEGER PRIMARY KEY,
    match_duration_minutes INTEGER DEFAULT 10,
    pause_duration_minutes INTEGER DEFAULT 2,
    phase_start_time TIMESTAMP WITH TIME ZONE,
    tournament_logo_path VARCHAR(500),
    background_image_path VARCHAR(500),
    background_image_mobile_path VARCHAR(500),
    footer_text_de TEXT,
    footer_text_en TEXT
);

-- Diese Tabelle verwaltet die zweisprachigen Informationsseiten für das Frontend.
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title_de VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    markdown_content_de TEXT,
    markdown_content_en TEXT,
    sidebar_boxes_de JSONB DEFAULT '[]'::jsonb,
    sidebar_boxes_en JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dieser Befehl fügt einen Standardeintrag für die globalen Einstellungen ein.
INSERT INTO tournament_settings (
    id, 
    match_duration_minutes, 
    pause_duration_minutes, 
    phase_start_time, 
    footer_text_de, 
    footer_text_en
) VALUES (
    1, 
    10, 
    2, 
    '2026-06-27T09:00:00Z', 
    '© 2026 Bille Cup - Alle Rechte vorbehalten.', 
    '© 2026 Bille Cup - All rights reserved.'
) ON CONFLICT (id) DO NOTHING;