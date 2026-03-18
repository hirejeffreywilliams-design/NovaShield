import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incidentsRouter from "./incidents";
import officersRouter from "./officers";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/incidents", incidentsRouter);
router.use("/officers", officersRouter);
router.use("/reports", reportsRouter);

export default router;
