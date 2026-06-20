-- Das System bereinigt zunächst alle vorhandenen Daten für einen frischen Start.
TRUNCATE TABLE pages, tournament_settings, matches, group_teams, groups, teams RESTART IDENTITY CASCADE;

-- Das System legt 24 Mannschaften mit festen UUIDs für reproduzierbare Tests an.
INSERT INTO teams (id, name, logo_path) VALUES
('10000000-0000-0000-0000-000000000001', 'FC Bergedorf 85', '/public/images/uploads/bergedorf.webp'),
('10000000-0000-0000-0000-000000000002', 'ASV Bergedorf', '/public/images/uploads/asv.webp'),
('10000000-0000-0000-0000-000000000003', 'SC Wentorf', '/public/images/uploads/wentorf.webp'),
('10000000-0000-0000-0000-000000000004', 'VfL Lohbrügge', '/public/images/uploads/lohbruegge.webp'),
('10000000-0000-0000-0000-000000000005', 'Harburger SC', '/public/images/uploads/hsc.webp'),
('10000000-0000-0000-0000-000000000006', 'FC Süderelbe', '/public/images/uploads/suederelbe.webp'),
('10000000-0000-0000-0000-000000000007', 'Altona 93', '/public/images/uploads/altona.webp'),
('10000000-0000-0000-0000-000000000008', 'Teutonia 05', '/public/images/uploads/teutonia.webp'),
('10000000-0000-0000-0000-000000000009', 'Eimsbütteler TV', '/public/images/uploads/etv.webp'),
('10000000-0000-0000-0000-000000000010', 'Niendorfer TSV', '/public/images/uploads/ntsv.webp'),
('10000000-0000-0000-0000-000000000011', 'SC Victoria', '/public/images/uploads/victoria.webp'),
('10000000-0000-0000-0000-000000000012', 'HSV Barmbek-Uhlenhorst', '/public/images/uploads/bu.webp'),
('10000000-0000-0000-0000-000000000013', 'TuS Dassendorf', '/public/images/uploads/dassendorf.webp'),
('10000000-0000-0000-0000-000000000014', 'TSV Buchholz 08', '/public/images/uploads/buchholz.webp'),
('10000000-0000-0000-0000-000000000015', 'SV Curslack-Neuengamme', '/public/images/uploads/cn.webp'),
('10000000-0000-0000-0000-000000000016', 'Düneberger SV', '/public/images/uploads/dueneberg.webp'),
('10000000-0000-0000-0000-000000000017', 'SV Rugenbergen', '/public/images/uploads/rugenbergen.webp'),
('10000000-0000-0000-0000-000000000018', 'TuRa Harksheide', '/public/images/uploads/harksheide.webp'),
('10000000-0000-0000-0000-000000000019', 'USC Paloma', '/public/images/uploads/paloma.webp'),
('10000000-0000-0000-0000-000000000020', 'HEBC', '/public/images/uploads/hebc.webp'),
('10000000-0000-0000-0000-000000000021', 'FC Türkiye', '/public/images/uploads/tuerkiye.webp'),
('10000000-0000-0000-0000-000000000022', 'Wandsbeker TSV Concordia', '/public/images/uploads/concordia.webp'),
('10000000-0000-0000-0000-000000000023', 'TSV Sasel', '/public/images/uploads/sasel.webp'),
('10000000-0000-0000-0000-000000000024', 'SV Halstenbek-Rellingen', '/public/images/uploads/hr.webp');

-- Das System generiert vier Gruppen für die Vorrunde mit Array-Spielfeldern.
INSERT INTO groups (id, name, phase, field_numbers) VALUES
('20000000-0000-0000-0000-000000000001', 'Gruppe A', 'VORRUNDE', ARRAY[1]),
('20000000-0000-0000-0000-000000000002', 'Gruppe B', 'VORRUNDE', ARRAY[2]),
('20000000-0000-0000-0000-000000000003', 'Gruppe C', 'VORRUNDE', ARRAY[3]),
('20000000-0000-0000-0000-000000000004', 'Gruppe D', 'VORRUNDE', ARRAY[4]),
('20000000-0000-0000-0000-000000000005', 'Finalrunde', 'FINALRUNDE', ARRAY[1, 2, 3, 4, 5, 6]);

-- Das System ordnet der ersten Gruppe sechs Mannschaften zu.
INSERT INTO group_teams (group_id, team_id, points, matches_played, goals_scored, goals_conceded, rank) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 3, 1, 2, 0, 1),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 0, 1, 0, 2, 6),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 1, 1, 1, 1, 3),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 1, 1, 1, 1, 4),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 0, 0, 0, 0, 2),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 0, 0, 0, 0, 5);

-- Das System erzeugt einige Beispielspiele für die Gruppen.
INSERT INTO matches (id, match_number, home_team_id, away_team_id, home_placeholder, away_placeholder, goals_home, goals_away, group_id, start_time, end_time, status) VALUES
('30000000-0000-0000-0000-000000000001', 1, '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', NULL, NULL, 2, 0, '20000000-0000-0000-0000-000000000001', '2026-06-27T09:00:00Z', '2026-06-27T09:10:00Z', 'BEENDET'),
('30000000-0000-0000-0000-000000000002', 2, '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', NULL, NULL, 1, 1, '20000000-0000-0000-0000-000000000001', '2026-06-27T09:12:00Z', '2026-06-27T09:22:00Z', 'BEENDET'),
('30000000-0000-0000-0000-000000000003', 3, '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', NULL, NULL, NULL, NULL, '20000000-0000-0000-0000-000000000001', '2026-06-27T09:24:00Z', '2026-06-27T09:34:00Z', 'GEPLANT'),
('30000000-0000-0000-0000-000000000004', 100, NULL, NULL, 'Sieger A', 'Zweiter B', NULL, NULL, '20000000-0000-0000-0000-000000000005', '2026-06-27T14:00:00Z', '2026-06-27T14:10:00Z', 'GEPLANT');

-- Das System hinterlegt die globalen Einstellungen für das Turnier.
INSERT INTO tournament_settings (id, match_duration_minutes, pause_duration_minutes, phase_start_time, tournament_logo_path, background_image_path, background_image_mobile_path, footer_text_de, footer_text_en) VALUES
(1, 10, 2, '2026-06-27T09:00:00Z', '/public/images/logo.webp', '/public/images/bg-desktop.webp', '/public/images/bg-mobile.webp', '© 2026 Bille Cup - Alle Rechte vorbehalten.', '© 2026 Bille Cup - All rights reserved.');

-- Das System speichert eine Testseite für die Turnierregeln.
INSERT INTO pages (id, slug, title_de, title_en, markdown_content_de, markdown_content_en) VALUES
('40000000-0000-0000-0000-000000000001', 'rules', 'Turnierregeln', 'Tournament Rules', '# Bille Cup Regeln\n\nHier stehen die Regeln für das Turnier.', '# Bille Cup Rules\n\nThese are the rules for the tournament.');