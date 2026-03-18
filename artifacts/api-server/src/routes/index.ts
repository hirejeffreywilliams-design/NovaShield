import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incidentsRouter from "./incidents";
import officersRouter from "./officers";
import reportsRouter from "./reports";
import analyzeRouter from "./analyze";
import rightsRouter from "./rights";
import departmentsRouter from "./departments";
import integrityRouter from "./integrity";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/incidents", incidentsRouter);
router.use("/incidents", analyzeRouter);
router.use("/incidents", integrityRouter);
router.use("/officers", officersRouter);
router.use("/reports", reportsRouter);
router.use("/rights", rightsRouter);
router.use("/departments", departmentsRouter);

export default router;
