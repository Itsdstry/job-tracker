import logger from './utils/logger';
import app from './app';
import { startReminderCron } from './services/reminder.service';
import { startRemotiveSyncCron } from './services/remotive-sync.service';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
  if (process.env.NODE_ENV !== 'test') {
    startReminderCron();
    startRemotiveSyncCron();
  }
});
