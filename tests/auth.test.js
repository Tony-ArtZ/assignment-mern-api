import request from "supertest";
import prisma from "../utils/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
import { authRouter } from "../routes/auth.js";
import { app, server } from "../index.js";

//close express server after all tests
afterAll(() => {
  server.close();
  prisma.$disconnect();
});

const deleteUserAfterTest = async (userId) => {
  try {
    await prisma.user.delete({ where: { email: userId } });
    console.log(`User ${userId} has been deleted after the test.`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
  }
};

describe("Auth Router", () => {
  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const user = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const res = await request(app).post("/auth/register").send(user);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("message", "User created successfully!");
      const createdUser = res.body.user;
      await deleteUserAfterTest(createdUser.email);
    });

    it("should return 400 if email or password is missing", async () => {
      const user = {};

      const res = await request(app).post("/auth/register").send(user);
      console.log(await res.body);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toHaveProperty(
        "message",
        "Email and password are required!"
      );
    });

    it("should return 409 if user already exists", async () => {
      const user = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      await request(app).post("/auth/register").send(user);
      const res = await request(app).post("/auth/register").send(user);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toHaveProperty("message", "User already exists!");
      await deleteUserAfterTest(user.email);
    });
  });

  describe("POST /auth/login", () => {
    let user;

    beforeAll(async () => {
      const password = "password123";
      const hashedPassword = bcrypt.hashSync(password, 10);

      const verificationToken = jwt.sign(
        { email: "test@example.com" },
        process.env.JWT_SECRET
      );

      user = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
          password: hashedPassword,
          emailVerified: true,
          verificationToken: verificationToken,
        },
      });
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { email: "test@example.com" } });
    });

    it("should login a user", async () => {
      const credentials = {
        email: user.email,
        password: "password123",
      };

      const res = await request(app).post("/auth/login").send(credentials);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("message", "Logged in successfully!");
    });

    it("should return 400 if email or password is missing", async () => {
      const credentials = {
        email: user.email,
      };

      const res = await request(app).post("/auth/login").send(credentials);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toHaveProperty(
        "message",
        "Email and password are required!"
      );
    });

    it("should return 404 if user not found", async () => {
      const credentials = {
        email: "unknown@example.com",
        password: "password123",
      };

      const res = await request(app).post("/auth/login").send(credentials);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toHaveProperty("message", "User not found!");
    });

    it("should return 400 if password is incorrect", async () => {
      const credentials = {
        email: user.email,
        password: "wrongpassword",
      };

      const res = await request(app).post("/auth/login").send(credentials);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toHaveProperty(
        "message",
        "Invalid Password or Email!"
      );
    });

    it("should return 400 if email is not verified", async () => {
      const verificationToken = jwt.sign(
        { email: "test@example.com" },
        process.env.JWT_SECRET
      );
      const unverifiedUser = await prisma.user.create({
        data: {
          name: "Unverified User",
          email: "unverified@example.com",
          password: bcrypt.hashSync("password123", 10),
          emailVerified: false,
          verificationToken: verificationToken,
        },
      });

      const credentials = {
        email: unverifiedUser.email,
        password: "password123",
      };

      const res = await request(app).post("/auth/login").send(credentials);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toHaveProperty("message", "Email not verified!");

      await prisma.user.delete({ where: { id: unverifiedUser.id } });
    });
  });

  describe("GET /auth/get-user", () => {
    let user;
    let token;

    beforeAll(async () => {
      const password = "password123";
      const hashedPassword = bcrypt.hashSync(password, 10);
      const verificationToken = jwt.sign(
        { email: "test@example.com" },
        process.env.JWT_SECRET
      );
      user = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
          password: hashedPassword,
          emailVerified: true,
          verificationToken: verificationToken,
        },
      });

      token = jwt.sign({ email: "test@example.com" }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { email: "test@example.com" } });
    });

    it("should return user data", async () => {
      const res = await request(app)
        .get("/auth/get-user")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("email", user.email);
      expect(res.body).toHaveProperty("emailVerified", true);
    });

    it("should return 401 if token is invalid", async () => {
      const res = await request(app)
        .get("/auth/get-user")
        .set("Authorization", "Bearer invalid_token");

      expect(res.statusCode).toBe(403);
    });
  });
});
