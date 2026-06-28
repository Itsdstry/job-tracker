import { prismaMock } from '../singleton';
import { sendFollowUpReminders } from '../../services/reminder.service';
import * as mail from '../../utils/mail';

jest.mock('../../utils/mail', () => ({
  sendReminderEmail: jest.fn().mockResolvedValue(true),
}));

const NOW = new Date('2024-04-10T09:00:00Z');
const EIGHT_DAYS_AGO = new Date('2024-04-02T09:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('sendFollowUpReminders', () => {
  it('sends reminder when user has stale Applied applications', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        applications: [
          { company: 'Acme', position: 'Engineer', applicationDate: EIGHT_DAYS_AGO },
        ],
      } as any,
    ]);

    await sendFollowUpReminders();

    expect(mail.sendReminderEmail).toHaveBeenCalledTimes(1);
    expect(mail.sendReminderEmail).toHaveBeenCalledWith(
      'alice@example.com',
      'Alice',
      expect.arrayContaining([expect.objectContaining({ company: 'Acme' })]),
    );
  });

  it('skips users with no stale applications', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        applications: [],
      } as any,
    ]);

    await sendFollowUpReminders();

    expect(mail.sendReminderEmail).not.toHaveBeenCalled();
  });

  it('continues processing other users when one email fails', async () => {
    (mail.sendReminderEmail as jest.Mock)
      .mockRejectedValueOnce(new Error('SMTP error'))
      .mockResolvedValueOnce(true);

    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        applications: [{ company: 'Acme', position: 'Engineer', applicationDate: EIGHT_DAYS_AGO }],
      } as any,
      {
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        applications: [{ company: 'Beta', position: 'Designer', applicationDate: EIGHT_DAYS_AGO }],
      } as any,
    ]);

    await expect(sendFollowUpReminders()).resolves.not.toThrow();
    expect(mail.sendReminderEmail).toHaveBeenCalledTimes(2);
  });

  it('queries only users with emailReminders enabled', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await sendFollowUpReminders();

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ emailReminders: true }),
      }),
    );
  });

  it('filters applications by Applied status and date threshold', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await sendFollowUpReminders();

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          applications: expect.objectContaining({
            where: expect.objectContaining({
              status: 'Applied',
              applicationDate: expect.objectContaining({ lte: expect.any(Date) }),
            }),
          }),
        }),
      }),
    );
  });
});
