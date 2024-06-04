export interface IChbBody {
    id?: number;
    fullName: string;
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
    customsRegistrationNumber: string | null;
    vatNumber: string | null;
    kargoAccountNumber: number | null;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface IUpdateChbInfo {
    companyName?: string;
    physicalAddress?: string;
    businessRegistrationNumber?: string;
    customsRegistrationNumber?: string;
    vatNumber?: string;
    fullName?: string;
    kargoAccountNumber?: string;
    phoneNumber?: string;
    username?: string;
  }