import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express from "express";
import cors from "cors";
import session from "express-session";
import { PrismaClient } from "@prisma/client";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";
import uploadRouter from "./routes/upload";

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.VITE_API_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin", uploadRouter);

app.listen(PORT, () => {
  console.log(`PayPath server running on port ${PORT}`);
});
