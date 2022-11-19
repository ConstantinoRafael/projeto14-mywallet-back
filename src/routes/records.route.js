import { getRecords, postIn, postOut } from "../controllers/records.controler.js";
import { Router } from "express";

const router = Router();

router.get("/records", getRecords);

router.post("/in", postIn);

router.post("/out", postOut);

export default router;