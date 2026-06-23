-- Du führst diesen SQL-Befehl auf deiner Produktionsdatenbank aus.
-- Das Backend kann die Base64-Strings der Sponsoren dann dauerhaft speichern.
ALTER TABLE tournament_settings ADD COLUMN sponsors JSONB DEFAULT '[]'::jsonb;