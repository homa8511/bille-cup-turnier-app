-- UUID-Erweiterung für eindeutige IDs aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabelle für die teilnehmenden Mannschaften
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für die Turniergruppen (Vorrunde, Zwischenrunde, Finalrunde)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    phase VARCHAR(50) NOT NULL CHECK (phase IN ('VORRUNDE', 'ZWISCHENRUNDE', 'FINALRUNDE')),
    field_numbers INT[] NOT NULL
);

-- Verknüpfungstabelle für Teams in Gruppen inklusive Tabellenstand
CREATE TABLE IF NOT EXISTS group_teams (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    points INT DEFAULT 0,
    matches_played INT DEFAULT 0,
    goals_scored INT DEFAULT 0,
    goals_conceded INT DEFAULT 0,
    rank INT DEFAULT 0,
    PRIMARY KEY (group_id, team_id)
);

-- Tabelle für den Spielplan und die Ergebnisse
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_number INT NOT NULL,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    home_placeholder VARCHAR(100),
    away_placeholder VARCHAR(100),
    goals_home INT,
    goals_away INT,
    group_id UUID REFERENCES groups(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'GEPLANT' CHECK (status IN ('GEPLANT', 'LIVE', 'BEENDET'))
);

-- Tabelle für globale Turniereinstellungen
CREATE TABLE IF NOT EXISTS tournament_settings (
    id INT PRIMARY KEY DEFAULT 1,
    tournament_name VARCHAR(255),
    match_duration_minutes INT DEFAULT 10,
    pause_duration_minutes INT DEFAULT 2,
    phase_start_time TIMESTAMP,
    tournament_logo_path VARCHAR(255),
    background_image_path VARCHAR(255),
    background_image_mobile_path VARCHAR(255),
    footer_text_de TEXT,
    footer_text_en TEXT
);

-- Tabelle für redaktionelle Seiten (z.B. Turnierinfos)
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

-- Standard-Einstellungen einfügen
INSERT INTO tournament_settings (id, match_duration_minutes, pause_duration_minutes) 
VALUES (1, 10, 2)
ON CONFLICT (id) DO NOTHING;