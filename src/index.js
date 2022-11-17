import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

const app = express();
dotenv.config();
app.use(express.json());

const userSchema = joi.object({
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
const userCollection = db.collection("users");
const sessionsCollection = db.collection("sessions");
const recordCollection = db.collection("record");

app.post("/sign-up", async (req, res) => {
  const user = req.body;

  try {
    const userExists = await userCollection.findOne({ email: user.email });
    if (userExists) {
      return res.status(409).send({ message: "Esse email já existe!" });
    }

    const { error } = userSchema.validate(user, { abortEarly: false });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(400).send(errors);
    }

    const hashPassword = bcrypt.hashSync(user.password, 10);

    await userCollection.insertOne({
      ...user,
      password: hashPassword,
      confirmPassword: hashPassword,
    });

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

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

app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  const token = uuid();

  try {
    const userExists = await userCollection.findOne({ email });

    if (!userExists) {
      return res.sendStatus(401);
    }

    const passwordOk = bcrypt.compareSync(password, userExists.password);

    if (!passwordOk) {
      return res.sendStatus(401);
    }

    const userSession = await sessionsCollection.findOne({
      userId: userExists._id,
    });

    if (userSession) {
      return res
        .status(401)
        .send({ message: "Você já está logado, saia para logar novamente" });
    }

    await sessionsCollection.insertOne({ token, userId: userExists._id });

    res.send({ token });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/record", async (req, res) => {
  const { authorization } = req.headers;

  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const session = await sessionsCollection.findOne({ token });
    const user = await userCollection.findOne({ _id: session?.userId });

    if (!user) {
      return res.sendStatus(401);
    }

    delete user.password;
    delete user.confirmPassword;

    const records = await recordCollection
      .find()
      .toArray();
    console.log(records)  

    if (!records) {
      return res.sendStatus(404);
    }

    res.send(records);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/in", async (req, res) => {
  const { amount, reason } = req.body;
  const { authorization } = req.headers;

  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const session = await sessionsCollection.findOne({ token });

    const user = await userCollection.findOne({ _id: session?.userId });

    if (!user) {
      return res.sendStatus(401);
    }

    delete user.password;
    delete user.confirmPassword;

    const dado = await recordCollection.insertOne({
      date: dayjs().format("DD/MM"),
      amount,
      reason,
      type: "in",
      user,
    });

    console.log(dado);
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/out", async (req, res) => {
  const { amount, reason } = req.body;
  const { authorization } = req.headers;

  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const session = await sessionsCollection.findOne({ token });

    const user = await userCollection.findOne({ _id: session?.userId });

    if (!user) {
      return res.sendStatus(401);
    }

    delete user.password;
    delete user.confirmPassword;

    const dado = await recordCollection.insertOne({
      date: dayjs().format("DD/MM"),
      amount,
      reason,
      type: "out",
      user,
    });

    console.log(dado);
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running in port: ${process.env.PORT}`)
);
