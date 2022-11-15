import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";

const app = express();
dotenv.config();
app.use(express.json());

const signUpSchema = joi.object({
  name: joi.string().required().min(3),
  email: joi.string().required(),
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
const signUpCollection = db.collection("sign-up");

app.post("/sign-up", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  const { error } = signUpSchema.validate(
    { name, email, password, confirmPassword },
    { abortEarly: false }
  );

  if (error) {
    const errors = error.details.map((d) => d.messag);
    return res.status(422).send(errors);
  }

  try {
    const nameExists = await signUpCollection.findOne({ name });
    if (nameExists) {
      return res.sendStatus(409);
    }

    await signUpCollection.insertOne({ name, email, password });

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running in port: ${process.env.PORT}`)
);
