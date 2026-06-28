import cron from 'node-cron';
import { prisma } from '../prisma/client';
import { sendReminderEmail } from '../utils/mail';
import logger from '../utils/logger';

const STALE_DAYS = 7;

const sendFollowUpReminders = async () => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - STALE_DAYS);

  const usersWithStale = await prisma.user.findMany({
    where: { emailReminders: true },
    select: {
      id: true,
      name: true,
      email: true,
      applications: {
        where: {
          status: 'Applied',
          applicationDate: { lte: threshold },
        },
        select: {
          company: true,
          position: true,
          applicationDate: true,
        },
      },
    },
  });

  let sent = 0;
  for (const user of usersWithStale) {
    if (user.applications.length === 0) continue;
    try {
      await sendReminderEmail(user.email, user.name, user.applications);
      sent++;
      logger.info({ userId: user.id, count: user.applications.length }, 'Reminder sent');
    } catch (err) {
      logger.error({ userId: user.id, err }, 'Failed to send reminder');
    }
  }

  logger.info({ sent, total: usersWithStale.length }, 'Follow-up reminder job finished');
};

export const startReminderCron = () => {
  // Runs daily at 09:00 server time
  cron.schedule('0 9 * * *', sendFollowUpReminders, { timezone: 'Europe/Madrid' });
  logger.info('Follow-up reminder cron scheduled (09:00 Europe/Madrid)');
};
