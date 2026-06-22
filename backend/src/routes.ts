import { NextFunction, Request, Response, Router } from "express";
import fs from "fs";
import * as jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { ZodTypeAny } from "zod";
import { TournamentController } from "./presentation/controllers/TournamentController";
import {
  imageUploadSchema,
  initTournamentSchema,
  loginSchema,
  matchResultSchema,
  pageContentSchema,
  pdfUploadSchema,
  settingsSchema,
  updateTeamNameSchema,
} from "./presentation/validators/PayloadValidators";

const router = Router();
const tournamentController = new TournamentController();
const JWT_SECRET = process.env.JWT_SECRET || "turniergeheimnis2026";

const validatePayload =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Validierungsfehler", details: error });
    }
  };

const validateFilePayload =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({ file: req.file });
      return next();
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Dateivalidierungsfehler", details: error });
    }
  };

const handleMulterUpload = (uploadMiddleware: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({
              message: "Die Datei überschreitet die maximal zulässige Größe.",
            });
        }
        return res
          .status(400)
          .json({ message: `Upload-Fehler: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Nur JPG, PNG und WEBP sind erlaubt"));
  }
};

const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Nur PDF-Dokumente sind erlaubt"));
  }
};

const uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadDoc = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    (req as any).user = user;
    next();
  });
};

router.get("/live", (req: Request, res: Response) => {
  tournamentController.handleLiveConnection(req, res);
});

router.post(
  "/admin/login",
  validatePayload(loginSchema),
  (req: Request, res: Response) => tournamentController.loginAdmin(req, res),
);

router.get("/teams", (req: Request, res: Response) =>
  tournamentController.getTeams(req, res),
);

router.get("/groups", (req: Request, res: Response) =>
  tournamentController.getGroups(req, res),
);

router.get("/matches", (req: Request, res: Response) =>
  tournamentController.getMatches(req, res),
);

router.get("/settings", (req: Request, res: Response) =>
  tournamentController.getSettings(req, res),
);

router.get("/pages/:slug", (req: Request, res: Response) =>
  tournamentController.getPageContent(req, res),
);

router.post(
  "/admin/initialize",
  authenticateToken,
  validatePayload(initTournamentSchema),
  (req: Request, res: Response) =>
    tournamentController.initializeTournament(req, res),
);

router.put(
  "/admin/settings",
  authenticateToken,
  validatePayload(settingsSchema),
  (req: Request, res: Response) =>
    tournamentController.updateSettings(req, res),
);

router.put(
  "/admin/pages/:slug",
  authenticateToken,
  validatePayload(pageContentSchema),
  (req: Request, res: Response) =>
    tournamentController.updatePageContent(req, res),
);

router.get(
  "/admin/preview-snake",
  authenticateToken,
  (req: Request, res: Response) =>
    tournamentController.previewSnakeSeeding(req, res),
);

router.post(
  "/admin/approve-seeding",
  authenticateToken,
  (req: Request, res: Response) =>
    tournamentController.approveSeeding(req, res),
);

router.post(
  "/admin/start-finalround",
  authenticateToken,
  (req: Request, res: Response) =>
    tournamentController.startFinalRound(req, res),
);

router.post(
  "/admin/teams/:id/logo",
  authenticateToken,
  handleMulterUpload(uploadImage.single("logo")),
  validateFilePayload(imageUploadSchema),
  (req: Request, res: Response) =>
    tournamentController.uploadTeamLogo(req, res),
);

router.put(
  "/admin/teams/:id/name",
  authenticateToken,
  validatePayload(updateTeamNameSchema),
  (req: Request, res: Response) =>
    tournamentController.updateTeamName(req, res),
);

router.post(
  "/admin/settings/logo",
  authenticateToken,
  handleMulterUpload(uploadImage.single("logo")),
  validateFilePayload(imageUploadSchema),
  (req: Request, res: Response) => tournamentController.uploadLogo(req, res),
);

router.post(
  "/admin/settings/background",
  authenticateToken,
  handleMulterUpload(uploadImage.single("background")),
  validateFilePayload(imageUploadSchema),
  (req: Request, res: Response) =>
    tournamentController.uploadBackground(req, res),
);

router.post(
  "/admin/settings/background-mobile",
  authenticateToken,
  handleMulterUpload(uploadImage.single("background_mobile")),
  validateFilePayload(imageUploadSchema),
  (req: Request, res: Response) =>
    tournamentController.uploadBackgroundMobile(req, res),
);

router.post(
  "/admin/documents",
  authenticateToken,
  handleMulterUpload(uploadDoc.single("document")),
  validateFilePayload(pdfUploadSchema),
  (req: Request, res: Response) =>
    tournamentController.uploadDocument(req, res),
);

router.post(
  "/admin/matches/:id/result",
  authenticateToken,
  validatePayload(matchResultSchema),
  (req: Request, res: Response) =>
    tournamentController.updateMatchResult(req, res),
);

router.post(
  "/admin/groups/:groupId/generate-swiss",
  authenticateToken,
  (req: Request, res: Response) =>
    tournamentController.generateSwissRound(req, res),
);

router.post(
  "/admin/settings/sponsors",
  authenticateToken,
  handleMulterUpload(uploadImage.single("sponsor")),
  validateFilePayload(imageUploadSchema),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "Keine Datei hochgeladen" });
    }
    try {
      const filename = `sponsor-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
      const uploadDir = path.join(__dirname, "../public/images/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filepath = path.join(uploadDir, filename);

      await sharp(req.file.buffer)
        .resize({ height: 150, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);

      res.json({
        message: "Sponsor hochgeladen",
        url: `/public/images/uploads/${filename}`,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: `Fehler beim Speichern: ${error.message}` });
    }
  },
);

export default router;
