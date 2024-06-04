export interface IForwarderAdmin {
  id?: number;
  fullName: string;
  chatId: string;
  email: string;
  password?: string | null;
  accessToken: string;
  refreshToken: string;
  role: string;
  companyName: string;
  physicalAddress?: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  avatar?: string | null;
  businessRegistrationNumber: string | null;
  vatNumber: string | null;
  kargoAccountNumber: number | null;
  bco?: IBco[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the Bco interface
export interface IBco {
  id?: number;
  forwarder: IForwarderAdmin; // Use the interface as a relation
  forwarderId: number;
  companyName: string;
  physicalAddress: string;
  comment_count: number;
  created_at?: Date;
  contactPerson: IContactPerson[];
  brnCard?: string | null;
  vatNumber?: string | null;
  emailAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the ContactPerson interface
export interface IContactPerson {
  id?: number;
  bco: IBco; // Use the interface as a relation
  bcoId: number;
  name: string;
  email: string;
  phone: string;
}
export interface IRegistrationBody {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
}

export interface ICHBRegistrationBody {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  username: string;
  chatId: string;
}
export interface IActivationToken {
  token: string;
  activationCode: string;
}

export interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IUpdateForwarderInfo {
  companyName?: string;
  physicalAddress?: string;
  businessRegistrationNumber?: string;
  vatNumber?: string;
  fullName?: string;
  kargoAccountNumber?: string;
  phoneNumber?: string;
  username?: string;
}

export interface IResendRequest {
  activation_token: string;
}

export interface IInvitationBody {
  invitedName: string;
  inviterFullName: string;
  inviterCompanyName: string;
  signupLink: string;
}
