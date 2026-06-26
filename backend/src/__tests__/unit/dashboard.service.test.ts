import { prismaMock } from '../singleton';
import * as dashboardService from '../../services/dashboard.service';

const makeApp = (overrides: Record<string, unknown> = {}) => ({
  applicationDate: new Date(),
  status: 'Applied',
  company: 'Acme',
  salary: null,
  ...overrides,
});

describe('DashboardService', () => {
  describe('getStats', () => {
    it('returns all zeros when no applications exist', async () => {
      prismaMock.application.count.mockResolvedValue(0);

      const stats = await dashboardService.getStats('user-1');

      expect(stats).toEqual({
        total: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
        technicalTests: 0,
        interviewRate: 0,
        offerRate: 0,
      });
    });

    it('calculates interview and offer rates correctly', async () => {
      // Promise.all order: total, interviews, offers, rejected, technicalTests
      prismaMock.application.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(2);

      const stats = await dashboardService.getStats('user-1');

      expect(stats.total).toBe(10);
      expect(stats.interviews).toBe(3);
      expect(stats.offers).toBe(1);
      expect(stats.interviewRate).toBe(30); // 3/10 * 100
      expect(stats.offerRate).toBe(10);     // 1/10 * 100
    });

    it('returns 0 rates when total is 0 to avoid division by zero', async () => {
      prismaMock.application.count.mockResolvedValue(0);

      const { interviewRate, offerRate } = await dashboardService.getStats('user-1');

      expect(interviewRate).toBe(0);
      expect(offerRate).toBe(0);
    });
  });

  describe('getCharts', () => {
    it('always returns exactly 12 entries in monthlyApplications', async () => {
      prismaMock.application.findMany.mockResolvedValue([]);

      const { monthlyApplications } = await dashboardService.getCharts('user-1');

      expect(monthlyApplications).toHaveLength(12);
    });

    it('counts an application in the correct month bucket', async () => {
      const now = new Date();
      prismaMock.application.findMany.mockResolvedValue([makeApp({ applicationDate: now }) as any]);

      const { monthlyApplications } = await dashboardService.getCharts('user-1');

      const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyApplications.find((m) => m.month === currentKey);
      expect(entry?.count).toBe(1);
    });

    it('ignores applications older than 12 months', async () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      prismaMock.application.findMany.mockResolvedValue([makeApp({ applicationDate: twoYearsAgo }) as any]);

      const { monthlyApplications } = await dashboardService.getCharts('user-1');

      const total = monthlyApplications.reduce((sum, m) => sum + m.count, 0);
      expect(total).toBe(0);
    });

    it('initialises all statuses to 0 and counts them correctly', async () => {
      const apps = [
        makeApp({ status: 'Applied' }),
        makeApp({ status: 'Applied' }),
        makeApp({ status: 'Interview' }),
        makeApp({ status: 'Offer' }),
      ];
      prismaMock.application.findMany.mockResolvedValue(apps as any);

      const { statusDistribution } = await dashboardService.getCharts('user-1');

      expect(statusDistribution.find((s) => s.status === 'Applied')?.count).toBe(2);
      expect(statusDistribution.find((s) => s.status === 'Interview')?.count).toBe(1);
      expect(statusDistribution.find((s) => s.status === 'Offer')?.count).toBe(1);
      expect(statusDistribution.find((s) => s.status === 'Rejected')?.count).toBe(0);
    });

    it('returns top 5 companies sorted by count descending', async () => {
      const apps = [
        ...Array(3).fill(makeApp({ company: 'Google' })),
        ...Array(2).fill(makeApp({ company: 'Meta' })),
        makeApp({ company: 'Apple' }),
        makeApp({ company: 'Amazon' }),
        makeApp({ company: 'Netflix' }),
        makeApp({ company: 'Microsoft' }),
      ];
      prismaMock.application.findMany.mockResolvedValue(apps as any);

      const { topCompanies } = await dashboardService.getCharts('user-1');

      expect(topCompanies).toHaveLength(5);
      expect(topCompanies[0]).toEqual({ company: 'Google', count: 3 });
      expect(topCompanies[1]).toEqual({ company: 'Meta', count: 2 });
    });

    it('places salaries into the correct distribution ranges', async () => {
      const apps = [
        makeApp({ salary: 25000 }),   // < 30k
        makeApp({ salary: 40000 }),   // 30k–50k
        makeApp({ salary: 60000 }),   // 50k–70k
        makeApp({ salary: 80000 }),   // 70k–100k
        makeApp({ salary: 150000 }),  // > 100k
      ];
      prismaMock.application.findMany.mockResolvedValue(apps as any);

      const { salaryDistribution } = await dashboardService.getCharts('user-1');

      expect(salaryDistribution.find((r) => r.range === '< 30k')?.count).toBe(1);
      expect(salaryDistribution.find((r) => r.range === '30k–50k')?.count).toBe(1);
      expect(salaryDistribution.find((r) => r.range === '50k–70k')?.count).toBe(1);
      expect(salaryDistribution.find((r) => r.range === '70k–100k')?.count).toBe(1);
      expect(salaryDistribution.find((r) => r.range === '> 100k')?.count).toBe(1);
    });

    it('ignores applications without salary in the distribution', async () => {
      prismaMock.application.findMany.mockResolvedValue([
        makeApp({ salary: null }) as any,
        makeApp({ salary: undefined }) as any,
      ]);

      const { salaryDistribution } = await dashboardService.getCharts('user-1');

      const total = salaryDistribution.reduce((sum, r) => sum + r.count, 0);
      expect(total).toBe(0);
    });
  });
});
