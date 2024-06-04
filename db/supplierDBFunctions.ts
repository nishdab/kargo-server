import prisma from "../db/db.config";
import { Request } from "express";

export const getPaginatedSupplierList = async (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
  const skip = (page - 1) * pageSize;

  const supplierList = await prisma.supplier.findMany({
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.supplier.count({});

  return {
    records: supplierList,
    totalCount,
  };
};
