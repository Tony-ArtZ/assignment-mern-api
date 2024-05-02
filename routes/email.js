import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import createHttpError from "http-errors";
import prisma from "../utils/prisma.js";
import { sendEmail } from "../utils/emailer.js";
import { mailData } from "../email/verification.js";
const router = express.Router();

router.post("/verify", async (req, res, next) => {
  try {
    const { token } = req.body;
    // Check if email and password are provided
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
    // Update user emailVerified to true
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
      },
    });
    // Return user
    res.json({ user, message: "Email verified successfully!" });
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

router.post("/resend", async (req, res, next) => {
  try {
    const { email } = req.body;
    // Check if email is provided
    if (!email) {
      return next(createHttpError(400, "Email is required!"));
    }
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
    // Check if email is verified
    if (user.emailVerified === true) {
      return next(createHttpError(400, "Email already verified!"));
    }
    // Generate JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET);
    // Send email
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verificationToken: token,
      },
    });
    await sendEmail(mailData(email, token));
    // Return token
    res.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

export { router as emailRouter };
