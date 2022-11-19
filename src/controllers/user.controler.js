import { userSchema } from "../index.js";
import { userCollection, sessionsCollection } from "../database/db.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

export async function postSignUp(req, res) {
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
}

export async function postSignIn(req, res) {
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
}
