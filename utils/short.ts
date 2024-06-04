import { isChbUsernameAvailable } from "../db/chbDBFunctions";

const short = require("short-uuid");

export const generateShortId = () => {
  return short.generate();
};

export const genrateUniqueUsername = (
  email: string,
  companyName: string
): string => {
  const emailUsername = email.split("@")[0].replace(/\W/g, "");
  const companyUsername = companyName.replace(/\W/g, "");

  let username = `${emailUsername}_${companyUsername}`;
  return username.trim().toLocaleLowerCase();
};
