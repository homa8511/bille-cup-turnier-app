import { Request, Response } from "express";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as path from "path";
import sharp from "sharp";
import { TournamentFlowApplication } from "../../application/services/TournamentFlowApplication";
import { PostgresClient } from "../../infrastructure/database/PostgresClient";
import { ContentRepository } from "../../infrastructure/repositories/ContentRepository";
import { SettingsRepository } from "../../infrastructure/repositories/SettingsRepository";

const JWT_SECRET = process.env.JWT_SECRET || "turniergeheimnis2026";
let sseClients: Response[] = [];

export class TournamentController {
  private tournamentFlow: TournamentFlowApplication;
  private db: PostgresClient;
  private settingsRepo: SettingsRepository;
  private contentRepo: ContentRepository;

  constructor() {
    this.tournamentFlow = new TournamentFlowApplication();
    this.db = PostgresClient.getInstance();
    this.settingsRepo = new SettingsRepository();
    this.contentRepo = new ContentRepository();

    const imageDir = path.join(__dirname, "../../../public/images/uploads");
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    const docDir = path.join(__dirname, "../../../public/documents/uploads");
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
  }

  public handleLiveConnection(req: Request, res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    sseClients.push(res);
    req.on("close", () => {
      sseClients = sseClients.filter((client) => client !== res);
    });
  }

  private broadcastUpdate(data: any): void {
    sseClients.forEach((client) => {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }

  public async loginAdmin(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const validUsername = process.env.ADMIN_USERNAME || "admin";
    const validPassword = process.env.ADMIN_PASSWORD || "bille2026";

    if (username === validUsername && password === validPassword) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "12h" });
      res.json({ token });
    } else {
      res.status(401).json({ message: "Ungültige Zugangsdaten" });
    }
  }

  public async initializeTournament(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      await this.tournamentFlow.initializeTournament(req.body);
      this.broadcastUpdate({ type: "TOURNAMENT_INITIALIZED" });
      res.json({
        message: "Turnier erfolgreich initialisiert und Spielplan berechnet.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async getTeams(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.db.query(
        "SELECT * FROM teams ORDER BY name ASC",
      );
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const query = `
                SELECT g.id, g.name, g.phase, g.field_numbers,
                       json_agg(json_build_object(
                           'team_id', gt.team_id, 
                           'points', gt.points, 
                           'matches_played', gt.matches_played,
                           'goals_scored', gt.goals_scored, 
                           'goals_conceded', gt.goals_conceded, 
                           'goal_diff', (gt.goals_scored - gt.goals_conceded),
                           'rank', gt.rank
                       ) ORDER BY gt.rank ASC) as standings
                FROM groups g
                LEFT JOIN group_teams gt ON g.id = gt.group_id
                GROUP BY g.id
                ORDER BY g.name ASC
            `;
      const result = await this.db.query(query);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async getMatches(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.db.query(
        "SELECT * FROM matches ORDER BY match_number ASC",
      );
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async updateMatchResult(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { goals_home, goals_away } = req.body;
    try {
      await this.tournamentFlow.processMatchResult(id, goals_home, goals_away);
      this.broadcastUpdate({ type: "MATCH_UPDATED", matchId: id });
      res.json({ message: "Ergebnis erfolgreich gespeichert" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async previewSnakeSeeding(req: Request, res: Response): Promise<void> {
    try {
      const preview = await this.tournamentFlow.compileIntermediateSeeding();
      res.json(preview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async approveSeeding(req: Request, res: Response): Promise<void> {
    const { seeding, startTimeIso } = req.body;
    try {
      await this.tournamentFlow.approveIntermediateSeeding(
        seeding,
        startTimeIso,
      );
      this.broadcastUpdate({ type: "SCHEDULE_UPDATED", groupId: "all" });
      res.json({ message: "Setzliste bestätigt und Zwischenrunde generiert" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async startFinalRound(req: Request, res: Response): Promise<void> {
    const { startTimeIso } = req.body;
    try {
      await this.tournamentFlow.transitionToFinalRound(startTimeIso);
      this.broadcastUpdate({ type: "SCHEDULE_UPDATED", groupId: "all" });
      res.json({ message: "Finalrunde erfolgreich gestartet" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async generateSwissRound(req: Request, res: Response): Promise<void> {
    const groupId = req.params.groupId as string;
    const startTimeIso = new Date().toISOString();
    try {
      await this.tournamentFlow.generateNextSwissRound(groupId, startTimeIso);
      this.broadcastUpdate({ type: "SCHEDULE_UPDATED", groupId });
      res.json({ message: "Paarungen erfolgreich generiert" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const config = await this.settingsRepo.fetchConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async updateSettings(req: Request, res: Response): Promise<void> {
    const {
      match_duration_minutes,
      pause_duration_minutes,
      phase_start_time,
      footer_text_de,
      footer_text_en,
      sponsors,
    } = req.body;
    try {
      await this.settingsRepo.updateConfig({
        match_duration_minutes,
        pause_duration_minutes,
        phase_start_time,
        footer_text_de,
        footer_text_en,
        sponsors,
      });
      this.broadcastUpdate({ type: "SETTINGS_UPDATED" });
      res.json({ message: "Einstellungen erfolgreich aktualisiert" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async uploadTeamLogo(req: Request, res: Response): Promise<void> {
    const teamId = req.params.id;
    if (!req.file) {
      res.status(400).json({ message: "Keine Datei hochgeladen" });
      return;
    }

    try {
      const filename = `team-${teamId}-${Date.now()}.webp`;
      const outputPath = path.join(
        __dirname,
        "../../../public/images/uploads",
        filename,
      );

      await sharp(req.file.buffer)
        .resize({ height: 120, withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(outputPath);

      const publicUrl = `/public/images/uploads/${filename}`;
      await this.db.query("UPDATE teams SET logo_path = $1 WHERE id = $2", [
        publicUrl,
        teamId,
      ]);

      this.broadcastUpdate({ type: "TEAM_UPDATED" });
      res.json({
        message: "Team-Logo erfolgreich hochgeladen",
        url: publicUrl,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: `Fehler bei der Bildverarbeitung: ${error.message}` });
    }
  }

  public async updateTeamName(req: Request, res: Response): Promise<void> {
    const teamId = req.params.id;
    const { name } = req.body;
    try {
      await this.db.query("UPDATE teams SET name = $1 WHERE id = $2", [
        name,
        teamId,
      ]);
      this.broadcastUpdate({ type: "TEAM_UPDATED" });
      res.json({ message: "Team-Name erfolgreich aktualisiert" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async uploadLogo(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ message: "Keine Datei hochgeladen" });
      return;
    }

    try {
      const filename = `logo-${Date.now()}.webp`;
      const outputPath = path.join(
        __dirname,
        "../../../public/images/uploads",
        filename,
      );

      await sharp(req.file.buffer)
        .resize({ height: 80, withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(outputPath);

      const publicUrl = `/public/images/uploads/${filename}`;
      await this.settingsRepo.updateConfig({ tournament_logo_path: publicUrl });

      this.broadcastUpdate({ type: "LAYOUT_UPDATED" });
      res.json({ message: "Logo erfolgreich hochgeladen", url: publicUrl });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: `Fehler bei der Bildverarbeitung: ${error.message}` });
    }
  }

  public async uploadBackground(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ message: "Keine Datei hochgeladen" });
      return;
    }

    try {
      const filename = `bg-desktop-${Date.now()}.webp`;
      const outputPath = path.join(
        __dirname,
        "../../../public/images/uploads",
        filename,
      );

      await sharp(req.file.buffer).webp({ quality: 80 }).toFile(outputPath);

      const publicUrl = `/public/images/uploads/${filename}`;
      await this.settingsRepo.updateConfig({
        background_image_path: publicUrl,
      });

      this.broadcastUpdate({ type: "LAYOUT_UPDATED" });
      res.json({
        message: "Desktop-Hintergrund erfolgreich hochgeladen",
        url: publicUrl,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: `Fehler bei der Bildverarbeitung: ${error.message}` });
    }
  }

  public async uploadBackgroundMobile(
    req: Request,
    res: Response,
  ): Promise<void> {
    if (!req.file) {
      res.status(400).json({ message: "Keine Datei hochgeladen" });
      return;
    }

    try {
      const filename = `bg-mobile-${Date.now()}.webp`;
      const outputPath = path.join(
        __dirname,
        "../../../public/images/uploads",
        filename,
      );

      await sharp(req.file.buffer).webp({ quality: 80 }).toFile(outputPath);

      const publicUrl = `/public/images/uploads/${filename}`;
      await this.settingsRepo.updateConfig({
        background_image_mobile_path: publicUrl,
      });

      this.broadcastUpdate({ type: "LAYOUT_UPDATED" });
      res.json({
        message: "Mobiles Hintergrundbild erfolgreich hochgeladen",
        url: publicUrl,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: `Fehler bei der Bildverarbeitung: ${error.message}` });
    }
  }

  public async uploadDocument(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ message: "Keine Datei hochgeladen" });
      return;
    }

    const magicNumber = req.file.buffer.subarray(0, 5).toString("utf8");
    if (magicNumber !== "%PDF-") {
      res
        .status(400)
        .json({ message: "Die Datei ist kein gültiges PDF-Dokument" });
      return;
    }

    try {
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `doc-${Date.now()}-${safeName}`;
      const outputPath = path.join(
        __dirname,
        "../../../public/documents/uploads",
        filename,
      );

      fs.writeFileSync(outputPath, req.file.buffer);

      const publicUrl = `/public/documents/uploads/${filename}`;
      res.json({ message: "Dokument erfolgreich hochgeladen", url: publicUrl });
    } catch (error: any) {
      res.status(500).json({
        error: `Fehler beim Speichern des Dokuments: ${error.message}`,
      });
    }
  }

  public async getPageContent(req: Request, res: Response): Promise<void> {
    const slug = req.params.slug as string;

    try {
      const page = await this.contentRepo.fetchPageBySlug(slug);
      if (page) {
        res.json({
          id: page.id,
          slug: page.slug,
          title_de: page.title_de,
          title_en: page.title_en,
          content_de: page.markdown_content_de,
          content_en: page.markdown_content_en,
          sidebar_boxes_de: page.sidebar_boxes_de,
          sidebar_boxes_en: page.sidebar_boxes_en,
          updated_at: page.updated_at,
        });
      } else {
        res.status(404).json({ message: "Seite nicht gefunden" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async updatePageContent(req: Request, res: Response): Promise<void> {
    const slug = req.params.slug as string;
    const {
      title_de,
      title_en,
      content_de,
      content_en,
      sidebar_boxes_de,
      sidebar_boxes_en,
    } = req.body;
    try {
      await this.contentRepo.upsertPage(
        slug,
        title_de,
        title_en,
        content_de,
        content_en,
        sidebar_boxes_de,
        sidebar_boxes_en,
      );
      this.broadcastUpdate({ type: "CONTENT_UPDATED", slug });
      res.json({ message: "Seiteninhalt erfolgreich aktualisiert" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
