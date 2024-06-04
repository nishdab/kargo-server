import { body } from "express-validator";

export const addImporterValidator = [
  body("contactPerson.fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ max: 20 })
    .withMessage("Full name must be at most 20 characters"),
  body("contactPerson.email").isEmail().withMessage("Valid email is required"),
  body("contactPerson.phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isNumeric()
    .withMessage("Phone number must be numeric")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 digits"),
  body("companyDetails.companyName")
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ max: 25 })
    .withMessage("Company name must be at most 25 characters"),
  body("companyDetails.addressLine1")
    .notEmpty()
    .withMessage("Address Line 1 is required")
    .isLength({ max: 100 })
    .withMessage("Address Line 1 must be at most 100 characters"),
  body("companyDetails.cityCountry")
    .notEmpty()
    .withMessage("City/Country is required")
    .isLength({ max: 50 })
    .withMessage("City/Country must be at most 50 characters"),
  body("companyDetails.registeredAddress")
    .notEmpty()
    .withMessage("Registered address is required")
    .isLength({ max: 100 })
    .withMessage("Registered address must be at most 100 characters"),
];

export const inviteImporterValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("companyName").notEmpty().withMessage("Company name is required"),
];

export const deleteImporterValidator = [
  body("importerId").notEmpty().withMessage("Importer ID is required"),
];

export const editImporterValidator = [
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
