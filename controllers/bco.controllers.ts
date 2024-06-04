require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import prisma from "../db/db.config";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import {
  verifyInviteToken,
  sendBCOToken,
  generateUniqueInviteToken,
} from "../utils/jwt";
import bcrypt, { compare } from "bcryptjs";

import {
  IInvitationBody,
  ILoginRequest,
  IUpdateForwarderInfo,
} from "../types/forwarderType";

import { isUsernameAvailable } from "../db/authDBFunctions";

import { handleErrors } from "../middlewares/errorHandlerMiddleware";
import {
  checkBCOExistence,
  checkBCOExistenceForCompany,
  createSupplier,
  deleteSupplierData,
  findSupplierByCompany,
  findSupplierById,
  getBCO,
  getListOfBCO,
  getPaginatedBCOList,
  getPaginatedSupplierData,
  updateBCO,
  updateBCOWithCompany,
  updateSupplier,
} from "../db/bcoDBFunctions";
import ErrorHandler from "../utils/ErrorHandler";
import {
  createCompany,
  createContact,
  updateCompanyDetails,
  updateContactDetails,
} from "../db/commanDBFunction";
import sendMail from "../utils/sendMail";
import {
  deleteImporterData,
  findImporterById,
} from "../db/forwarderDBFunctions";
import { generateShortId, genrateUniqueUsername } from "../utils/short";
import {
  createUserFunction,
  sendWelcomeMessage,
  updateUserFunction,
} from "./chat.controller";

export const registerBCO = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        password,
        fullName,
        id,
        inviteToken,
        companyName,
        email,
      } = req.body;

      let bcoUser = await checkBCOExistenceForCompany(email, companyName);

      if (bcoUser?.password) {
        return res.status(400).json({
          success: false,
          message: `You are already a user, please signIn!`,
        });
      }

      if (inviteToken && inviteToken !== "") {
        const bcoDetails = verifyInviteToken(inviteToken);

        if (!bcoDetails) {
          return res.status(404).json({
            success: false,
            message: "Invite token expired!",
          });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (!id) {
        const companyDetails = {
          companyName,
        };

        const company = await createCompany(companyDetails);

        const chatId = generateShortId();
        const username = genrateUniqueUsername(email, companyName);

        const user = await prisma.bco.create({
          data: {
            fullName,
            chatId,
            username: username,
            emailAddress: email,
            password: hashedPassword,
            invitedStatus: "Signup",
            company: {
              connect: {
                id: company.id,
              },
            },
            forwarder: {},
          },
        });

        await createUserFunction(chatId, fullName, username, "");
        await sendWelcomeMessage(chatId || "", fullName);

        sendBCOToken(user, 200, "Signup Successfully!", res);
      } else {
        let updatedBCOData = {
          fullName,
          password: hashedPassword,
          invitedStatus: "Accepted",
        };

        const updatedBCO = await updateBCO(id, updatedBCOData);

        sendBCOToken(updatedBCO, 200, "Signup Successfully!", res);
      }
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const loginBCO = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      let existingUser = await checkBCOExistence(email);
      let sendWelcomeMessageFlag = false;

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found, please check your email",
        });
      }

      const passwordMatch = await compare(
        password,
        existingUser.password || ""
      );

      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          message: "Username or password is invalid!",
        });
      }

      if (!existingUser.chatId) {
        const chatId = generateShortId();

        sendWelcomeMessageFlag = true;
        existingUser = {
          ...existingUser,
          chatId,
        };
      }

      if (!existingUser?.username) {
        const username = genrateUniqueUsername(
          existingUser?.emailAddress || "",
          existingUser?.company?.companyName || ""
        );
        existingUser = {
          ...existingUser,
          username,
        };

        sendWelcomeMessageFlag = true;
      }

      if (sendWelcomeMessageFlag) {
        const updatedData = {
          chatId: existingUser?.chatId,
          username: existingUser?.username?.trim().toLocaleLowerCase(),
        };

        const updatedCompanyData = {
          companyName: existingUser?.company?.companyName,
        };

        await updateBCOWithCompany(
          existingUser.id,
          updatedData,
          updatedCompanyData
        );

        await updateUserFunction(
          existingUser?.chatId || "",
          existingUser?.username?.trim().toLocaleLowerCase() || "",
          existingUser?.fullName || "",
          ""
        );

        await sendWelcomeMessage(
          existingUser?.chatId || "",
          existingUser.fullName
        );
      }

      delete (existingUser as { password?: any }).password;

      sendBCOToken(existingUser, 200, "Login successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const logoutBCO = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      res.status(200).json({
        success: true,
        message: "Logged Out successfully",
      });
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const updateBCOProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        fullName,
        physicalAddress,
        businessRegistrationNumber,
        vatNumber,
        companyName,
        phoneNumber,
        username,
      } = req.body as IUpdateForwarderInfo;

      let avatar = "";
      const userId = req.user?.id;

      let user = await getBCO(userId);
      let sendWelcomeMessageFlag = false;

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if the updated username is not empty and is unique
      if (
        username?.trim() !== undefined &&
        username?.trim().toLocaleLowerCase() !==
          user?.username?.trim().toLocaleLowerCase()
      ) {
        const isUsernameUnique = await isUsernameAvailable(
          username?.trim().toLocaleLowerCase()
        );

        if (!isUsernameUnique) {
          return res.status(400).json({
            success: false,
            message:
              "Username is already taken. Please choose a different one.",
          });
        }
      }

      if (!user?.chatId) {
        const chatId = generateShortId();
        sendWelcomeMessageFlag = true;
        user = {
          ...user,
          chatId,
        };
      }

      if (!user?.username && !username) {
        const username = genrateUniqueUsername(
          user?.emailAddress || "",
          user?.company?.companyName || ""
        );

        sendWelcomeMessageFlag = true;
        user = {
          ...user,
          username,
        };
      }

      const updatedData = {
        chatId: user?.chatId,
        fullName: fullName || user?.fullName || undefined,
        username:
          username?.trim().toLocaleLowerCase() ||
          user?.username?.trim().toLocaleLowerCase() ||
          undefined,
        businessRegistrationNumber:
          businessRegistrationNumber || user?.brnCard || undefined,
        vatNumber: vatNumber || user?.vatNumber || undefined,
        physicalAddress: physicalAddress || user?.physicalAddress || undefined,
        phoneNumber: phoneNumber || user?.phoneNumber || undefined,
      };

      await updateUserFunction(
        user?.chatId || "",
        username?.trim().toLocaleLowerCase() ||
          user?.username?.trim().toLocaleLowerCase() ||
          "",
        fullName || user?.fullName || "",
        avatar
      );

      const updatedCompanyData = {
        companyName: companyName || user?.company?.companyName || undefined,
      };

      const updatedUser = await updateBCOWithCompany(
        userId,
        updatedData,
        updatedCompanyData
      );

      delete (updatedUser as { password?: any }).password;

      if (sendWelcomeMessageFlag) {
        await sendWelcomeMessage(
          user?.chatId || "",
          fullName || user?.fullName
        );
      }

      sendBCOToken(updatedUser, 200, "Profile Updated successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const getBCODetail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getBCO(req.user?.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found!",
        });
      }

      sendBCOToken(user, 200, "Profile fetched successfully!", res);
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const getBCOBySignupLink = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inviteToken } = req.body;

      if (!inviteToken) {
        return res.status(404).json({
          success: false,
          message: "Invalid Invite link.",
        });
      }
      const bcoDetails = verifyInviteToken(inviteToken);

      if (!bcoDetails) {
        return res.status(404).json({
          success: false,
          message: "Invalid Invite link.",
        });
      }

      res.status(200).json({
        success: true,
        message: `BCO details fetched!`,
        data: bcoDetails,
      });
    } catch (error) {
      handleErrors(error as Error, req, res, next);
    }
  }
);

export const fetchDashboardData = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { records, totalCount } = await getPaginatedSupplierData(req);

      res.status(200).json({
        success: true,
        message: "Supplier fetched successfully!",
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

export const addSupplier = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contactPerson, companyDetails } = req.body;
      const userId = req.user?.id;

      const bcoDetail = await getBCO(userId);

      if (!bcoDetail) {
        return next(new ErrorHandler("BCO not found", 404));
      }

      const isCompanyExist = await findSupplierByCompany(
        userId,
        companyDetails.companyName.trim(),
        "",
        false
      );

      if (isCompanyExist.length) {
        return res.status(400).json({
          success: false,
          message: `This company name is already in use!`,
        });
      }

      let updatedCompanyDetails = { ...companyDetails };
      delete updatedCompanyDetails.port;
      delete updatedCompanyDetails.product;

      const company = await createCompany(updatedCompanyDetails);

      const contact = await createContact(contactPerson, company.id);

      await createSupplier(
        contactPerson.fullName,
        contact.emailAddress,
        companyDetails.product,
        companyDetails.port,
        bcoDetail.id,
        contact.id,
        company.id
      );

      const { records, totalCount } = await getPaginatedSupplierData(req);

      res.status(200).json({
        success: true,
        message: "Supplier created successfully!",
        data: {
          records,
          totalCount,
        },
      });
    } catch (error) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  }
);

export const inviteSupplier = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, companyName, id } = req.body;
      const userId = req.user?.id;
      const bcoDetails = await getBCO(userId);

      if (!bcoDetails) {
        return next(new ErrorHandler("ForwarderAdmin not found", 404));
      }

      const inviteToken = generateUniqueInviteToken({
        id,
        email,
        companyName,
        fullName,
      });

      const signupLink = `${process.env.FRONTEND_URL}/auth/bco/signup?invite=${inviteToken}`;

      const invitationData: IInvitationBody = {
        invitedName: fullName || null,
        inviterFullName: bcoDetails.fullName!,
        inviterCompanyName: companyName,
        signupLink,
      };

      await sendMail({
        email: email,
        subject: "KARGO Supplier Invitation Email",
        template: "invite-mail.ejs",
        data: invitationData,
      });

      const { records, totalCount } = await getPaginatedSupplierData(req);

      res.status(200).json({
        success: true,
        message: "Please check your email: Invite sent to your account!",
        data: {
          records,
          totalCount,
        },
      });
    } catch (error) {
      return next(new ErrorHandler((error as Error).message, 400));
    }
  }
);

export const deleteSupplier = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supplierId = req.body.dataId;

      const importer = await findSupplierById(supplierId);

      if (!importer) {
        return next(new ErrorHandler("Supplier not found", 404));
      }

      await deleteSupplierData(supplierId);

      const { records, totalCount } = await getPaginatedSupplierData(req);

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

export const editSupplier = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { supplierId } = req.params;

      const userId = req.user?.id;
      const { contactPerson, companyDetails } = req.body;

      const existingSupplier = await findSupplierById(parseInt(supplierId));

      if (!existingSupplier) {
        return next(new ErrorHandler("Supplier not found", 404));
      }

      const isCompanyExist = await findSupplierByCompany(
        userId,
        companyDetails.companyName.trim(),
        supplierId,
        true
      );

      if (isCompanyExist.length) {
        return res.status(400).json({
          success: false,
          message: `This company name is already in use!`,
        });
      }

      let updatedCompanyDetails = { ...companyDetails };
      delete updatedCompanyDetails.port;
      delete updatedCompanyDetails.product;

      // Step 2: Update the company details
      await updateCompanyDetails(
        existingSupplier.companyId!,
        updatedCompanyDetails
      );

      // Step 3: Update the contact details
      await updateContactDetails(
        existingSupplier.contactId!,
        contactPerson,
        existingSupplier.companyId!
      );

      let updatedData = {
        port: companyDetails.port,
        product: companyDetails.product,
      };

      await updateSupplier(existingSupplier.id, updatedData);

      const { records, totalCount } = await getPaginatedSupplierData(req);

      res.status(200).json({
        success: true,
        message: "Supplier updated successfully!",
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

export const fetchBcoList = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { records, totalCount } = await getPaginatedBCOList(req);

      res.status(200).json({
        success: true,
        message: "BCO list fetched successfully!",
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

export const deleteBCO = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const importerId = req.body.dataId;

      const importer = await findImporterById(importerId);

      if (!importer) {
        return next(new ErrorHandler("BCO not found", 404));
      }

      await deleteImporterData(importerId);

      const { records, totalCount } = await getPaginatedBCOList(req);

      res.status(200).json({
        success: true,
        message: "BCO Deleted Successfully!",
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
