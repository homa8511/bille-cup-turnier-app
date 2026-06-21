import { z } from "zod";

// Dieses Schema validiert die Struktur der Anmeldedaten für den Administrator.
export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
  }),
});

// Dieses Schema prüft die Eingabewerte bei der Speicherung eines Spielergebnisses.
export const matchResultSchema = z.object({
  body: z.object({
    goals_home: z.number().int().min(0).max(99),
    goals_away: z.number().int().min(0).max(99),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Dieses Schema sichert die globalen Turniereinstellungen gegen fehlerhafte Werte ab.
export const settingsSchema = z.object({
  body: z.object({
    match_duration_minutes: z.number().int().min(1).max(120),
    pause_duration_minutes: z.number().int().min(0).max(60),
    phase_start_time: z.string().datetime().nullable().optional(),
    footer_text_de: z.string().max(500).nullable().optional(),
    footer_text_en: z.string().max(500).nullable().optional(),
  }),
});

// Dieses Schema kontrolliert die Inhalte bei der Aktualisierung einer Markdown-Seite.
export const pageContentSchema = z.object({
  body: z.object({
    title_de: z.string().min(1).max(255),
    title_en: z.string().min(1).max(255),
    content_de: z.string().max(50000),
    content_en: z.string().max(50000),
  }),
  params: z.object({
    slug: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[a-z0-9-]+$/),
  }),
});

// Dieses komplexe Schema validiert den gesamten Datensatz für die Initialisierung des Turniers.
export const initTournamentSchema = z.object({
  body: z.object({
    matchDuration: z.number().min(1).max(120),
    pauseDuration: z.number().min(0).max(60),
    vorrundeStartTime: z.string().datetime(),
    zwischenrundeStartTime: z.string().datetime(),
    finalrundeStartTime: z.string().datetime(),
    teams: z
      .array(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1),
        }),
      )
      .min(2),
    groups: z
      .array(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1),
          phase: z.enum(["VORRUNDE", "ZWISCHENRUNDE", "FINALRUNDE"]),
          fieldNumbers: z.array(z.number()),
          teamIds: z.array(z.string().uuid()),
        }),
      )
      .min(1),
  }),
});
