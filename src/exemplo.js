import express from "express";
import joi from "joi";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const participantSchema = joi.object({
  name: joi.string().required().min(3),
});

const messageSchema = joi.object({
  from: joi.string().required(),
  to: joi.string().required().min(3),
  text: joi.string().required().min(1),
  type: joi.string().required().valid("message", "private_message"),
  time: joi.string(),
});

const mongoClient = new MongoClient(process.env.MONGO_URI);

try {
  await mongoClient.connect();
  console.log("MongoDB conectado!");
} catch (err) {
  console.log(err);
}

const db = mongoClient.db("batepapouol");
const participantsCollection = db.collection("participants");
const messagesCollection = db.collection("messages");

app.post("/participants", async (req, res) => {
  const { name } = req.body;

  const { error } = participantSchema.validate({ name }, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const participantExists = await participantsCollection.findOne({ name });
    if (participantExists) {
      return res.sendStatus(409);
    }

    await participantsCollection.insertOne({ name, lastStatus: Date.now() });

    await messagesCollection.insertOne({
      from: name,
      to: "Todos",
      text: "entrei na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    });

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await participantsCollection.find().toArray();
    if (!participants) {
      return res.sendStatus(404);
    }

    res.send(participants);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;

  const message = {
    from: user,
    to,
    text,
    type,
    time: dayjs().format("HH:mm:ss"),
  };

  try {
    const { error } = messageSchema.validate(message, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    await messagesCollection.insertOne(message);

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  const limit = Number(req.query.limit);
  const { user } = req.headers;

  try {
    const messages = await messagesCollection
      .find({
        $or: [
          // $or: Conjunto de filtros, literalmente um OU
          { from: user },
          { to: { $in: [user, "Todos"] } }, // $in: Possibilidades de valores dentro de um campo de filtro.
          { type: "message" },
        ],
      })
      .limit(limit)
      .toArray();

    if (messages.length === 0) {
      return res.status(404).send("Não foi encontrada nenhuma mensagem!");
    }

    res.send(messages);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  const { user } = req.headers;

  try {
    const participantExists = await participantsCollection.findOne({
      name: user,
    });

    if (!participantExists) {
      return res.sendStatus(404);
    }

    await participantsCollection.updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

setInterval(async () => {
  console.log("Removendo geral!");

  const dateTenSecondsAgo = Date.now() - 10000;
  /* console.log(Date.now());
  console.log(dateTenSecondsAgo); */

  try {
    // $lte: Literalmente menor ou igual (<=) a algum valor especifico
    const participantsInactives = await participantsCollection
      .find({ lastStatus: { $lte: dateTenSecondsAgo } })
      .toArray();

    if (participantsInactives.length > 0) {

      const inactivesMessages = participantsInactives.map((participant) => {
        return {
          from: participant.name,
          to: "Todos",
          text: "sai da sala...",
          type: "status",
          time: dayjs().format("HH:mm:ss"),
        };
      });

      await messagesCollection.insertMany(inactivesMessages);
      await participantsCollection.deleteMany({ lastStatus: { $lte: dateTenSecondsAgo } })
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}, 15000);

app.listen(5000, () => console.log("Port 5000"));