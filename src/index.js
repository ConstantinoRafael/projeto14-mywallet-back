import express from "express";
import dotenv from "dotenv";
import joi from "joi";
import cors from "cors";

import userRouters from "./routes/user.route.js";
import recordsRouters from "./routes/records.route.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
app.use(userRouters);
app.use(recordsRouters);

export const userSchema = joi.object({
  name: joi.string().required().min(3).max(100),
  email: joi.string().email().required(),
  password: joi.string().required(),
  confirmPassword: joi.ref("password"),
});

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Server running in port: ${port}`));
