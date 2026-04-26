import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import salesRouter from "./sales";
import dashboardRouter from "./dashboard";
import forecastRouter from "./forecast";
import alertsRouter from "./alerts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(salesRouter);
router.use(dashboardRouter);
router.use(forecastRouter);
router.use(alertsRouter);

export default router;
