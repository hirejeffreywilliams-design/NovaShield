import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incidentsRouter from "./incidents";
import officersRouter from "./officers";
import reportsRouter from "./reports";
import analyzeRouter from "./analyze";
import rightsRouter from "./rights";
import departmentsRouter from "./departments";
import integrityRouter from "./integrity";
import immigrationRouter from "./immigration";
import sosRouter from "./sos";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/incidents", incidentsRouter);
router.use("/incidents", analyzeRouter);
router.use("/incidents", integrityRouter);
router.use("/officers", officersRouter);
router.use("/reports", reportsRouter);
router.use("/rights", rightsRouter);
router.use("/departments", departmentsRouter);
router.use(immigrationRouter);
router.use("/sos", sosRouter);

export default router;
