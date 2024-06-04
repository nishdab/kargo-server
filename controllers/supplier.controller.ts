import { CatchAsyncError } from "../middlewares/catchAsyncError";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../middlewares/errorHandlerMiddleware";
import {
  deleteSupplierData,
  findSupplierById,
  getListOfSupplier,
} from "../db/bcoDBFunctions";
import { getPaginatedSupplierList } from "../db/supplierDBFunctions";

export const fetchSupplierList = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supplierList = await getListOfSupplier();

      res.status(200).json({
        success: true,
        message: "Supplier list fetched successfully!",
        data: supplierList,
      });
    } catch (error) {
      return next(new ErrorHandler((error as Error).message, 500));
    }
  }
);

export const deleteSupplier = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supplierId = req.body.dataId;

      const supplier = await findSupplierById(supplierId);

      if (!supplier) {
        return next(new ErrorHandler("Supplier not found", 404));
      }

      await deleteSupplierData(supplierId);

      const { records, totalCount } = await getPaginatedSupplierList(req);

      res.status(200).json({
        success: true,
        message: "Supplier deleted successfully!",
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
