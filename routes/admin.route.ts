import express from "express";
import { isAuthenticated } from "../middlewares/auth";
import {
  registrationValidation,
  loginValidation,
} from "../validations/adminValidations";
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import {
  adminSignup,
  loginAdmin,
  logoutAdmin,
  getAdminDetails,
} from "../controllers/admin.controller";
import {
  deleteSupplier,
  fetchSupplierList,
} from "../controllers/supplier.controller";
import { deleteCHB, fetchCHBList } from "../controllers/chb.controller";
import {
  deleteForwarderAdmin,
  fetchForwardAdminList,
} from "../controllers/forwarder.controller";
import { deleteBCO, fetchBcoList } from "../controllers/bco.controllers";
import {
  addCalendarEvent,
  deleteCalendarEvents,
  getCalendarEvents,
} from "../controllers/calendar.Controller";

const adminRouter = express.Router();

adminRouter.post(
  "/admin/registration",
  registrationValidation,
  handleValidationErrors,
  adminSignup
);
adminRouter.post(
  "/admin/login",
  loginValidation,
  handleValidationErrors,
  loginAdmin
);
adminRouter.get("/admin/user", isAuthenticated, getAdminDetails);
adminRouter.get("/admin/logout", isAuthenticated, logoutAdmin);

adminRouter.get("/admin/supplier/list", isAuthenticated, fetchSupplierList);
adminRouter.get("/admin/chb/list", isAuthenticated, fetchCHBList);
adminRouter.get(
  "/admin/forwarder/list",
  isAuthenticated,
  fetchForwardAdminList
);
adminRouter.get("/admin/bco/list", isAuthenticated, fetchBcoList);

adminRouter.delete("/admin/supplier/delete", isAuthenticated, deleteSupplier);
adminRouter.delete("/admin/chb/delete", isAuthenticated, deleteCHB);
adminRouter.delete(
  "/admin/forwarder/delete",
  isAuthenticated,
  deleteForwarderAdmin
);
adminRouter.delete("/admin/bco/delete", isAuthenticated, deleteBCO);

adminRouter.post(
  "/admin/add-calendar-event",
  isAuthenticated,
  addCalendarEvent
);

adminRouter.delete(
  "/admin/delete-calendar-event",
  isAuthenticated,
  deleteCalendarEvents
);

adminRouter.post(
  "/admin/get-calendar-event",
  isAuthenticated,
  getCalendarEvents
);
export default adminRouter;
