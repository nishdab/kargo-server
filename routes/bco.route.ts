import express from "express";
import {
  registerBCO,
  loginBCO,
  getBCODetail,
  logoutBCO,
  updateBCOProfile,
  getBCOBySignupLink,
  addSupplier,
  deleteSupplier,
  editSupplier,
  inviteSupplier,
  fetchDashboardData,
} from "../controllers/bco.controllers";
import { isAuthenticated } from "../middlewares/auth";
import {
  registrationValidation,
  loginValidation,
  updateBCOInfoValidation,
  deleteBCOValidator,
  addEditSupplierValidator,
} from "../validations/bcoValidations";
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import { inviteImporterValidator } from "../validations/forwarderValidations";
import {
  addCalendarEvent,
  deleteCalendarEvents,
  getCalendarEvents,
} from "../controllers/calendar.Controller";

const bcoRouter = express.Router();

bcoRouter.post("/bco/get-user-details", getBCOBySignupLink);
bcoRouter.post(
  "/bco/registration",
  registrationValidation,
  handleValidationErrors,
  registerBCO
);
bcoRouter.post("/bco/login", loginValidation, handleValidationErrors, loginBCO);
bcoRouter.get("/bco/user", isAuthenticated, getBCODetail);
bcoRouter.get("/bco/logout", isAuthenticated, logoutBCO);
bcoRouter.post(
  "/bco/update-profile",
  updateBCOInfoValidation,
  handleValidationErrors,
  isAuthenticated,
  updateBCOProfile
);
bcoRouter.get("/bco", isAuthenticated, fetchDashboardData);
bcoRouter.post(
  "/bco/add",
  isAuthenticated,
  addEditSupplierValidator,
  handleValidationErrors,
  addSupplier
);
bcoRouter.delete(
  "/bco/delete",
  isAuthenticated,
  deleteBCOValidator,
  handleValidationErrors,
  deleteSupplier
);
bcoRouter.put(
  "/bco/edit/:supplierId",
  isAuthenticated,
  addEditSupplierValidator,
  handleValidationErrors,
  editSupplier
);
bcoRouter.post(
  "/bco/invite",
  isAuthenticated,
  inviteImporterValidator,
  handleValidationErrors,
  inviteSupplier
);

bcoRouter.post("/bco/add-calendar-event", isAuthenticated, addCalendarEvent);

bcoRouter.delete(
  "/bco/delete-calendar-event",
  isAuthenticated,
  deleteCalendarEvents
);

bcoRouter.post("/bco/get-calendar-event", isAuthenticated, getCalendarEvents);

export default bcoRouter;
