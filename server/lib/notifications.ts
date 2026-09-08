import { PrismaClient } from '@prisma/client';
import { enqueueEmail } from './emailQueue';

const prisma = new PrismaClient();

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  emailTemplate?: string;
  emailPayload?: Record<string, unknown>;
};

export async function createNotification(input: NotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data as any,
    },
  });

  if (input.emailTemplate) {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId: input.userId, type: input.type } },
    });
    if (pref?.email !== false) {
      const profile = await prisma.profile.findUnique({ where: { id: input.userId }, select: { email: true } });
      if (profile?.email) {
        await enqueueEmail(profile.email, input.emailTemplate, input.emailPayload ?? input.data ?? {});
      }
    }
  }

  return notification;
}

export async function createNotifications(inputs: NotificationInput[]) {
  const results = [];
  for (const input of inputs) results.push(await createNotification(input));
  return results;
}
