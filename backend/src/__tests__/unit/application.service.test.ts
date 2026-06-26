import { prismaMock } from '../singleton';
import * as applicationService from '../../services/application.service';
import { ApplicationStatus } from '@prisma/client';

const BASE_APP = {
  id: 'app-1',
  company: 'Acme Corp',
  position: 'Software Engineer',
  status: 'Applied' as ApplicationStatus,
  salary: 80000,
  location: 'Madrid',
  notes: 'Nice company',
  applicationDate: new Date('2024-03-01'),
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
  userId: 'user-1',
};

describe('ApplicationService', () => {
  describe('createApplication', () => {
    it('creates application using the provided date', async () => {
      prismaMock.application.create.mockResolvedValue(BASE_APP as any);

      const result = await applicationService.createApplication('user-1', {
        company: 'Acme Corp',
        position: 'Software Engineer',
        applicationDate: '2024-03-01',
      });

      expect(result.company).toBe('Acme Corp');
      expect(prismaMock.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationDate: new Date('2024-03-01'),
            userId: 'user-1',
          }),
        })
      );
    });

    it('defaults applicationDate to today when not provided', async () => {
      prismaMock.application.create.mockResolvedValue(BASE_APP as any);
      const before = new Date();

      await applicationService.createApplication('user-1', {
        company: 'Acme Corp',
        position: 'Developer',
      });

      const after = new Date();
      const callArg = (prismaMock.application.create as jest.Mock).mock.calls[0][0];
      const date: Date = callArg.data.applicationDate;
      expect(date.getTime()).toBeGreaterThanOrEqual(before.getTime() - 50);
      expect(date.getTime()).toBeLessThanOrEqual(after.getTime() + 50);
    });
  });

  describe('listApplications', () => {
    beforeEach(() => {
      prismaMock.application.findMany.mockResolvedValue([BASE_APP as any]);
      prismaMock.application.count.mockResolvedValue(1);
    });

    it('returns paginated results with default values', async () => {
      const result = await applicationService.listApplications('user-1', {});

      expect(result.applications).toHaveLength(1);
      expect(result.pagination).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('calculates totalPages correctly across multiple pages', async () => {
      prismaMock.application.count.mockResolvedValue(45);

      const result = await applicationService.listApplications('user-1', { limit: 20, page: 1 });

      expect(result.pagination.totalPages).toBe(3);
    });

    it('passes status filter to the query', async () => {
      await applicationService.listApplications('user-1', { status: 'Interview' as ApplicationStatus });

      expect(prismaMock.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'Interview' }),
        })
      );
    });

    it('passes search filter across company, position, and location', async () => {
      await applicationService.listApplications('user-1', { search: 'engineer' });

      expect(prismaMock.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ company: expect.objectContaining({ contains: 'engineer' }) }),
              expect.objectContaining({ position: expect.objectContaining({ contains: 'engineer' }) }),
            ]),
          }),
        })
      );
    });

    it('falls back to createdAt when sortBy field is invalid', async () => {
      await applicationService.listApplications('user-1', { sortBy: 'invalidField' });

      expect(prismaMock.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });

    it('uses a valid sortBy field and order', async () => {
      await applicationService.listApplications('user-1', { sortBy: 'salary', order: 'asc' });

      expect(prismaMock.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { salary: 'asc' } })
      );
    });

    it('applies correct skip offset for pagination', async () => {
      prismaMock.application.count.mockResolvedValue(60);

      await applicationService.listApplications('user-1', { page: 3, limit: 10 });

      expect(prismaMock.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });
  });

  describe('exportApplications', () => {
    it('returns CSV with correct headers and a data row', async () => {
      prismaMock.application.findMany.mockResolvedValue([BASE_APP as any]);

      const csv = await applicationService.exportApplications('user-1', {});
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Company,Position,Status,Salary,Location,Application Date,Notes,Created At');
      expect(lines[1]).toContain('"Acme Corp"');
      expect(lines[1]).toContain('"Software Engineer"');
    });

    it('replaces null optional fields with empty strings', async () => {
      const appWithNulls = { ...BASE_APP, salary: null, location: null, notes: null };
      prismaMock.application.findMany.mockResolvedValue([appWithNulls as any]);

      const csv = await applicationService.exportApplications('user-1', {});
      const dataRow = csv.split('\n')[1];

      expect(dataRow).toContain('""');
    });

    it('escapes double quotes inside field values', async () => {
      const appWithQuotes = { ...BASE_APP, notes: 'Said "good job" in interview' };
      prismaMock.application.findMany.mockResolvedValue([appWithQuotes as any]);

      const csv = await applicationService.exportApplications('user-1', {});

      expect(csv).toContain('"Said ""good job"" in interview"');
    });
  });

  describe('getApplicationById', () => {
    it('returns the application when it belongs to the user', async () => {
      prismaMock.application.findFirst.mockResolvedValue(BASE_APP as any);

      const result = await applicationService.getApplicationById('user-1', 'app-1');

      expect(result.id).toBe('app-1');
      expect(prismaMock.application.findFirst).toHaveBeenCalledWith({
        where: { id: 'app-1', userId: 'user-1' },
      });
    });

    it('throws 404 when application is not found', async () => {
      prismaMock.application.findFirst.mockResolvedValue(null);

      await expect(
        applicationService.getApplicationById('user-1', 'nonexistent')
      ).rejects.toMatchObject({ statusCode: 404, message: 'Application not found' });
    });
  });

  describe('updateApplication', () => {
    it('updates application fields successfully', async () => {
      const updated = { ...BASE_APP, position: 'Senior Engineer' };
      prismaMock.application.findFirst.mockResolvedValue(BASE_APP as any);
      prismaMock.application.update.mockResolvedValue(updated as any);

      const result = await applicationService.updateApplication('user-1', 'app-1', {
        position: 'Senior Engineer',
      });

      expect(result.position).toBe('Senior Engineer');
    });

    it('converts applicationDate string to a Date object', async () => {
      prismaMock.application.findFirst.mockResolvedValue(BASE_APP as any);
      prismaMock.application.update.mockResolvedValue(BASE_APP as any);

      await applicationService.updateApplication('user-1', 'app-1', {
        applicationDate: '2025-06-01',
      });

      expect(prismaMock.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ applicationDate: new Date('2025-06-01') }),
        })
      );
    });

    it('throws 404 when application is not found', async () => {
      prismaMock.application.findFirst.mockResolvedValue(null);

      await expect(
        applicationService.updateApplication('user-1', 'nonexistent', { position: 'Dev' })
      ).rejects.toMatchObject({ statusCode: 404, message: 'Application not found' });
    });
  });

  describe('deleteApplication', () => {
    it('deletes the application by id', async () => {
      prismaMock.application.findFirst.mockResolvedValue(BASE_APP as any);
      prismaMock.application.delete.mockResolvedValue(BASE_APP as any);

      await applicationService.deleteApplication('user-1', 'app-1');

      expect(prismaMock.application.delete).toHaveBeenCalledWith({ where: { id: 'app-1' } });
    });

    it('throws 404 when application is not found', async () => {
      prismaMock.application.findFirst.mockResolvedValue(null);

      await expect(
        applicationService.deleteApplication('user-1', 'nonexistent')
      ).rejects.toMatchObject({ statusCode: 404, message: 'Application not found' });
    });
  });
});
