require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import { sendToken, createActivationToken } from "../utils/jwt";
import { IForwarderAdmin } from "../types/forwarderType";
import bcrypt, { compare } from "bcryptjs";

import {
  IRegistrationBody,
  IActivationRequest,
  ILoginRequest,
  IUpdateForwarderInfo,
  IResendRequest,
} from "../types/forwarderType";

import {
  checkCompanyExistence,
  checkEmailExistence,
  checkUserExistence,
  createUser,
  getUser,
  isUsernameAvailable,
  updateForwardAdmin,
} from "../db/authDBFunctions";

import { handleErrors } from "../middlewares/errorHandlerMiddleware";
import { generateShortId, genrateUniqueUsername } from "../utils/short";
import {
  createUserFunction,
  sendWelcomeMessage,
  updateUserFunction,
} from "./chat.controller";

export const registrationForwarderAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, fullName, companyName } = req.body;

      if (await checkEmailExistence(email)) {
        return res.status(400).json({
          success: false,
          message: `Email Already existed!`,
        });
      }

      if (await checkCompanyExistence(companyName)) {
        return res.status(400).json({
          success: false,
          message: `Company Already existed!`,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const forwarderAdmin: IRegistrationBody = {
        email,
        password: hashedPassword,
        fullName,
        companyName,
      };

      const activationToken = createActivationToken(forwarderAdmin);
      const activationCode = activationToken.activationCode;

      await sendActivationMail(email, activationCode);

      res.status(201).json({
        success: true,
        message: `Please check your email: ${email} to activate your account!`,
        activationToken: activationToken.token,
      });
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        activation_token,
        activation_code,
      } = req.body as IActivationRequest;

      const newForwarderAdmin = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IRegistrationBody; activationCode: string };

      if (newForwarderAdmin.activationCode !== activation_code) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid OTP, Please try again!" });
      }

      const { email, companyName, fullName, password } = newForwarderAdmin.user;

      if (await checkEmailExistence(email)) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      const chatId = generateShortId();
      const username = genrateUniqueUsername(email, companyName);

      let updatedUser = {
        email,
        companyName,
        fullName,
        chatId,
        username: username,
        password,
      };

      const user = await createUser(updatedUser, activation_token);

      await createUserFunction(chatId, fullName, username, "");

      await sendWelcomeMessage(chatId, fullName);

      sendToken(user, 201, res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const loginForwarder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      let existingUser = await checkUserExistence(email);
      let sendWelcomeMessageFlag = false;

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found, please check your email",
        });
      }

      const passwordMatch = await compare(
        password,
        existingUser.password || ""
      );

      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          message: "Username or password is invalid!",
        });
      }

      if (!existingUser.chatId) {
        const chatId = generateShortId();

        sendWelcomeMessageFlag = true;
        existingUser = {
          ...existingUser,
          chatId,
        };
      }

      if (!existingUser?.username) {
        const username = genrateUniqueUsername(
          existingUser?.email || "",
          existingUser?.companyName || ""
        );

        sendWelcomeMessageFlag = true;

        existingUser = {
          ...existingUser,
          username,
        };
      }

      await updateForwardAdmin(existingUser.id, existingUser);

      await updateUserFunction(
        existingUser?.chatId || "",
        existingUser?.username?.trim().toLocaleLowerCase() || "",
        existingUser?.fullName || "",
        ""
      );

      if (sendWelcomeMessageFlag) {
        await sendWelcomeMessage(
          existingUser?.chatId || "",
          existingUser.fullName
        );
      }

      sendToken(existingUser, 200, res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const logoutForwarder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      res.status(200).json({
        success: true,
        message: "Logged Out successfully",
      });
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const updateForwarderInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        fullName,
        physicalAddress,
        businessRegistrationNumber,
        vatNumber,
        companyName,
        phoneNumber,
        username,
      } = req.body as IUpdateForwarderInfo;

      const userId = req.user?.id;
      let sendWelcomeMessageFlag = false;

      let user = await getUser(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if the updated username is not empty and is unique
      if (
        username?.trim() !== undefined &&
        username?.trim().toLocaleLowerCase() !==
          user?.username?.trim().toLocaleLowerCase()
      ) {
        const isUsernameUnique = await isUsernameAvailable(
          username?.trim().toLocaleLowerCase()
        );

        if (!isUsernameUnique) {
          return res.status(400).json({
            success: false,
            message:
              "Username is already taken. Please choose a different one.",
          });
        }
      }

      if (!user?.chatId) {
        const chatId = generateShortId();
        sendWelcomeMessageFlag = true;

        user = {
          ...user,
          chatId,
        };
      }

      if (!user?.username && !username) {
        const username = genrateUniqueUsername(
          user?.email || "",
          user?.companyName || ""
        );

        user = {
          ...user,
          username,
        };

        sendWelcomeMessageFlag = true;
      }

      const updatedUser = await updateForwardAdmin(userId, {
        chatId: user?.chatId,
        fullName: fullName || user?.fullName || undefined,
        physicalAddress: physicalAddress || user?.physicalAddress || undefined,
        companyName: companyName || user?.companyName || undefined,
        businessRegistrationNumber:
          businessRegistrationNumber ||
          user?.businessRegistrationNumber ||
          undefined,
        vatNumber: vatNumber || user?.vatNumber || undefined,
        kargoAccountNumber: user?.kargoAccountNumber || undefined,
        phoneNumber: phoneNumber || user?.phoneNumber || undefined,
        username:
          username?.trim().toLocaleLowerCase() ||
          user?.username?.trim().toLocaleLowerCase() ||
          undefined,
      });

      await updateUserFunction(
        user?.chatId || "",
        username?.trim().toLocaleLowerCase() ||
          user?.username?.trim().toLocaleLowerCase() ||
          "",
        fullName || user?.fullName || "",
        ""
      );

      if (sendWelcomeMessageFlag) {
        await sendWelcomeMessage(
          user?.chatId || "",
          fullName || user?.fullName
        );
      }

      sendToken(updatedUser, 200, res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const resendOTP = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token } = req.body as IResendRequest;

      const userDetails = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IForwarderAdmin; activationCode: string };

      if (!userDetails.activationCode) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid user!" });
      }

      const { email } = userDetails.user;

      if (await checkEmailExistence(email)) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const activationCode = userDetails.activationCode;

      await sendActivationMail(email, activationCode);

      res.status(201).json({
        success: true,
        message: `OTP Sent Successfully!`,
        activationToken: activation_token,
      });
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const sendActivationMail = async (
  email: string,
  activationCode: string
) => {
  const data = { activationCode };

  await sendMail({
    email,
    subject: "Activate Your KARGO Account",
    template: "activation-mail.ejs",
    data,
  });
};

export const getUserProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getUser(req.user?.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      sendToken(user, 200, res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);
