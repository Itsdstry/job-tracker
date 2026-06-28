import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../components/ui/Modal';
import { ApplicationForm } from '../features/applications/components/ApplicationForm';
import { useCreateApplication } from '../features/applications/hooks/useApplications';
import { Application, ApplicationFormData } from '../types';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  tags: string[];
}

const CATEGORIES = [
  'Software Development',
  'DevOps / Sysadmin',
  'Design',
  'Product',
  'Data',
  'QA',
  'Marketing',
  'Customer Support',
];

const REGION_OPTIONS = [
  { value: '', labelKey: 'jobs.allRegions', match: [] as string[] },
  { value: 'worldwide', labelKey: 'jobs.regions.worldwide', match: ['worldwide', 'anywhere', 'global'] },
  { value: 'europe', labelKey: 'jobs.regions.europe', match: ['europe', 'eu', 'emea', 'spain', 'españa', 'uk', 'germany', 'france', 'portugal', 'netherlands', 'italy'] },
  { value: 'spain', labelKey: 'jobs.regions.spain', match: ['spain', 'españa'] },
  { value: 'usa', labelKey: 'jobs.regions.usa', match: ['usa', 'us only', 'us ', 'united states', 'canada', 'north america'] },
  { value: 'latam', labelKey: 'jobs.regions.latam', match: ['latam', 'latin america', 'south america', 'mexico', 'argentina', 'colombia', 'brazil', 'chile'] },
  { value: 'asia', labelKey: 'jobs.regions.asia', match: ['asia', 'pacific', 'apac', 'australia', 'india', 'japan', 'singapore', 'china'] },
] as const;

const JOB_PORTALS = [
  {
    name: 'LinkedIn',
    icon: 'https://www.linkedin.com/favicon.ico',
    getUrl: (q: string) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&f_WT=2`,
  },
  {
    name: 'Indeed',
    icon: 'https://indeed.com/favicon.ico',
    getUrl: (q: string) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}&remotejob=1`,
  },
  {
    name: 'InfoJobs',
    icon: 'https://www.infojobs.net/favicon.ico',
    getUrl: (q: string) =>
      `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${encodeURIComponent(q)}`,
  },
  {
    name: 'Glassdoor',
    icon: 'https://www.glassdoor.com/favicon.ico',
    getUrl: (q: string) =>
      `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}&remoteWorkType=1`,
  },
  {
    name: 'Remoteok',
    icon: 'https://remoteok.com/favicon.ico',
    getUrl: (q: string) => `https://remoteok.com/remote-${encodeURIComponent(q.replace(/ /g, '-'))}-jobs`,
  },
  {
    name: 'Wellfound',
    icon: 'https://wellfound.com/favicon.ico',
    getUrl: (q: string) =>
      `https://wellfound.com/jobs?role=${encodeURIComponent(q)}`,
  },
];

const fetchJobs = async (search: string, category: string): Promise<RemotiveJob[]> => {
  const params = new URLSearchParams({ limit: '50' });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  const data = await res.json();
  return data.jobs as RemotiveJob[];
};

export const matchesRegion = (job: RemotiveJob, region: string): boolean => {
  if (!region) return true;
  const option = REGION_OPTIONS.find((o) => o.value === region);
  if (!option || option.match.length === 0) return true;
  const loc = (job.candidate_required_location ?? '').toLowerCase();
  if (!loc) return region === 'worldwide';
  return option.match.some((keyword) => loc.includes(keyword));
};

export const Jobs = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [submitted, setSubmitted] = useState({ search: '', category: '' });
  const [addingJob, setAddingJob] = useState<RemotiveJob | null>(null);
  const createMutation = useCreateApplication();

  const { data: jobs, isLoading, isError } = useQuery({
    queryKey: ['remotive-jobs', submitted.search, submitted.category],
    queryFn: () => fetchJobs(submitted.search, submitted.category),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const filteredJobs = useMemo(
    () => (jobs ?? []).filter((job) => matchesRegion(job, region)),
    [jobs, region],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted({ search, category });
  };

  const handleAdd = (data: ApplicationFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => setAddingJob(null),
    });
  };

  const jobToApplication = (job: RemotiveJob): Application => ({
    id: '',
    userId: '',
    company: job.company_name,
    position: job.title,
    location: job.candidate_required_location || null,
    url: job.url,
    salary: null,
    notes: null,
    status: 'Applied',
    applicationDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
          {t('jobs.label')}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{t('jobs.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('jobs.description')}</p>
      </div>

      {/* Quick portal links */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('jobs.portals')}</h2>
        <div className="flex flex-wrap gap-2">
          {JOB_PORTALS.map((portal) => (
            <a
              key={portal.name}
              href={portal.getUrl(search || 'developer')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <img src={portal.icon} alt={portal.name} className="h-4 w-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              {portal.name}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('jobs.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">{t('jobs.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          {REGION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        >
          {t('common.search')}
        </button>
      </form>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          {t('jobs.error')}
        </div>
      )}

      {jobs && filteredJobs.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t('jobs.noResults')}</p>
        </div>
      )}

      {jobs && filteredJobs.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {region
              ? t('jobs.resultsFiltered', { count: filteredJobs.length, total: jobs.length })
              : t('jobs.resultsFrom', { count: jobs.length })}
          </p>
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-700"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{job.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{job.company_name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.candidate_required_location && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        📍 {job.candidate_required_location}
                      </span>
                    )}
                    {job.job_type && (
                      <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {job.job_type.replace(/_/g, ' ')}
                      </span>
                    )}
                    {job.salary && (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {job.salary}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t('jobs.viewPosting')}
                  </a>
                  <button
                    onClick={() => setAddingJob(job)}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
                  >
                    + {t('jobs.addToTracker')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add application modal */}
      <Modal
        isOpen={!!addingJob}
        onClose={() => setAddingJob(null)}
        title={t('applicationForm.newTitle')}
        size="lg"
      >
        {addingJob && (
          <ApplicationForm
            initialData={jobToApplication(addingJob)}
            isLoading={createMutation.isPending}
            onCancel={() => setAddingJob(null)}
            onSubmit={handleAdd}
          />
        )}
      </Modal>
    </div>
  );
};
