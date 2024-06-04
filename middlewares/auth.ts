import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";

// Middleware to verify token based on the route
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token =
      req.headers.authorization?.split(" ")[1] || req.cookies.access_token;

    if (!access_token) {
      return next(
        res.status(401).json({
          success: false,
          message: "Please login to access this resource",
        })
      );
    }

    try {
      // Extract the secret based on the route
      const secretKey = getSecretKey(req.url, req.body.userType || "");

      if (!secretKey) {
        return next(
          res.status(401).json({
            success: false,
            message: "Invalid route",
          })
        );
      }

      const decoded = jwt.verify(access_token, secretKey) as JwtPayload;

      if (!decoded) {
        return next(
          res.status(401).json({
            success: false,
            message: "Session expired, Please login!",
          })
        );
      }

      req.user = decoded;

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(
          res.status(401).json({
            success: false,
            message: "Session expired, Please login!",
          })
        );
      }

      return next(
        res.status(401).json({
          success: false,
          message: "Session expired, Please login!",
        })
      );
    }
  }
);

// Function to get the secret key based on the route
const getSecretKey = (url: string, userType: string): string | null => {
  if (url.startsWith("/bco") || userType === "bco") {
    return process.env.BCO_SECRET || null;
  } else if (url.startsWith("/forwarder") || userType === "forwarder") {
    return process.env.ACCESS_TOKEN || null;
  } else if (url.startsWith("/chb") || userType === "chb") {
    return process.env.CHB_SECRET || null;
  } else if (url.startsWith("/admin") || userType === "admin") {
    return process.env.ADMIN_SECRET || null;
  }
  return null;
};
