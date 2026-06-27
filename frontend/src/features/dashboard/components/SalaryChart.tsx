import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { SalaryData } from '../../../types';
import { Card } from '../../../components/ui/Card';

interface SalaryChartProps {
  data: SalaryData[];
}

export const SalaryChart = ({ data }: SalaryChartProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {t('dashboard.charts.salary')}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name={t('dashboard.charts.applications')} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
