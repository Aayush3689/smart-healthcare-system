import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminAnalytics: React.FC = () => {
  const data = [
    { village: 'Village A', assessments: 120, highRisk: 34 },
    { village: 'Village B', assessments: 95, highRisk: 21 },
    { village: 'Village C', assessments: 80, highRisk: 13 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Population Analytics" subtitle="Deep-dive NCD risk patterns across regions." />
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Assessments vs High-Risk Yield Rate</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="village" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="assessments" fill="#1976D2" name="Assessments" radius={[4, 4, 0, 0]} />
              <Bar dataKey="highRisk" fill="#DC2626" name="High Risk Identified" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};