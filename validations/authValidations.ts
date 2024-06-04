import { body } from "express-validator";

export const registrationValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long")
    .matches(/[a-z]/)
    .withMessage("Password should contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password should contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password should contain at least one digit")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password should contain at least one special character"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("companyName").notEmpty().withMessage("Company name is required"),
];

export const activationValidation = [
  body("activation_token")
    .notEmpty()
    .withMessage("Activation token is required"),
  body("activation_code")
    .isNumeric()
    .withMessage("Activation code should be numeric"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
];

export const updateForwarderInfoValidation = [
  body("fullName").optional().notEmpty().withMessage("Full name is required"),
  body("physicalAddress").optional(),
  body("businessRegistrationNumber").optional(),
  body("vatNumber").optional(),
  body("companyName")
    .optional()
    .notEmpty()
    .withMessage("Company name is required"),
  body("kargoAccountNumber").optional(),
  body("phoneNumber").optional(),
  body("phoneNumber")
    .optional()
    .custom((value) => {
      if (value && isNaN(value)) {
        throw new Error("Phone number must be numeric");
      }

      // Check if the length is between 10 and 15 digits
      if (value && (value.length < 10 || value.length > 15)) {
        throw new Error("Phone number must be between 10 and 15 digits");
      }

      return true;
    }),
];

export const resendValidation = [
  body("activation_token")
    .notEmpty()
    .withMessage("Activation token is required"),
];
