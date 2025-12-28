import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import authRoutes from "./routes/auth.routes.js";
import googleRoutes from "./routes/google.routes.js";
import problemRoutes from "./routes/problem.routes.js";

const app = express();
const PORT = 3000;

app.use(morgan("dev"));
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.CLIENT_URL!,
    // origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/google", googleRoutes);
app.use("/api", problemRoutes);

/* ---------------- Server ---------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
