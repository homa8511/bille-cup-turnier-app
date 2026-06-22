import { PostgresClient } from "../database/PostgresClient";

export interface TournamentConfig {
  tournament_name: string | null;
  match_duration_minutes: number;
  pause_duration_minutes: number;
  phase_start_time: string | null;
  tournament_logo_path: string | null;
  background_image_path: string | null;
  background_image_mobile_path: string | null;
  footer_text_de: string | null;
  footer_text_en: string | null;
}

export class SettingsRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  public async fetchConfig(): Promise<TournamentConfig> {
    const query = `
            SELECT tournament_name, match_duration_minutes, pause_duration_minutes, phase_start_time, 
                   tournament_logo_path, background_image_path, background_image_mobile_path, 
                   footer_text_de, footer_text_en
            FROM tournament_settings LIMIT 1
        `;
    const result = await this.db.query(query);

    if (result.rows.length === 0) {
      return {
        tournament_name: null,
        match_duration_minutes: 10,
        pause_duration_minutes: 2,
        phase_start_time: "2026-06-27T09:00:00Z",
        tournament_logo_path: null,
        background_image_path: null,
        background_image_mobile_path: null,
        footer_text_de: "© 2026 Bille Cup - Alle Rechte vorbehalten.",
        footer_text_en: "© 2026 Bille Cup - All rights reserved.",
      };
    }

    return result.rows[0] as TournamentConfig;
  }

  public async updateConfig(config: Partial<TournamentConfig>): Promise<void> {
    const currentConfig = await this.fetchConfig();
    const mergedConfig = { ...currentConfig, ...config };

    const query = `
            INSERT INTO tournament_settings (
                id, tournament_name, match_duration_minutes, pause_duration_minutes, phase_start_time,
                tournament_logo_path, background_image_path, background_image_mobile_path, 
                footer_text_de, footer_text_en
            )
            VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE 
            SET tournament_name = $1,
                match_duration_minutes = $2, 
                pause_duration_minutes = $3, 
                phase_start_time = $4,
                tournament_logo_path = $5,
                background_image_path = $6,
                background_image_mobile_path = $7,
                footer_text_de = $8,
                footer_text_en = $9
        `;
    await this.db.query(query, [
      mergedConfig.tournament_name,
      mergedConfig.match_duration_minutes,
      mergedConfig.pause_duration_minutes,
      mergedConfig.phase_start_time,
      mergedConfig.tournament_logo_path,
      mergedConfig.background_image_path,
      mergedConfig.background_image_mobile_path,
      mergedConfig.footer_text_de,
      mergedConfig.footer_text_en,
    ]);
  }
}
