import express from "express";
import { isAuthenticated } from "../middlewares/auth";
import {
  generateToken,
  addMemberToChannel,
  sendMessageToChannel,
  getAllUser,
  createChat,
  sendMessage,
  createUser,
  updateUserController,
} from "../controllers/chat.controller";

const chatRouter = express.Router();

chatRouter.post("/chat/generate-token", isAuthenticated, generateToken);

chatRouter.post("/chat/create-user", isAuthenticated, createUser);
chatRouter.post("/chat/update-user", isAuthenticated, updateUserController);

chatRouter.post(
  "/chat/add-members-to-channel",
  isAuthenticated,
  addMemberToChannel
);

chatRouter.post(
  "/chat/send-message-to-channel",
  isAuthenticated,
  sendMessageToChannel
);

chatRouter.post("/chat/users", isAuthenticated, getAllUser);

chatRouter.post("/chat/create-chat", isAuthenticated, createChat);

chatRouter.post("/chat/send-message", isAuthenticated, sendMessage);

export default chatRouter;
