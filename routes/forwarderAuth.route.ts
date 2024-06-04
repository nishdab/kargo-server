import express from "express";
import {
  activateUser,
  loginForwarder,
  logoutForwarder,
  registrationForwarderAdmin,
  updateForwarderInfo,
  resendOTP,
  getUserProfile,
} from "../controllers/auth.controller";
import { isAuthenticated } from "../middlewares/auth";
import {
  registrationValidation,
  activationValidation,
  loginValidation,
  updateForwarderInfoValidation,
  resendValidation,
} from "../validations/authValidations";
import { handleValidationErrors } from "../middlewares/validationMiddleware";

const userRouter = express.Router();

userRouter.post(
  "/forwarder/registration",
  registrationValidation,
  handleValidationErrors,
  registrationForwarderAdmin
);
userRouter.post(
  "/forwarder/activate-user",
  activationValidation,
  handleValidationErrors,
  activateUser
);
userRouter.post(
  "/forwarder/login",
  loginValidation,
  handleValidationErrors,
  loginForwarder
);

userRouter.get("/forwarder/user", isAuthenticated, getUserProfile);

userRouter.get("/forwarder/logout", isAuthenticated, logoutForwarder);
userRouter.post(
  "/forwarder/update-profile",
  updateForwarderInfoValidation,
  handleValidationErrors,
  isAuthenticated,
  updateForwarderInfo
);
userRouter.post(
  "/forwarder/resend-otp",
  resendValidation,
  handleValidationErrors,
  resendOTP
);

export default userRouter;
