import { Link } from 'react-router-dom';
import { useDashboardStats, useDashboardCharts } from '../features/dashboard/hooks/useDashboard';
import { KPICard } from '../features/dashboard/components/KPICard';
import { MonthlyChart } from '../features/dashboard/components/MonthlyChart';
import { StatusChart } from '../features/dashboard/components/StatusChart';
import { TopCompanies } from '../features/dashboard/components/TopCompanies';
import { SalaryChart } from '../features/dashboard/components/SalaryChart';
import { useAuth } from '../context/AuthContext';

const BriefcaseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-primary-100/70 bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl dark:border-primary-500/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-100">Job Tracker Pro</p>
            <h2 className="mt-2 text-3xl font-semibold">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
            <p className="mt-3 text-sm text-indigo-100 sm:text-base">
              Keep every opportunity organized, spot your momentum at a glance, and stay ahead of the next interview.
            </p>
          </div>
          <Link to="/applications" className="inline-flex items-center justify-center rounded-full bg-white/15 px-4 py-2 font-medium text-white backdrop-blur transition hover:bg-white/25">
            Track applications
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-100">Momentum</p>
            <p className="mt-1 text-lg font-semibold">{stats?.total ?? 0} tracked</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-100">Interviews</p>
            <p className="mt-1 text-lg font-semibold">{stats?.interviews ?? 0} active</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-100">Offers</p>
            <p className="mt-1 text-lg font-semibold">{stats?.offers ?? 0} in motion</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Applications"
            value={stats?.total ?? 0}
            icon={<BriefcaseIcon />}
            color="blue"
          />
          <KPICard
            title="Interviews"
            value={stats?.interviews ?? 0}
            icon={<UsersIcon />}
            color="yellow"
            subtitle={`${stats?.interviewRate ?? 0}% interview rate`}
          />
          <KPICard
            title="Offers"
            value={stats?.offers ?? 0}
            icon={<CheckIcon />}
            color="green"
            subtitle={`${stats?.offerRate ?? 0}% offer rate`}
          />
          <KPICard
            title="Rejections"
            value={stats?.rejected ?? 0}
            icon={<XIcon />}
            color="red"
          />
        </div>
      )}

      {/* Charts row 1 */}
      {chartsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : charts ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <MonthlyChart data={charts.monthlyApplications} />
            </div>
            <StatusChart data={charts.statusDistribution} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopCompanies data={charts.topCompanies} />
            <SalaryChart data={charts.salaryDistribution} />
          </div>
        </>
      ) : null}
    </div>
  );
};
