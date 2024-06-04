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
    .withMessage("Password should contain at least one digit"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("username").notEmpty().withMessage("Username name is required"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
];
