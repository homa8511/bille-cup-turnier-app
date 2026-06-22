import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
  }),
});

export const matchResultSchema = z.object({
  body: z.object({
    goals_home: z.number().int().min(0).max(99),
    goals_away: z.number().int().min(0).max(99),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const settingsSchema = z.object({
  body: z.object({
    match_duration_minutes: z.number().int().min(1).max(120),
    pause_duration_minutes: z.number().int().min(0).max(60),
    phase_start_time: z.string().datetime().nullable().optional(),
    footer_text_de: z.string().max(500).nullable().optional(),
    footer_text_en: z.string().max(500).nullable().optional(),
  }),
});

export const imageUploadSchema = z.object({
  file: z.object(
    {
      mimetype: z.enum(["image/jpeg", "image/png", "image/webp"], {
        message: "Nur JPG, PNG und WEBP sind erlaubt.",
      }),
      size: z
        .number()
        .max(2 * 1024 * 1024, "Das Bild darf maximal 2 MB groß sein."),
    },
    { message: "Es wurde keine Datei übermittelt." },
  ),
});

export const pdfUploadSchema = z.object({
  file: z.object(
    {
      mimetype: z.literal("application/pdf", {
        message: "Nur PDF-Dokumente sind erlaubt.",
      }),
      size: z
        .number()
        .max(5 * 1024 * 1024, "Das Dokument darf maximal 5 MB groß sein."),
    },
    { message: "Es wurde keine Datei übermittelt." },
  ),
});

// Definition des Schemas für eine einzelne Info-Box
const infoBoxSchema = z.object({
  id: z.string().min(1),
  icon: z.string().min(1),
  title: z.string().max(100),
  content: z.string().max(2000),
});

export const pageContentSchema = z.object({
  body: z.object({
    title_de: z.string().min(1).max(255),
    title_en: z.string().min(1).max(255),
    content_de: z.string().max(50000),
    content_en: z.string().max(50000),
    sidebar_boxes_de: z.array(infoBoxSchema).optional(),
    sidebar_boxes_en: z.array(infoBoxSchema).optional(),
  }),
  params: z.object({
    slug: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[a-z0-9-]+$/),
  }),
});

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

export const updateTeamNameSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
