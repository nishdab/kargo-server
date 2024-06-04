import prisma from "./db.config";
import jwt from "jsonwebtoken";
import { IRegistrationBody } from "../types/forwarderType";

export const checkEmailExistence = async (email: string) => {
  return await prisma.forwarderAdmin.findUnique({
    where: {
      email,
    },
  });
};

export const checkCompanyExistence = async (companyName: string) => {
  return await prisma.forwarderAdmin.findUnique({
    where: {
      companyName,
    },
  });
};

export const createUser = async (
  user: IRegistrationBody,
  activation_token: string
) => {
  const refresh_token = jwt.sign(
    { email: user.email },
    process.env.REFRESH_TOKEN || "",
    {
      expiresIn: "10d",
    }
  );

  return await prisma.forwarderAdmin.create({
    data: {
      ...user,
      role: "ForwarderAdmin",
      accessToken: activation_token,
      refreshToken: refresh_token,
    },
  });
};

export const updateForwardAdmin = async (
  userId: number | undefined,
  updatedUserData: any
) => {
  return await prisma.forwarderAdmin.update({
    where: {
      id: userId,
    },
    data: updatedUserData,
  });
};

export const isUsernameAvailable = async (username: string) => {
  const existingForwarderAdmin = await prisma.forwarderAdmin.findFirst({
    where: {
      username,
    },
  });

  const existingBco = await prisma.bco.findFirst({
    where: {
      username,
    },
  });

  return !existingForwarderAdmin && !existingBco;
};

export const checkUserExistence = async (email: string) => {
  return await prisma.forwarderAdmin.findFirst({
    where: {
      email,
    },
  });
};

export const getUser = async (userId: any) => {
  return await prisma.forwarderAdmin.findUnique({
    where: {
      id: userId,
    },
  });
};
