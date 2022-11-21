import { postSignIn, postSignUp } from "../controllers/user.controler.js";
import { Router } from "express";
import { userExistsValidation } from "../middlewares/user.middleware.js";

const router = Router();

router.post("/sign-up", userExistsValidation, postSignUp);

router.post("/sign-in", postSignIn);

export default router;