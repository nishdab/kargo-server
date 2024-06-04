import prisma from "../db/db.config";

export const createCalendarEvent = async (event: any) => {
  const createdEvent = await prisma.calendarEvent.create({
    data: { ...event },
  });
  return createdEvent;
};

export const getAllCalendarEvents = async (data: object) => {
  const calendarEvents = await prisma.calendarEvent.findMany({
    where: data,
    select: {
      id: true,
      allDay: true,
      start: true,
      end: true,
      title: true,
      eventDetails: true,
    },
  });
  return calendarEvents;
};

export const deleteCalendarEvent = async (calendarId: string) => {
  const calendarEvents = await prisma.calendarEvent.deleteMany({
    where: { id: calendarId },
  });

  return calendarEvents;
};
export const findCalendarById = async (calendarId: string) => {
  const calendarEvent = await prisma.calendarEvent.findUnique({
    where: {
      id: calendarId,
    },
  });
  return calendarEvent;
};
