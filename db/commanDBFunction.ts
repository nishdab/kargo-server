import prisma from "./db.config";

export const createCompany = async (companyDetails: any) => {
  return prisma.company.create({
    data: {
      companyName: companyDetails.companyName.trim(),
      registeredAddress: companyDetails.registeredAddress || null,
      businessRegistrationNumber:
        companyDetails.businessRegistrationNumber || null,
      vatNumber: companyDetails.vatNumber || null,
      unlocodeRegisteredAddress:
        companyDetails.unlocodeRegisteredAddress || null,
      warehouseAddresses: {
        create: {
          addressLine1: companyDetails.addressLine1 || null,
          addressLine2: companyDetails.addressLine2 || "",
          cityCountry: companyDetails.cityCountry,
          unlocodeWarehouseAddress:
            companyDetails?.unlocodeWarehouseAddress || "",
        },
      },
    },
  });
};

export const createContact = async (contactPerson: any, companyId: number) => {
  return prisma.contact.create({
    data: {
      contactName: contactPerson.fullName,
      emailAddress: contactPerson.email,
      phoneNumber: contactPerson.phoneNumber,
      status: contactPerson.status,
      company: {
        connect: {
          id: companyId,
        },
      },
      accountReference: contactPerson.accountReference || null,
      apiCustomerCode: contactPerson.apiCustomerCode || null,
    },
  });
};

export const updateCompanyDetails = async (
  companyId: number,
  updatedCompanyDetails: any
) => {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      companyName: updatedCompanyDetails.companyName.trim(),
      registeredAddress: updatedCompanyDetails.registeredAddress,
      businessRegistrationNumber:
        updatedCompanyDetails.businessRegistrationNumber || null,
      vatNumber: updatedCompanyDetails.vatNumber || null,
      unlocodeRegisteredAddress:
        updatedCompanyDetails.unlocodeRegisteredAddress || null,
      warehouseAddresses: {
        update: {
          where: {
            id: companyId,
          },
          data: {
            addressLine1: updatedCompanyDetails.addressLine1,
            addressLine2: updatedCompanyDetails.addressLine2 || "",
            cityCountry: updatedCompanyDetails.cityCountry,
          },
        },
      },
    },
  });
};

export const updateContactDetails = async (
  contactId: number,
  updatedContactPerson: any,
  companyId: number
) => {
  return prisma.contact.update({
    where: { id: contactId },
    data: {
      contactName: updatedContactPerson.fullName,
      emailAddress: updatedContactPerson.email,
      phoneNumber: updatedContactPerson.phoneNumber,
      status: updatedContactPerson.status,
      company: {
        connect: {
          id: companyId,
        },
      },
      accountReference: updatedContactPerson.accountReference || null,
      apiCustomerCode: updatedContactPerson.apiCustomerCode || null,
    },
  });
};
