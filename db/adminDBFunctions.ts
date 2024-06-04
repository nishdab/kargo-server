import prisma from "../db/db.config";

export const createAdmin = async (
  fullName: string,
  email: string,
  username: string,
  role: string,
  password: string,
  chatId: string
) => {
  return prisma.admin.create({
    data: {
      fullName,
      email,
      username,
      role,
      password,
      chatId,
    },
  });
};

export const checkAdminExistence = async (email: string) => {
  return await prisma.admin.findUnique({
    where: {
      email,
    },
  });
};

export const checkAdminById = async (id: number) => {
  return await prisma.admin.findUnique({
    where: {
      id,
    },
  });
};

export const updateAdmin = async (
  userId: number | undefined,
  updatedUserData: any
) => {
  return await prisma.admin.update({
    where: {
      id: userId,
    },
    data: updatedUserData,
  });
};
