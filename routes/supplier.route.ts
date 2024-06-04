import express from "express";
import { fetchSupplierList } from "../controllers/supplier.controller";
import { isAuthenticated } from "../middlewares/auth";

const supplierRouter = express.Router();

// supplierRouter.get("/supplier/list",isAuthenticated, fetchSupplierList);

export default supplierRouter;
