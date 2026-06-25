import { prisma } from '../prisma/client';

export const getStats = async (userId: string) => {
  const [total, interviews, offers, rejected, technicalTests] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.application.count({ where: { userId, status: 'Interview' } }),
    prisma.application.count({ where: { userId, status: 'Offer' } }),
    prisma.application.count({ where: { userId, status: 'Rejected' } }),
    prisma.application.count({ where: { userId, status: 'TechnicalTest' } }),
  ]);

  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  return { total, interviews, offers, rejected, technicalTests, interviewRate, offerRate };
};

export const getCharts = async (userId: string) => {
  const applications = await prisma.application.findMany({
    where: { userId },
    select: {
      applicationDate: true,
      status: true,
      company: true,
      salary: true,
    },
    orderBy: { applicationDate: 'asc' },
  });

  // Monthly applications (last 12 months)
  const monthlyMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = 0;
  }
  applications.forEach((app) => {
    const d = new Date(app.applicationDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthlyMap) monthlyMap[key]++;
  });
  const monthlyApplications = Object.entries(monthlyMap).map(([month, count]) => ({
    month,
    count,
  }));

  // Status distribution
  const statusMap: Record<string, number> = {
    Applied: 0,
    Interview: 0,
    TechnicalTest: 0,
    Offer: 0,
    Rejected: 0,
  };
  applications.forEach((app) => {
    statusMap[app.status]++;
  });
  const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // Top companies
  const companyMap: Record<string, number> = {};
  applications.forEach((app) => {
    companyMap[app.company] = (companyMap[app.company] || 0) + 1;
  });
  const topCompanies = Object.entries(companyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }));

  // Salary distribution
  const salaryRanges = [
    { range: '< 30k', min: 0, max: 30000, count: 0 },
    { range: '30k–50k', min: 30000, max: 50000, count: 0 },
    { range: '50k–70k', min: 50000, max: 70000, count: 0 },
    { range: '70k–100k', min: 70000, max: 100000, count: 0 },
    { range: '> 100k', min: 100000, max: Infinity, count: 0 },
  ];
  applications.forEach((app) => {
    if (app.salary) {
      const range = salaryRanges.find((r) => app.salary! >= r.min && app.salary! < r.max);
      if (range) range.count++;
    }
  });
  const salaryDistribution = salaryRanges.map(({ range, count }) => ({ range, count }));

  return { monthlyApplications, statusDistribution, topCompanies, salaryDistribution };
};
