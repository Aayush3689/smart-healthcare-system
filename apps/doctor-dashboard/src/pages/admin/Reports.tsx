import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { FileText, Download } from 'lucide-react';
import { toast } from '../../utils/toast';

export const AdminReports: React.FC = () => {
  const downloadCSV = (title: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,Patient,Age,Village,BP,Sugar,Risk\nRahul Kumar,60,Village A,180/110,205,HIGH\nAsha Devi,52,Village B,165/100,220,HIGH';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${title} downloaded successfully!`);
  };

  const reports = [
    'Disease Risk Report',
    'Village Health Summary Report',
    'Referral Activity Log',
    'ASHA Worker Field Activity Report'
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Healthcare Reports" subtitle="Generate and export CSV reports for public health monitoring." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#1976D2] rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-xs">{r}</span>
            </div>
            <button
              onClick={() => downloadCSV(r)}
              className="px-3 py-1.5 bg-[#1976D2] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};