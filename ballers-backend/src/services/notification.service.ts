import prisma from '../config/database';

export const getNotifications = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });

  return notifications;
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');
  if (notification.user_id !== userId) throw new Error('FORBIDDEN');

  await prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true },
  });

  return { message: 'Notification marked as read.' };
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });

  return { message: 'All notifications marked as read.' };
};

export const deleteNotification = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');
  if (notification.user_id !== userId) throw new Error('FORBIDDEN');

  await prisma.notification.delete({ where: { id: notificationId } });

  return { message: 'Notification deleted.' };
};
