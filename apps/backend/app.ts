import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { globalErrorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requestLogger } from "./middleware/request-logger.js";
import { routes } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.use(requestLogger);
app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin?.replace(/\/$/, "");
      callback(
        null,
        !normalizedOrigin ||
          env.corsOrigins.includes("*") ||
          env.corsOrigins.includes(normalizedOrigin),
      );
    },
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 86_400,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(["/", "/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "Smart Healthcare Backend API",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(globalErrorHandler);
