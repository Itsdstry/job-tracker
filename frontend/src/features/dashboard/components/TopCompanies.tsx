import { useTranslation } from 'react-i18next';
import { CompanyData } from '../../../types';
import { Card } from '../../../components/ui/Card';

interface TopCompaniesProps {
  data: CompanyData[];
}

export const TopCompanies = ({ data }: TopCompaniesProps) => {
  const { t } = useTranslation();
  const max = data[0]?.count || 1;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {t('dashboard.charts.topCompanies')}
      </h3>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">{t('dashboard.charts.noData')}</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.company}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{item.company}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                  {item.count} {item.count === 1 ? t('dashboard.charts.app') : t('dashboard.charts.apps')}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
