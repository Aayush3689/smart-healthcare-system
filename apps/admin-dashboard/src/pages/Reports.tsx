import React from 'react';
import { FileText, Download, Eye } from 'lucide-react';

export const Reports: React.FC = () => {
  const downloadCsv = (reportName: string) => {
    const csvContent = "data:text/csv;charset=utf-8,Report Name,Generated Date,Status\n" + `${reportName},${new Date().toLocaleDateString()},Completed`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName.toLowerCase().replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reports = [
    { title: 'Disease Risk Report', desc: 'Aggregated AI risk predictions for Diabetes, BP, and Heart conditions.' },
    { title: 'Village Health Report', desc: 'Village-wide breakdown of screening totals and high-risk case distributions.' },
    { title: 'Referral Track Report', desc: 'Detailed log of PHC referrals created, accepted, and pending.' },
    { title: 'ASHA Activity Report', desc: 'Performance logs, assessment counts, and activity timelines for ASHA workers.' },
    { title: 'Monthly Assessment Report', desc: 'Comprehensive monthly analytical summary for district healthcare officers.' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Healthcare Reports</h1>
        <p className="text-sm text-slate-500">Download and inspect population healthcare summary data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((rep, idx) => (
          <div key={idx} className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">{rep.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button onClick={() => downloadCsv(rep.title)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};