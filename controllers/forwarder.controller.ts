import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import {
  getPaginatedImporterData,
  findForwarderAdmin,
  findImporterByCompany,
  createImporter,
  deleteImporterData,
  findImporterById,
  getPaginatedForwarderList,
  deleteForwarderAdminData,
  findTier,
  addTier,
  addCompnayTier,
  updateCompanyTier,
} from "../db/forwarderDBFunctions";
import { generateUniqueInviteToken } from "../utils/jwt";
import sendMail from "../utils/sendMail";
import { IInvitationBody } from "../types/forwarderType";
import {
  createCompany,
  createContact,
  updateContactDetails,
  updateCompanyDetails,
} from "../db/commanDBFunction";
import { updateBCO } from "../db/bcoDBFunctions";

export const dashboardData = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { records, totalCount } = await getPaginatedImporterData(req);

      res.status(200).json({
        success: true,
        message: "Importer fetched successfully!",
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

export const addImporter = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contactPerson, companyDetails } = req.body;
      const userId = req.user?.id;

      const forwarderAdmin = await findForwarderAdmin(userId);

      if (!forwarderAdmin) {
        return next(new ErrorHandler("ForwarderAdmin not found", 404));
      }

      const isCompanyExist = await findImporterByCompany(
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

      const tierName = contactPerson.tier;
      let tier = await findTier(tierName);

      if (!tier) {
        tier = await addTier(tierName);
      }

      const company = await createCompany(companyDetails);

      const contact = await createContact(contactPerson, company.id);

      await addCompnayTier(company.id, tier.id);

      await createImporter(
        contactPerson.fullName,
        contact.emailAddress,
        forwarderAdmin.id,
        contact.id,
        company.id
      );

      const { records, totalCount } = await getPaginatedImporterData(req);

      res.status(200).json({
        success: true,
        message: "Importer created successfully!",
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

export const inviteImporter = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, companyName, id } = req.body;
      const userId = req.user?.id;
      const forwarderAdmin = await findForwarderAdmin(userId);

      if (!forwarderAdmin) {
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
        inviterFullName: forwarderAdmin.fullName!,
        inviterCompanyName: companyName,
        signupLink,
      };

      await sendMail({
        email: email,
        subject: "KARGO Importer Invitation Email",
        template: "invite-mail.ejs",
        data: invitationData,
      });

      const { records, totalCount } = await getPaginatedImporterData(req);

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

export const deleteImporter = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const importerId = req.body.importerId;

      const importer = await findImporterById(importerId);

      if (!importer) {
        return next(new ErrorHandler("Importer not found", 404));
      }

      await deleteImporterData(importerId);

      const { records, totalCount } = await getPaginatedImporterData(req);

      res.status(200).json({
        success: true,
        message: "Importer deleted successfully!",
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

export const editImporter = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const importerId = req.params.importerId;
      const userId = req.user?.id;
      const { updatedContactPerson } = req.body;

      const existingImporter = await findImporterById(parseInt(importerId));

      if (!existingImporter) {
        return next(new ErrorHandler("Importer not found", 404));
      }

      const isCompanyExist = await findImporterByCompany(
        userId,
        req.body.updatedCompanyDetails.companyName.trim(),
        importerId,
        true
      );

      if (isCompanyExist.length) {
        return res.status(400).json({
          success: false,
          message: `This company name is already in use!`,
        });
      }

      // Step 2: Update the company details
      await updateCompanyDetails(
        existingImporter.companyId!,
        req.body.updatedCompanyDetails
      );

      // Step 3: Update the contact details
      await updateContactDetails(
        existingImporter.contactId!,
        updatedContactPerson,
        existingImporter.companyId!
      );

      // Step 4: Update the tier information
      await updateCompanyTier(
        existingImporter.companyId!,
        updatedContactPerson.tier
      );

      const updatedBCO = {
        fullName: updatedContactPerson.fullName,
        emailAddress: updatedContactPerson.email,
      };

      await updateBCO(existingImporter.id, updatedBCO);

      const { records, totalCount } = await getPaginatedImporterData(req);

      res.status(200).json({
        success: true,
        message: "Importer updated successfully!",
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

export const deleteForwarderAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataId = req.body.dataId;

      const forwarder = await findForwarderAdmin(dataId);

      if (!forwarder) {
        return next(new ErrorHandler("Forwarder Admin not found", 404));
      }

      await deleteForwarderAdminData(dataId);

      const { records, totalCount } = await getPaginatedForwarderList(req);

      res.status(200).json({
        success: true,
        message: "Forwarder Admin deleted successfully!",
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

export const fetchForwardAdminList = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { records, totalCount } = await getPaginatedForwarderList(req);

      res.status(200).json({
        success: true,
        message: "Forwarder Admin list fetched successfully!",
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
