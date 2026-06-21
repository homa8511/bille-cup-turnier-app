import { PostgresClient } from "../database/PostgresClient";

// Diese Schnittstelle definiert das Datenmodell für eine zweisprachige Informationsseite.
export interface PageContent {
  id: string;
  slug: string;
  title_de: string;
  title_en: string;
  markdown_content_de: string;
  markdown_content_en: string;
  updated_at: Date;
}

// Dieses Repository verwaltet alle zweisprachigen redaktionellen Inhalte für das Frontend.
export class ContentRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  // Diese Methode lädt eine spezifische Seite anhand ihres eindeutigen URL-Pfads.
  public async fetchPageBySlug(slug: string): Promise<PageContent | null> {
    const query = `SELECT * FROM pages WHERE slug = $1`;
    const result = await this.db.query(query, [slug]);
    return result.rows[0] || null;
  }

  // Diese Methode speichert oder aktualisiert den zweisprachigen Markdown-Inhalt einer Seite.
  public async upsertPage(
    slug: string,
    title_de: string,
    title_en: string,
    content_de: string,
    content_en: string,
  ): Promise<void> {
    const query = `
            INSERT INTO pages (id, slug, title_de, title_en, markdown_content_de, markdown_content_en)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
            ON CONFLICT (slug) DO UPDATE 
            SET title_de = $2, 
                title_en = $3,
                markdown_content_de = $4,
                markdown_content_en = $5,
                updated_at = CURRENT_TIMESTAMP
        `;
    await this.db.query(query, [
      slug,
      title_de,
      title_en,
      content_de,
      content_en,
    ]);
  }
}
