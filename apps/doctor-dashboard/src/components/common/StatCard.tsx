import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down';
  subtitle?: string;
  badgeColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'up',
  subtitle,
  badgeColor = 'bg-blue-50 text-[#1976D2]'
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-lg ${badgeColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {trend && (
          <span
            className={`flex items-center text-xs font-semibold ${
              trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trendDirection === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};