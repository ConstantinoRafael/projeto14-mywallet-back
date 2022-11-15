import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import { v4 as uuid } from "uuid";

const app = express();
dotenv.config();
app.use(express.json());

const signUpSchema = joi.object({
  name: joi.string().required().min(3),
  email: joi.string().required(),
  password: joi.string().required(),
  confirmPassword: joi.ref("password"),
});

const loginSchema = joi.object({
  name: joi.string().required(),
  password: joi.string().required(),
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
const sessionsCollection = db.collection("sessions");

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

app.get("/sign-up", async (req, res) => {
  try {
    const signeds = await signUpCollection.find().toArray();
    if (!signeds) {
      return res.sendStatus(404);
    }

    res.send(signeds);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await signUpCollection.findOne({ email });

  if(user && (password === user.password)) {
    const token = uuid();
    const name = user.name

    await sessionsCollection.insertOne({
      userId: user._id,
      token
    })

    res.send({ name, token })
  } else {
    res.status(404).send("Nome ou senha incorretos");
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running in port: ${process.env.PORT}`)
);
