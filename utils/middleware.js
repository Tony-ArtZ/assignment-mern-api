import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) next(createHttpError(401, "Unauthorized!"));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log(err);

    if (err) return next(createHttpError(403, "Forbidden!"));

    req.user = user;

    next();
  });
};
