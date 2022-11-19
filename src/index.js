import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";



import cors from "cors";
import { postSignIn, postSignUp } from "./controllers/user.controler.js";
import { getRecords, postIn, postOut } from "./controllers/records.controler.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());

export const userSchema = joi.object({
  name: joi.string().required().min(3).max(100),
  email: joi.string().email().required(),
  password: joi.string().required(),
  confirmPassword: joi.ref("password"),
});

const mongoClient = new MongoClient(process.env.MONGO_URI);

try {
  await mongoClient.connect();
  console.log("MongoDB connected");
} catch (err) {
  console.log(err);
}

const db = mongoClient.db("mywallet");
export const userCollection = db.collection("users");
export const sessionsCollection = db.collection("sessions");
export const recordsCollection = db.collection("records");

app.post("/sign-up", postSignUp);

// app.get("/sign-up", async (req, res) => {
//   try {
//     const signeds = await signUpCollection.find().toArray();
//     if (!signeds) {
//       return res.sendStatus(404);
//     }

//     res.send(signeds);
//   } catch (err) {
//     console.log(err);
//     res.sendStatus(500);
//   }
// });

app.post("/sign-in", postSignIn);

app.get("/records", getRecords);

app.post("/in", postIn);

app.post("/out", postOut);

app.listen(process.env.PORT, () =>
  console.log(`Server running in port: ${process.env.PORT}`)
);
