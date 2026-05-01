import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger";
import authRouter from "./routes/auth.routes";
import roleRouter from "./routes/role.routes";
import userTypeRouter from "./routes/user-type.routes";
import userRouter from "./routes/user.routes";
import architectureRouter from "./routes/architecture.routes";
import serviceLocationRouter from "./routes/service-location.routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const corsOrigins = (process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.includes("*") ? true : corsOrigins,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    result: 1,
    message: "API running...",
    data: null,
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    result: 1,
    message: "Service is healthy.",
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api/roles", roleRouter);
app.use("/api/user-types", userTypeRouter);
app.use("/api/users", userRouter);
app.use("/api/service-locations", serviceLocationRouter);
app.use("/api", architectureRouter);

app.use((req, res) => {
  res.status(404).json({
    result: -1,
    message: "Route not found.",
    data: null,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
