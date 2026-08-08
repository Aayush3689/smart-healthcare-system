import React, { useState } from 'react';
import { MapPin, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { mockVillages } from '../data/adminMockData';

export const Villages: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredVillages = mockVillages.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Village Monitoring</h1>
        <p className="text-sm text-slate-500">Track healthcare coverage, screening rates, and risk profiles by village.</p>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 w-full sm:w-80 bg-slate-50">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Normal">Normal</option>
            <option value="Attention Required">Attention Required</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVillages.map((village) => (
          <div key={village.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{village.name}</h3>
                  <p className="text-xs text-slate-500">Population: {village.population}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${village.status === 'Attention Required' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {village.status === 'Attention Required' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                {village.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-sm">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block">Total Patients</span>
                <span className="font-bold text-slate-800">{village.patients}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block">Assessments</span>
                <span className="font-bold text-slate-800">{village.assessments}</span>
              </div>
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg">
                <span className="text-xs text-red-600 block">High Risk</span>
                <span className="font-bold text-red-800">{village.highRiskCount}</span>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                <span className="text-xs text-blue-600 block">ASHA Workers</span>
                <span className="font-bold text-blue-800">{village.ashaWorkers}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};