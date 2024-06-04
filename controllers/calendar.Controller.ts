import { NextFunction, Request, Response } from "express";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  findCalendarById,
  getAllCalendarEvents,
} from "../db/calendarDBFunctions";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../middlewares/errorHandlerMiddleware";

export const addCalendarEvent = CatchAsyncError(
  async (req: Request, res: Response) => {
    try {
      let { event } = req.body;

      let userInfo = event.userInfo;

      let createdReq = { ...event };

      delete createdReq.userInfo;

      await createCalendarEvent(createdReq);

      const calendarEvents = await getAllCalendarEvents(userInfo);

      res.status(200).json({
        success: true,
        message: "Calendar added successfully!",
        data: calendarEvents,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export const getCalendarEvents = CatchAsyncError(
  async (req: Request, res: Response) => {
    try {
      if (!req.body) {
        return res.status(200).json({
          success: true,
          message: "No Data Found!",
          data: [],
        });
      }
      const calendarEvents = await getAllCalendarEvents(req.body);

      res.status(200).json({
        success: true,
        message: "Calendar events fetched successfully!",
        data: calendarEvents,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export const deleteCalendarEvents = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { calendarId, userInfo } = req.body;

      const event = await findCalendarById(calendarId);

      if (!event) {
        return next(new ErrorHandler("Event not found", 404));
      }

      await deleteCalendarEvent(calendarId);

      const calendarEvents = await getAllCalendarEvents(userInfo);

      res.status(200).json({
        success: true,
        message: "Calendar event deleted successfully!",
        data: calendarEvents,
      });
    } catch (error) {
      return next(new ErrorHandler((error as Error).message, 500));
    }
  }
);
