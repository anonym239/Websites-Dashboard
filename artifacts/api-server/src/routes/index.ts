import { Router, type IRouter } from "express";
import healthRouter from "./health";
import websitesRouter from "./websites";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";
import netlifyRouter from "./netlify";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(websitesRouter);
router.use(dashboardRouter);
router.use(usersRouter);
router.use(netlifyRouter);
router.use(feedbackRouter);

export default router;
