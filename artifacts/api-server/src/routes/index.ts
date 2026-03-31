import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import portfolioRouter from "./portfolio";
import portfoliosRouter from "./portfolios";
import governanceRouter from "./governance";
import regionalRouter from "./regional";
import financialRouter from "./financial";
import pipelinesRouter from "./pipelines";
import eslServicesRouter from "./esl-services";
import dataLayersRouter from "./data-layers";
import complianceRouter from "./compliance";
import ingestionRouter from "./ingestion";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(portfolioRouter);
router.use(portfoliosRouter);
router.use(governanceRouter);
router.use(regionalRouter);
router.use(financialRouter);
router.use(pipelinesRouter);
router.use(eslServicesRouter);
router.use(dataLayersRouter);
router.use(complianceRouter);
router.use(ingestionRouter);

export default router;
