import { Request } from "express";
import prisma from "../db/db.config";

export const createBCO = async (
  fullName: string,
  emailAddress: string,
  forwarderId: number,
  contactId?: number,
  companyId?: number,
  inviteStatus?: string
) => {
  return prisma.bco.create({
    data: {
      fullName,
      emailAddress,
      invitedStatus: inviteStatus || "Pending",
      forwarder: {
        connect: {
          id: forwarderId,
        },
      },
      contact: {
        connect: {
          id: contactId,
        },
      },
      company: {
        connect: {
          id: companyId,
        },
      },
    },
  });
};

export const updateBCO = async (bcoId: number, updatedData: object) => {
  return prisma.bco.update({
    where: { id: bcoId },
    data: updatedData,
  });
};

export const updateBCOWithCompany = async (
  bcoId: number,
  updatedData: object,
  updatedCompanyData: object
) => {
  return prisma.bco.update({
    where: { id: bcoId },
    data: {
      ...updatedData,
      company: {
        update: updatedCompanyData,
      },
    },
    include: {
      company: true,
    },
  });
};

export const checkBCOExistence = async (emailAddress: string) => {
  return await prisma.bco.findFirst({
    where: {
      emailAddress,
    },
    include: {
      company: true,
      contact: true,
    },
  });
};

export const checkBCOExistenceForCompany = async (
  emailAddress: string,
  companyName: string
) => {
  return await prisma.bco.findFirst({
    where: {
      emailAddress,
      company: {
        companyName: companyName.trim(),
      },
    },
  });
};

export const getBCO = async (bcoId: any) => {
  return await prisma.bco.findUnique({
    where: {
      id: bcoId,
    },
    include: {
      company: true,
      contact: true,
    },
  });
};

export const findSupplierByCompany = async (
  bcoId: number | undefined,
  companyName: string,
  supplierId: string,
  isUpdating: boolean
) => {
  if (isUpdating) {
    return prisma.supplier.findMany({
      where: {
        bcoId,
        company: {
          companyName: companyName.trim(),
        },
        NOT: {
          id: parseInt(supplierId),
        },
      },
    });
  } else {
    return prisma.supplier.findMany({
      where: {
        bcoId,
        company: {
          companyName: companyName.trim(),
        },
      },
    });
  }
};

export const createSupplier = async (
  fullName: string,
  email: string,
  product: string,
  port: string,
  bcoId: number,
  contactId: number,
  companyId: number
) => {
  return prisma.supplier.create({
    data: {
      fullName,
      email,
      product,
      port,
      invitedStatus: "Pending",
      bco: {
        connect: {
          id: bcoId,
        },
      },
      contact: {
        connect: {
          id: contactId,
        },
      },
      company: {
        connect: {
          id: companyId,
        },
      },
    },
  });
};

export const findSupplierById = async (supplierId: number) => {
  return prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      company: {
        include: {
          warehouseAddresses: true,
        },
      },
      contact: true,
    },
  });
};

export const deleteSupplierData = async (supplierId: number) => {
  return prisma.supplier.deleteMany({
    where: { id: supplierId },
  });
};

export const updateSupplier = async (
  supplierId: number,
  updatedData: object
) => {
  return prisma.supplier.update({
    where: { id: supplierId },
    data: updatedData,
  });
};

export const getPaginatedSupplierData = async (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
  const userId = req.user?.id;
  const skip = (page - 1) * pageSize;

  const bcos = await prisma.supplier.findMany({
    where: {
      bcoId: userId,
    },
    skip,
    take: pageSize,
    include: {
      company: true,
      contact: true,
    },
  });

  const totalCount = await prisma.supplier.count({
    where: {
      bcoId: userId,
    },
  });

  return {
    records: bcos,
    totalCount,
  };
};

export const getListOfBCO = async () => {
  return await prisma.bco.findMany({
    include: {
      company: true,
      contact: true,
      forwarder: true,
    },
  });
};

export const getListOfSupplier = async () => {
  return await prisma.supplier.findMany({
    include: {
      company: true,
      contact: true,
    },
  });
};

export const getPaginatedBCOList = async (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

  const skip = (page - 1) * pageSize;

  const bcos = await prisma.bco.findMany({
    include: {
      company: {
        include: {
          warehouseAddresses: true,
        },
      },
      contact: true,
    },
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.bco.count({});

  return {
    records: bcos,
    totalCount,
  };
};
