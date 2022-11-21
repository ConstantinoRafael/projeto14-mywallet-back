import { userCollection } from "../database/db.js";

export async function userExistsValidation(req, res, next) {
  const user = req.body;

  const userExists = await userCollection.findOne({ email: user.email });
  if (userExists) {
    return res.status(409).send({ message: "Esse email já existe!" });
  }
  next();
}
