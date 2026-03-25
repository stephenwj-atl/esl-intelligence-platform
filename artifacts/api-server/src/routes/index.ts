import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import portfolioRouter from "./portfolio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(portfolioRouter);

export default router;
