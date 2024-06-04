import prisma from "./db.config";
import jwt from "jsonwebtoken";
import { ICHBRegistrationBody } from "../types/forwarderType";
import { Request } from "express";

export const checkChbEmailExistence = async (email: string) => {
  return await prisma.chb.findUnique({
    where: {
      email,
    },
  });
};

export const checkChbCompanyExistence = async (companyName: string) => {
  return await prisma.chb.findUnique({
    where: {
      companyName,
    },
  });
};

export const createChbUser = async (
  user: ICHBRegistrationBody,
  activation_token: string
) => {
  const refresh_token = jwt.sign(
    { email: user.email },
    process.env.REFRESH_TOKEN || "",
    {
      expiresIn: "10d",
    }
  );

  return await prisma.chb.create({
    data: {
      ...user,
      role: "chb",
      accessToken: activation_token,
      refreshToken: refresh_token,
    },
  });
};

export const updateChb = async (
  userId: number | undefined,
  updatedUserData: any
) => {
  return await prisma.chb.update({
    where: {
      id: userId,
    },
    data: updatedUserData,
  });
};

export const isChbUsernameAvailable = async (username: string) => {
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

  const existingChb = await prisma.chb.findFirst({
    where: {
      username,
    },
  });

  return !existingForwarderAdmin && !existingBco && !existingChb;
};

export const checkChbUserExistence = async (email: string) => {
  return await prisma.chb.findFirst({
    where: {
      email,
    },
  });
};

export const getChbUser = async (userId: any) => {
  return await prisma.chb.findUnique({
    where: {
      id: userId,
    },
  });
};

export const getListOfCHB = async () => {
  return await prisma.chb.findMany({});
};

export const findCHBById = async (id: number) => {
  return prisma.chb.findUnique({
    where: { id },
  });
};

export const deleteCHBData = async (id: number) => {
  return prisma.chb.deleteMany({
    where: { id },
  });
};

export const getPaginatedCHBList = async (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
  const skip = (page - 1) * pageSize;

  const chbs = await prisma.chb.findMany({
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.chb.count({});

  return {
    records: chbs,
    totalCount,
  };
};
