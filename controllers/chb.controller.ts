require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import { createActivationToken, sendCHBToken } from "../utils/jwt";
import bcrypt, { compare } from "bcryptjs";

import {
  IRegistrationBody,
  IActivationRequest,
  ILoginRequest,
  IResendRequest,
} from "../types/forwarderType";

import {
  checkChbCompanyExistence,
  checkChbEmailExistence,
  checkChbUserExistence,
  createChbUser,
  deleteCHBData,
  findCHBById,
  getChbUser,
  getPaginatedCHBList,
  isChbUsernameAvailable,
  updateChb,
} from "../db/chbDBFunctions";

import { handleErrors } from "../middlewares/errorHandlerMiddleware";
import { IChbBody, IUpdateChbInfo } from "../types/chbType";
import { generateShortId, genrateUniqueUsername } from "../utils/short";
import {
  createUserFunction,
  sendWelcomeMessage,
  updateUserFunction,
} from "./chat.controller";

export const registerChb = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, fullName, companyName } = req.body;

      if (await checkChbEmailExistence(email)) {
        return res.status(400).json({
          success: false,
          message: `Email Already existed!`,
        });
      }

      if (await checkChbCompanyExistence(companyName)) {
        return res.status(400).json({
          success: false,
          message: `Company Already existed!`,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const chb: IRegistrationBody = {
        email,
        password: hashedPassword,
        fullName,
        companyName,
      };

      const activationToken = createActivationToken(chb);
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

export const activateChb = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        activation_token,
        activation_code,
      } = req.body as IActivationRequest;

      const newChb = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IRegistrationBody; activationCode: string };

      if (newChb.activationCode !== activation_code) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid OTP, Please try again!" });
      }

      const { email, companyName, fullName, password } = newChb.user;

      if (await checkChbEmailExistence(email)) {
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

      const user = await createChbUser(updatedUser, activation_token);

      await createUserFunction(chatId, fullName, username, "");
      await sendWelcomeMessage(chatId, fullName);

      sendCHBToken(user, 201, "Activation Successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const loginChb = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      let existingUser = await checkChbUserExistence(email);
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

      if (sendWelcomeMessageFlag) {
        await updateChb(existingUser.id, existingUser);

        await updateUserFunction(
          existingUser?.chatId || "",
          existingUser?.username?.trim().toLocaleLowerCase() || "",
          existingUser?.fullName || "",
          ""
        );

        await sendWelcomeMessage(
          existingUser?.chatId || "",
          existingUser.fullName
        );
      }

      sendCHBToken(existingUser, 200, "Login Successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const logoutChb = CatchAsyncError(
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

export const updateChbInfo = CatchAsyncError(
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
      } = req.body as IUpdateChbInfo;

      const userId = req.user?.id;

      let user = await getChbUser(userId);
      let sendWelcomeMessageFlag = false;

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
        const isUsernameUnique = await isChbUsernameAvailable(
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
        const username = genrateUniqueUsername(user?.email, user?.companyName);
        user = {
          ...user,
          username,
        };

        sendWelcomeMessageFlag = true;
      }

      const updatedUser = await updateChb(userId, {
        chatId: user?.chatId,
        fullName: fullName || user?.fullName || undefined,
        physicalAddress: physicalAddress || user?.physicalAddress || undefined,
        companyName: companyName || user?.companyName || undefined,
        businessRegistrationNumber:
          businessRegistrationNumber ||
          user?.businessRegistrationNumber ||
          undefined,
        customsRegistrationNumber:
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
        fullName || user.fullName,
        ""
      );

      if (sendWelcomeMessageFlag) {
        await sendWelcomeMessage(user?.chatId || "", user?.fullName);
      }

      sendCHBToken(updatedUser, 200, "Profile Updated Successfully!", res);
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
      ) as { user: IChbBody; activationCode: string };

      if (!userDetails.activationCode) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid user!" });
      }

      const { email } = userDetails.user;

      if (await checkChbEmailExistence(email)) {
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

export const getChbUserProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getChbUser(req.user?.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      sendCHBToken(user, 200, "User profile fetched successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const fetchCHBList = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { records, totalCount } = await getPaginatedCHBList(req);

      res.status(200).json({
        success: true,
        message: "CHB list fetched successfully!",
        data: {
          records,
          totalCount,
        },
      });
    } catch (error) {
      return next(new ErrorHandler((error as Error).message, 500));
    }
  }
);

export const deleteCHB = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chbId = req.body.dataId;

      const chb = await findCHBById(chbId);

      if (!chb) {
        return next(new ErrorHandler("CHB not found", 404));
      }

      await deleteCHBData(chbId);

      const { records, totalCount } = await getPaginatedCHBList(req);

      res.status(200).json({
        success: true,
        message: "CHB deleted successfully!",
        data: {
          records,
          totalCount,
        },
      });
    } catch (error) {
      return next(new ErrorHandler((error as Error).message, 500));
    }
  }
);
