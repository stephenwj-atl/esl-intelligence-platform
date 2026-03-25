import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import portfolioRouter from "./portfolio";
import portfoliosRouter from "./portfolios";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(portfolioRouter);
router.use(portfoliosRouter);

export default router;
