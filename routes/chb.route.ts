import express from "express";
import {
  registerChb,
  activateChb,
  loginChb,
  logoutChb,
  updateChbInfo,
  resendOTP,
  getChbUserProfile,
} from "../controllers/chb.controller";
import { isAuthenticated } from "../middlewares/auth";
import {
  registrationValidation,
  activationValidation,
  loginValidation,
  updateChbInfoValidation,
  resendValidation,
} from "../validations/chbValidations";
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import {
  addCalendarEvent,
  deleteCalendarEvents,
  getCalendarEvents,
} from "../controllers/calendar.Controller";

const chbRouter = express.Router();

chbRouter.post(
  "/chb/registration",
  registrationValidation,
  handleValidationErrors,
  registerChb
);
chbRouter.post(
  "/chb/activate-user",
  activationValidation,
  handleValidationErrors,
  activateChb
);
chbRouter.post("/chb/login", loginValidation, handleValidationErrors, loginChb);

chbRouter.get("/chb/user", isAuthenticated, getChbUserProfile);

chbRouter.get("/chb/logout", isAuthenticated, logoutChb);
chbRouter.post(
  "/chb/update-profile",
  updateChbInfoValidation,
  handleValidationErrors,
  isAuthenticated,
  updateChbInfo
);
chbRouter.post(
  "/chb/resend-otp",
  resendValidation,
  handleValidationErrors,
  resendOTP
);

chbRouter.post("/chb/add-calendar-event", isAuthenticated, addCalendarEvent);

chbRouter.delete(
  "/chb/delete-calendar-event",
  isAuthenticated,
  deleteCalendarEvents
);

chbRouter.post("/chb/get-calendar-event", isAuthenticated, getCalendarEvents);

export default chbRouter;
