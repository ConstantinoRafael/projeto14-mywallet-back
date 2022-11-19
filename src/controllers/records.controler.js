import { userCollection, sessionsCollection, recordsCollection } from "../database/db.js";

import dayjs from "dayjs";

export async function getRecords(req, res) {
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

    const records = await recordsCollection.find().toArray();

    const recordsUser = records.filter((r) => r.user.email === user.email);

    if (!records) {
      return res.sendStatus(404);
    }

    res.send(recordsUser);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}

export async function postIn(req, res) {
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

    await recordsCollection.insertOne({
      date: dayjs().format("DD/MM"),
      amount,
      reason,
      type: "in",
      user,
    });

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}

export async function postOut(req, res) {
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

    await recordsCollection.insertOne({
      date: dayjs().format("DD/MM"),
      amount,
      reason,
      type: "out",
      user,
    });

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}
