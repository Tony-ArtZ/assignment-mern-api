import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import createHttpError from "http-errors";
import prisma from "../utils/prisma.js";
import { sendEmail } from "../utils/emailer.js";
import { mailData } from "../email/verification.js";
import { authenticateToken } from "../utils/middleware.js";
const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // Check if email and password are provided
    if (!email || !password) {
      return next(createHttpError(400, "Email and password are required!"));
    }
    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (userExists) {
      return next(createHttpError(409, "User already exists!"));
    }

    // Save user to database
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name ? name : "Anonymous User",
        email,
        password: hashedPassword,
        emailVerified: false,
        verificationToken: jwt.sign({ email }, process.env.JWT_SECRET),
      },
    });

    await sendEmail(mailData(email, user.verificationToken)),
      // Return user
      res.json({ user, message: "User created successfully!" });
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Check if email and password are provided
    if (!email || !password) {
      return next(createHttpError(400, "Email and password are required!"));
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
    // Check if password is correct
    if (!bcrypt.compareSync(password, user.password)) {
      return next(createHttpError(400, "Invalid Password or Email!"));
    }
    // Check if email is verified
    if (user.emailVerified === false) {
      return next(createHttpError(400, "Email not verified!"));
    }
    // Generate JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET);
    // Return token
    res.json({ token, message: "Logged in successfully!" });
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

router.get("/get-user", authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: req.user.email,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

export { router as authRouter };
