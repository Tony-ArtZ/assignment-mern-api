import express from "express";
import "dotenv/config";
import { authRouter } from "./routes/auth.js";
import cors from "cors";
import { emailRouter } from "./routes/email.js";
import { authenticateToken } from "./utils/middleware.js";
import rateLimit from "express-rate-limit";
import { postRouter } from "./routes/post.js";
import { passwordRouter } from "./routes/password.js";
const app = express();
const PORT = 3000;

//Rate limiter
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(cors());

// Routes
app.use("/auth", authRouter);
app.use("/email", emailRouter);
app.use("/post", postRouter);
app.use("/password", passwordRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err,
  });
});

app.get("/", authenticateToken, (req, res) => {
  res.json({ message: `Welcome to the API! ${req.user.email}` });
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
