require("dotenv").config();
import { Response } from "express";
import { IForwarderAdmin, IActivationToken } from "../types/forwarderType.js";
import jwt, { Secret } from "jsonwebtoken";
import { generateChatToken } from "../controllers/chat.controller";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

export const SignAccessToken = function (id: number | undefined) {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "1d",
  });
};

const SignRefreshToken = function (id: number | undefined) {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "10d",
  });
};

// parse environment variable to integrate fallback values
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// options for cookies
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: any, statusCode: number, res: Response) => {
  const accessToken = SignAccessToken(user.id);
  const refreshToken = SignRefreshToken(user.id);

  // only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  const chatToken = generateChatToken(user?.chatId);

  res.status(statusCode).json({
    success: true,
    user: {
      ...user,
      accessToken,
      chatToken,
    },
  });
};

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "15m",
    }
  );

  return { token, activationCode };
};

export function generateUniqueInviteToken(tokenPayload: object) {
  const secretKey = process.env.INVITE_SECRET;
  const expiresIn = 60 * 60 * 24; // 1 day in seconds

  const token = jwt.sign(tokenPayload, secretKey as Secret, {
    expiresIn,
  });

  return token;
}

export function verifyInviteToken(inviteToken: string) {
  const secretKey = process.env.INVITE_SECRET;

  const bcoDetails = jwt.verify(inviteToken, secretKey as string) as {
    user: IForwarderAdmin;
    activationCode: string;
  };

  return bcoDetails;
}

export const signBCOToken = (id: number | undefined) => {
  return jwt.sign({ id }, process.env.BCO_SECRET || "", {
    expiresIn: "1d",
  });
};

export const sendBCOToken = (
  user: any,
  statusCode: number,
  message: string,
  res: Response
) => {
  const accessToken = signBCOToken(user.id);

  // only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  const chatToken = generateChatToken(user?.chatId);

  res.status(statusCode).json({
    success: true,
    message,
    user: {
      ...user,
      accessToken,
      chatToken,
      role: "bco",
    },
  });
};

export const signCHBToken = (id: number | undefined) => {
  return jwt.sign({ id }, process.env.CHB_SECRET || "", {
    expiresIn: "1d",
  });
};

export const sendCHBToken = (
  user: any,
  statusCode: number,
  message: string,
  res: Response
) => {
  const accessToken = signCHBToken(user.id);

  // only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  const chatToken = generateChatToken(user?.chatId);

  res.status(statusCode).json({
    success: true,
    message,
    user: {
      ...user,
      accessToken,
      chatToken,
      role: "chb",
    },
  });
};

export const signAdminToken = (id: number | undefined) => {
  return jwt.sign({ id }, process.env.ADMIN_SECRET || "", {
    expiresIn: "1d",
  });
};

export const sendAdminToken = (
  user: any,
  statusCode: number,
  message: string,
  res: Response
) => {
  const accessToken = signAdminToken(user.id);

  // only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  const chatToken = generateChatToken(user?.chatId);

  res.status(statusCode).json({
    success: true,
    message,
    user: {
      ...user,
      accessToken,
      chatToken,
      role: "admin",
    },
  });
};
