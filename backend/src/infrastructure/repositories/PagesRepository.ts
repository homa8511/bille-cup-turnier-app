import { PostgresClient } from "../database/PostgresClient";

export class PagesRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  public async fetchPage(slug: string): Promise<any> {
    const query = `SELECT * FROM pages WHERE slug = $1 LIMIT 1`;
    const result = await this.db.query(query, [slug]);
    return result.rows[0] || null;
  }

  public async updatePage(slug: string, payload: any): Promise<void> {
    const boxesJson = JSON.stringify(payload.sidebar_boxes_de || []);

    const query = `
            INSERT INTO pages (slug, title_de, title_en, content_de, content_en, sidebar_boxes_de, sidebar_boxes_en)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (slug) DO UPDATE
            SET title_de = $2,
                title_en = $3,
                content_de = $4,
                content_en = $5,
                sidebar_boxes_de = $6,
                sidebar_boxes_en = $7,
                updated_at = CURRENT_TIMESTAMP
        `;

    await this.db.query(query, [
      slug,
      payload.title_de || "",
      payload.title_en || "",
      payload.content_de || "",
      payload.content_en || "",
      boxesJson,
      boxesJson,
    ]);
  }
}
