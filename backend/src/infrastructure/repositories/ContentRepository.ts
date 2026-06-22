import { PostgresClient } from "../database/PostgresClient";

export interface PageContent {
  id: string;
  slug: string;
  title_de: string;
  title_en: string;
  markdown_content_de: string;
  markdown_content_en: string;
  sidebar_boxes_de: any;
  sidebar_boxes_en: any;
  updated_at: Date;
}

export class ContentRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  public async fetchPageBySlug(slug: string): Promise<PageContent | null> {
    const query = `SELECT * FROM pages WHERE slug = $1`;
    const result = await this.db.query(query, [slug]);
    return result.rows[0] || null;
  }

  public async upsertPage(
    slug: string,
    title_de: string,
    title_en: string,
    content_de: string,
    content_en: string,
    sidebar_boxes_de: any = [],
    sidebar_boxes_en: any = [],
  ): Promise<void> {
    const query = `
            INSERT INTO pages (id, slug, title_de, title_en, markdown_content_de, markdown_content_en, sidebar_boxes_de, sidebar_boxes_en)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (slug) DO UPDATE 
            SET title_de = $2, 
                title_en = $3,
                markdown_content_de = $4,
                markdown_content_en = $5,
                sidebar_boxes_de = $6,
                sidebar_boxes_en = $7,
                updated_at = CURRENT_TIMESTAMP
        `;
    await this.db.query(query, [
      slug,
      title_de,
      title_en,
      content_de,
      content_en,
      JSON.stringify(sidebar_boxes_de),
      JSON.stringify(sidebar_boxes_en),
    ]);
  }
}
