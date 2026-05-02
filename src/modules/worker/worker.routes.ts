import { Router } from "express";
import { goOffline, goOnline, updateWorkerState } from "./worker.controller";

const workerRouter = Router();

workerRouter.post("/go-online", goOnline);
workerRouter.post("/go-offline", goOffline);
workerRouter.post("/update-state", updateWorkerState);

export default workerRouter;
