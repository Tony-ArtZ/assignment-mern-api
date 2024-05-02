import express from "express";
import createHttpError from "http-errors";
import { mailData } from "../email/forgot.js";
import { sendEmail } from "../utils/emailer.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

//password reset
router.post("/reset", async (req, res, next) => {
  const { token, password } = req.body;
  try {
    // Check if token is provided
    if (!token) {
      return next(createHttpError(400, "No token!"));
    }
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });
    // Check if user exists
    if (!user) {
      return next(createHttpError(404, "User not found!"));
    }
    // Update user password
    const hashedPassword = bcrypt.hashSync(password, 10);
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    // Return user
    res.json({ user, message: "Email verified successfully!" });
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

//send password reset email

router.post("/forgot", async (req, res, next) => {
  const { email } = req.body;
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    // Check if user exists
    if (!user) {
      return next(createHttpError(404, "User not found!"));
    }
    // Generate token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetToken: token,
      },
    });
    // Send email
    await sendEmail(mailData(email, token));

    // Return user
    res.json({ user, message: "Email sent successfully!" });
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});
export { router as passwordRouter };
