import { Router, type IRouter } from "express";
import { authenticate } from "../middlewares/auth";
import healthRouter from "./health";
import authRouter from "./auth";
import incidentsRouter from "./incidents";
import officersRouter from "./officers";
import reportsRouter from "./reports";
import analyzeRouter from "./analyze";
import rightsRouter from "./rights";
import departmentsRouter from "./departments";
import integrityRouter from "./integrity";
import immigrationRouter from "./immigration";
import sosRouter from "./sos";
import learnRouter from "./learn";
import monitorRouter from "./monitor";
import ecosystemRouter from "./ecosystem";
import shieldIntelligenceRouter from "./shield-intelligence";
import whistleblowerVaultRouter from "./whistleblower-vault";
import publicRouter from "./public";

const router: IRouter = Router();

// Public routes (no auth required)
router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/public", publicRouter);

// All routes below require authentication
router.use(authenticate);

router.use("/incidents", incidentsRouter);
router.use("/incidents", analyzeRouter);
router.use("/incidents", integrityRouter);
router.use("/officers", officersRouter);
router.use("/reports", reportsRouter);
router.use("/rights", rightsRouter);
router.use("/departments", departmentsRouter);
router.use(immigrationRouter);
router.use("/sos", sosRouter);
router.use("/learn", learnRouter);
router.use("/monitor", monitorRouter);
router.use("/ecosystem", ecosystemRouter);
router.use("/intelligence", shieldIntelligenceRouter);
router.use("/vault", whistleblowerVaultRouter);

export default router;
