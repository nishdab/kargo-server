require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import { sendAdminToken } from "../utils/jwt";
import bcrypt, { compare } from "bcryptjs";

import { ILoginRequest } from "../types/forwarderType";

import { handleErrors } from "../middlewares/errorHandlerMiddleware";
import {
  checkAdminById,
  checkAdminExistence,
  createAdmin,
  updateAdmin,
} from "../db/adminDBFunctions";
import { generateShortId } from "../utils/short";
import {
  createUserFunction,
  sendWelcomeMessage,
  updateUserFunction,
} from "./chat.controller";

export const adminSignup = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, username, password } = req.body;

      let admin = await checkAdminExistence(email);

      if (admin) {
        return res.status(400).json({
          success: false,
          message: `You are already a user, please signIn!`,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const chatId = generateShortId();
      const adminData = await createAdmin(
        fullName,
        email,
        username,
        "admin",
        hashedPassword,
        chatId
      );

      await createUserFunction(chatId, fullName, username, "");
      await sendWelcomeMessage(chatId || "", fullName);
      sendAdminToken(adminData, 200, "Signup Successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const loginAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      let admin = await checkAdminExistence(email);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "User not found, please create admin user!",
        });
      }

      const passwordMatch = await compare(password, admin.password || "");

      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          message: "Username or password is invalid!",
        });
      }

      if (!admin.chatId) {
        const chatId = generateShortId();

        admin = {
          ...admin,
          chatId,
        };

        await updateAdmin(admin.id, admin);

        await updateUserFunction(
          chatId,
          admin.username?.trim().toLocaleLowerCase() || "",
          admin?.fullName || "",
          ""
        );
        await sendWelcomeMessage(admin?.chatId || "", admin.fullName);
      }

      delete (admin as { password?: any }).password;

      sendAdminToken(admin, 200, "Login successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const logoutAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const getAdminDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await checkAdminById(req.user?.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found!",
        });
      }

      sendAdminToken(user, 200, "Profile fetched successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);
