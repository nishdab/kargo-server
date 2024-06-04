import express, { NextFunction, Request, Response } from "express";
export const app = express();
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/forwarderAuth.route";
import dashboardRouter from "./routes/forwarder.route";
import { JwtPayload } from "jsonwebtoken";
import bcoRouter from "./routes/bco.route";
import chbRouter from "./routes/chb.route";
import supplierRouter from "./routes/supplier.route";
import adminRouter from "./routes/admin.route";
import chatRouter from "./routes/chat.route";

dotenv.config();

// Define the Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// body parser
app.use(express.json({ limit: "1mb" }));

// cookie parser
app.use(cookieParser());

// cors
app.use(
  cors({
    origin: process.env.ORIGIN?.split(","),
    credentials: true,
  })
);

// routes
app.use("/api/v1", userRouter);
app.use("/api/v1", dashboardRouter);
app.use("/api/v1", bcoRouter);
app.use("/api/v1", chbRouter);
app.use("/api/v1", supplierRouter);
app.use("/api/v1", adminRouter);
app.use("/api/v1", chatRouter);

// test api
app.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      message: "API is working",
    });
  } catch (error) {
    // Handle errors appropriately
    next(error);
  }
});

// unknown routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});
