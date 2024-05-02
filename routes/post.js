import { data } from "../constants/index.js";
import express from "express";
import { authenticateToken } from "../utils/middleware.js";
import createHttpError from "http-errors";

const router = express.Router();

router.get("/", authenticateToken, async (req, res, next) => {
  const page = req.query.page || 0;
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: data.pageSize,
      skip: page * data.pageSize,
      select: {
        id: true,
        title: true,
        content: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

router.post("/", authenticateToken, async (req, res, next) => {
  const { title, content } = req.body;
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        user: {
          connect: {
            email: req.user.email,
          },
        },
      },
    });
    res.json(post);
  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong!"));
  }
});

export { router as postRouter };
