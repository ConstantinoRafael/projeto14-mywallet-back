import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const app = express();
dotenv.config();
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

try {
  await mongoClient.connect();
  console.log("MongoDB connected");
} catch (err) {
  console.log(err);
}

const db = mongoClient.db("mywallet");


app.listen(process.env.PORT, () =>
  console.log(`Server running in port: ${process.env.PORT}`)
);
