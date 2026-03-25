import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import portfolioRouter from "./portfolio";
import portfoliosRouter from "./portfolios";
import governanceRouter from "./governance";
import regionalRouter from "./regional";
import financialRouter from "./financial";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(portfolioRouter);
router.use(portfoliosRouter);
router.use(governanceRouter);
router.use(regionalRouter);
router.use(financialRouter);

export default router;
