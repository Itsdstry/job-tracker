import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { StatusData } from '../../../types';
import { STATUS_CHART_COLORS } from '../../../utils';
import { ApplicationStatus } from '../../../types';
import { Card } from '../../../components/ui/Card';

interface StatusChartProps {
  data: StatusData[];
}

export const StatusChart = ({ data }: StatusChartProps) => {
  const { t } = useTranslation();

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: t(`status.${d.status as ApplicationStatus}`),
      value: d.count,
      color: STATUS_CHART_COLORS[d.status] || '#6b7280',
    }));

  if (!chartData.length) {
    return (
      <Card className="flex items-center justify-center h-[280px]">
        <p className="text-gray-400 text-sm">{t('dashboard.charts.noData')}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {t('dashboard.charts.status')}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
