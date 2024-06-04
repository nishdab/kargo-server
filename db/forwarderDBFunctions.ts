import prisma from "../db/db.config";
import { handleDatabaseConnectionError } from "../utils/dbError";
import { Request } from "express";

export const findForwarderAdmin = async (userId: number | undefined) => {
  return prisma.forwarderAdmin
    .findUnique({
      where: { id: userId },
    })
    .catch(handleDatabaseConnectionError);
};

export const findImporterByCompany = async (
  userId: number | undefined,
  companyName: string,
  importerId: string,
  isUpdating: boolean
) => {
  if (isUpdating) {
    return prisma.bco.findMany({
      where: {
        forwarderId: userId,
        company: {
          companyName: companyName.trim(),
        },
        NOT: {
          id: parseInt(importerId),
        },
      },
    });
  } else {
    return prisma.bco.findMany({
      where: {
        forwarderId: userId,
        company: {
          companyName: companyName.trim(),
        },
      },
    });
  }
};

export const createImporter = async (
  fullName: string,
  emailAddress: string,
  forwarderId: number,
  contactId: number,
  companyId: number
) => {
  return prisma.bco.create({
    data: {
      fullName,
      emailAddress,
      invitedStatus: "Pending",
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

export const findImporterById = async (importerId: number) => {
  return prisma.bco.findUnique({
    where: { id: importerId },
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

export const deleteImporterData = async (importerId: number) => {
  return prisma.bco.deleteMany({
    where: { id: importerId },
  });
};

export const getPaginatedImporterData = async (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
  const userId = req.user?.id;
  const skip = (page - 1) * pageSize;

  const bcos = await prisma.bco.findMany({
    where: {
      forwarderId: userId,
    },
    skip,
    take: pageSize,
    include: {
      company: {
        include: {
          warehouseAddresses: true,
          companyTiers: {
            include: {
              tier: true,
            },
          },
        },
      },
      contact: true,
    },
  });

  const totalCount = await prisma.bco.count({
    where: {
      forwarderId: userId,
    },
  });

  const records = bcos.map((bco) => {
    const {
      id,
      fullName,
      emailAddress,
      company,
      contact,
      createdAt,
      updatedAt,
    } = bco;
    const tier = company?.companyTiers[0]?.tier?.tierName || "No Tier";
    return {
      id,
      fullName,
      emailAddress,
      tier,
      createdAt,
      updatedAt,
      company,
      contact,
    };
  });

  return {
    records,
    totalCount,
  };
};

export const getListOfForwarderAdmin = async () => {
  return await prisma.forwarderAdmin.findMany({
    include: {},
  });
};

export const getPaginatedForwarderList = async (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
  const skip = (page - 1) * pageSize;

  const forwarderAdmin = await prisma.forwarderAdmin.findMany({
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.forwarderAdmin.count({});

  return {
    records: forwarderAdmin,
    totalCount,
  };
};

export const deleteForwarderAdminData = async (id: number) => {
  return prisma.forwarderAdmin.deleteMany({
    where: { id },
  });
};

export const findTier = async (tierName: string) => {
  let tier = await prisma.tier.findFirst({
    where: { tierName },
  });

  return tier;
};

export const addTier = async (tierName: string) => {
  const tier = await prisma.tier.create({
    data: {
      tierName,
      markupPercentage: 0.0, // Change this value accordingly
    },
  });
  return tier;
};

export const addCompnayTier = async (companyId: number, tierId: number) => {
  await prisma.companyTier.create({
    data: {
      companyId,
      tierId,
    },
  });
};

export const findTierByName = async (tierName: string) => {
  try {
    const tier = await prisma.tier.findFirst({
      where: {
        tierName: tierName,
      },
    });
    return tier;
  } catch (error) {
    throw new Error("Error finding tier by name");
  }
};

export const updateCompanyTier = async (
  companyId: number,
  tierName: string
) => {
  try {
    // Find the tier by name
    let tier = await findTierByName(tierName);

    // If tier doesn't exist, create a new one
    if (!tier) {
      tier = await prisma.tier.create({
        data: {
          tierName: tierName,
          markupPercentage: 0.0,
        },
      });
    }

    // Update the companyTier with the new or existing tier
    const existingCompanyTier = await prisma.companyTier.findFirst({
      where: {
        companyId: companyId,
      },
    });

    if (existingCompanyTier) {
      // Update the existing companyTier
      await prisma.companyTier.update({
        where: {
          id: existingCompanyTier.id,
        },
        data: {
          tierId: tier.id,
        },
      });
    } else {
      // Create a new companyTier if it doesn't exist
      await prisma.companyTier.create({
        data: {
          companyId: companyId,
          tierId: tier.id,
        },
      });
    }
  } catch (error) {
    throw new Error("Error updating company tier");
  }
};
