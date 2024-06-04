require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";

import { StreamChat } from "stream-chat";

const GETSTREAM_API_SECRET = process.env.GETSTREAM_API_SECRET || "";
const GETSTREAM_API_KEY = process.env.GETSTREAM_API_KEY || "";

const client = StreamChat.getInstance(GETSTREAM_API_KEY, GETSTREAM_API_SECRET, {
  timeout: 6000,
});

export const getPreviousMessage = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId;
      const channel = client.channel(channelId);
      const messages = await channel.query({ messages: { limit: 100 } });

      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  }
);

export const listOfUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(400)
          .json({ error: "User ID is missing in the request." });
      }

      if (!client) {
        return res
          .status(500)
          .json({ error: "Stream Chat client is undefined." });
      }

      const { users } = await client.queryUsers({ id: { $in: [userId] } });

      if (!users.length) {
        return res
          .status(404)
          .json({ error: "User not found in Stream Chat." });
      }

      const user = users[0];
      const channels = await user.channels();

      const formattedChannels = channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
      }));

      return res.json(formattedChannels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to get chats" });
    }
  }
);

export const startNewChat = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res
          .status(400)
          .json({ error: "User ID is missing in the request." });
      }

      const currentUser = await client.user(currentUserId);

      const channel = await currentUser.createChannel({
        name: `${currentUserId}-${userId}`,
        members: [currentUserId, userId],
      });

      res.json({ channel });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  }
);

export const generateToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res
          .status(400)
          .json({ error: "Missing required field: userId" });
      }

      const token = client.createToken(userId);
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  }
);

export const sendMessage = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, targetUser, message } = req.body;

      // Create a unique channel ID from the two usernames
      const channelID = [username, targetUser].sort().join("-");

      // Retrieve the channel
      const channel = client.channel("messaging", channelID);

      // Send the message
      const response = await channel.sendMessage({
        text: message,
        user: { id: username },
      });

      res.json({ message: response.message });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

export const createChat = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, targetUser } = req.body;

      // Create a unique channel ID from the two usernames
      const channelID = [username, targetUser].sort().join("-");

      // Create the users if they don't exist
      await client.upsertUsers([
        {
          id: username,
        },
        { id: targetUser },
      ]);

      // Create or retrieve the channel
      const channel = client.channel("messaging", channelID, {
        members: [username, targetUser],
        created_by: { id: username },
      });

      await channel.create();

      // Retrieve the channel's state
      const state = await channel.query({});

      // Extract the messages from the channel's state
      const messages = state.messages;

      res.json({ channelId: channel.id, messages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  }
);

export const getAllUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page: number = Number(req.query.page) || 1;
      const limit: number = Number(req.query.limit) || 10;
      const offset: number = (page - 1) * limit || 0;

      const { users } = await client.queryUsers({});

      return res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export const sendMessageToChannel = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, targetUser, message } = req.body;

      // Create a unique channel ID from the two usernames
      const channelID = [userId, targetUser].sort().join("-");

      if (!channelID || !message || !userId) {
        return res.status(400).json({
          error: "Missing required fields: channelId, text, or userId",
        });
      }

      const channel = client.channel("messaging", channelID);
      await channel.sendMessage({
        text: message,
        user_id: userId,
      });
      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

export const addMemberToChannel = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId, members } = req.body;

      if (!channelId || !members) {
        return res
          .status(400)
          .json({ error: "Missing required fields: channelId or members" });
      }

      const channel = client.channel("messaging", channelId);
      await channel.addMembers(members);
      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add members to channel" });
    }
  }
);

export const createUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, userId, avatar, name } = req.body;

      if (!username) {
        return res
          .status(400)
          .json({ error: "Missing required field: username" });
      }

      await createUserFunction(userId, name, username, avatar);

      res.json({
        success: true,
        message: `User ${username} created/updated successfully`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create/update user" });
    }
  }
);

export const updateUserController = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, name, username, avatar } = req.body;

      if (!userId) {
        return res
          .status(400)
          .json({ error: "Missing required field: userId" });
      }

      // Get the existing user data
      const { users } = await client.queryUsers({ id: { $in: [userId] } });

      if (!users.length) {
        return res
          .status(404)
          .json({ error: "User not found in Stream Chat." });
      }

      const existingUser = users[0];

      const updateResponse = await updateUserFunction(
        userId,
        username || existingUser.username,
        name || existingUser.name,
        avatar || existingUser.avatar
      );

      res.json({
        success: true,
        message: `User ${userId} updated successfully`,
        data: updateResponse,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

export const createUserFunction = async (
  userId: string,
  name: string,
  username: string,
  avatar: string
) => {
  await client.upsertUsers([
    {
      id: userId,
      name: name || "",
      username: username || "",
      avatar: avatar || "",
    },
  ]);
};

export const updateUserFunction = async (
  id: string,
  username: string,
  name: string,
  avatar: string
) => {
  const updateResponse = await client.upsertUser({
    id: id,
    name: name,
    username: username,
    avatar: avatar,
  });

  return updateResponse;
};

export const generateChatToken = (chatId: string) => {
  return client.createToken(chatId);
};

export const sendWelcomeMessage = async (chatId: string, userName: string) => {
  const welcomeUser = "first-chat";

  const channelID = [welcomeUser, chatId].sort().join("-");

  await client.upsertUsers([
    {
      id: welcomeUser,
    },
    { id: chatId },
  ]);

  const channel = client.channel("messaging", channelID, {
    members: [welcomeUser, chatId],
    created_by: { id: welcomeUser },
  });
  await channel.create();

  await channel.sendMessage({
    text: `Welcome to the chat, ${userName}! Feel free to start your conversation.`,
    user_id: welcomeUser,
  });
};
