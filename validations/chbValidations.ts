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

export const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
];

export const updateChbInfoValidation = [
  body("fullName").optional().notEmpty().withMessage("Full name is required"),
  body("physicalAddress").optional(),
  body("businessRegistrationNumber").optional(),
  body("customsRegistrationNumber").optional(),
  body("vatNumber").optional(),
  body("companyName")
    .optional()
    .notEmpty()
    .withMessage("Company name is required"),
  body("kargoAccountNumber").optional(),
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

export const deleteChbValidator = [
  body("dataId").notEmpty().withMessage("Customer is required"),
];

export const addEditImporterValidator = [
  body("updatedContactPerson.fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ max: 20 })
    .withMessage("Full name must be at most 20 characters"),
  body("updatedContactPerson.email")
    .isEmail()
    .withMessage("Valid email is required"),
  body("updatedContactPerson.phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isNumeric()
    .withMessage("Phone number must be numeric")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 digits"),
  body("updatedCompanyDetails.companyName")
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ max: 25 })
    .withMessage("Company name must be at most 25 characters"),
  body("updatedCompanyDetails.addressLine1")
    .notEmpty()
    .withMessage("Address Line 1 is required")
    .isLength({ max: 100 })
    .withMessage("Address Line 1 must be at most 100 characters"),
  body("updatedCompanyDetails.cityCountry")
    .notEmpty()
    .withMessage("City/Country is required")
    .isLength({ max: 50 })
    .withMessage("City/Country must be at most 50 characters"),
  body("updatedCompanyDetails.registeredAddress")
    .notEmpty()
    .withMessage("Registered address is required")
    .isLength({ max: 100 })
    .withMessage("Registered address must be at most 100 characters"),
];

export const activationValidation = [
  body("activation_token")
    .notEmpty()
    .withMessage("Activation token is required"),
  body("activation_code")
    .isNumeric()
    .withMessage("Activation code should be numeric"),
];

export const resendValidation = [
  body("activation_token")
    .notEmpty()
    .withMessage("Activation token is required"),
];
