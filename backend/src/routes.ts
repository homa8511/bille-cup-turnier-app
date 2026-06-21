import { NextFunction, Request, Response, Router } from "express";
import * as jwt from "jsonwebtoken";
import multer from "multer";
import { ZodTypeAny } from "zod";
import { TournamentController } from "./presentation/controllers/TournamentController";
import {
  initTournamentSchema,
  loginSchema,
  matchResultSchema,
  pageContentSchema,
  settingsSchema,
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

const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Nur JPG, PNG, WEBP und AVIF sind erlaubt"));
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadDoc = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
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

router.post(
  "/admin/teams/:id/logo",
  authenticateToken,
  uploadImage.single("logo"),
  (req: Request, res: Response) =>
    tournamentController.uploadTeamLogo(req, res),
);

router.post(
  "/admin/settings/logo",
  authenticateToken,
  uploadImage.single("logo"),
  (req: Request, res: Response) => tournamentController.uploadLogo(req, res),
);

router.post(
  "/admin/settings/background",
  authenticateToken,
  uploadImage.single("background"),
  (req: Request, res: Response) =>
    tournamentController.uploadBackground(req, res),
);

router.post(
  "/admin/settings/background-mobile",
  authenticateToken,
  uploadImage.single("background_mobile"),
  (req: Request, res: Response) =>
    tournamentController.uploadBackgroundMobile(req, res),
);

router.post(
  "/admin/documents",
  authenticateToken,
  uploadDoc.single("document"),
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

export default router;
