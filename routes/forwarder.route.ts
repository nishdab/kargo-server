import express from "express";
import {
  addImporter,
  dashboardData,
  deleteImporter,
  inviteImporter,
  editImporter,
} from "../controllers/forwarder.controller";
import { isAuthenticated } from "../middlewares/auth";
import {
  addImporterValidator,
  deleteImporterValidator,
  editImporterValidator,
  inviteImporterValidator,
} from "../validations/forwarderValidations";
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import {
  addCalendarEvent,
  deleteCalendarEvents,
  getCalendarEvents,
} from "../controllers/calendar.Controller";

const dashboardRouter = express.Router();

dashboardRouter.get("/forwarder", isAuthenticated, dashboardData);
dashboardRouter.post(
  "/forwarder/add-importer",
  isAuthenticated,
  addImporterValidator,
  handleValidationErrors,
  addImporter
);
dashboardRouter.delete(
  "/forwarder/delete-importer",
  isAuthenticated,
  deleteImporterValidator,
  handleValidationErrors,
  deleteImporter
);
dashboardRouter.put(
  "/forwarder/edit-importer/:importerId",
  isAuthenticated,
  editImporterValidator,
  handleValidationErrors,
  editImporter
);
dashboardRouter.post(
  "/forwarder/invite-importer",
  isAuthenticated,
  inviteImporterValidator,
  handleValidationErrors,
  inviteImporter
);

dashboardRouter.post(
  "/forwarder/add-calendar-event",
  isAuthenticated,
  addCalendarEvent
);

dashboardRouter.delete(
  "/forwarder/delete-calendar-event",
  isAuthenticated,
  deleteCalendarEvents
);

dashboardRouter.post(
  "/forwarder/get-calendar-event",
  isAuthenticated,
  getCalendarEvents
);

export default dashboardRouter;
