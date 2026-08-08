import React, { useState } from 'react';
import { 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  Send, 
  MapPin, 
  UserCheck, 
  TrendingUp, 
  Building2, 
  Download,
  Filter,
  Activity,
  Stethoscope,
  Calendar,
  CheckCircle,
  X,
  FileText,
  Mic,
  Brain,
  Plus
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { 
  mockVillages, 
  mockAshaWorkers, 
  mockDiseaseTrends, 
  mockPatients, 
  mockDoctors, 
  mockHospitals 
} from '../../data/adminMockData';
import { aiService } from '../../services/aiService';

export const Dashboard: React.FC = () => {
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'management'>('overview');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

  // Dynamic Resource States
  const [doctors, setDoctors] = useState(mockDoctors);
  const [patients, setPatients] = useState(mockPatients);
  const [ashas, setAshas] = useState(mockAshaWorkers);
  const [hospitals, setHospitals] = useState(mockHospitals);

  // Modal Control States
  const [showModal, setShowModal] = useState<'doctor' | 'asha' | 'hospital' | 'book' | 'patientAssessment' | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Form Input States
  const [newDoc, setNewDoc] = useState({ name: '', specialty: '', hospital: '', contact: '' });
  const [newAsha, setNewAsha] = useState({ name: '', village: '' });
  const [newHospital, setNewHospital] = useState({ name: '', location: '', bedsAvailable: 10, contact: '' });

  // Comprehensive Patient Form State
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    village: 'Village A',
    height: '',
    weight: '',
    temperature: '98.6',
    bloodPressure: '120/80',
    heartRate: '72',
    oxygenSaturation: '98',
    symptomsChecklist: [] as string[],
    symptomsFreeText: '',
    historyDiabetes: false,
    historyHypertension: false,
    historyHeartDisease: false,
    historyAsthma: false,
    historyKidneyDisease: false,
    historyAllergies: false,
    currentMedications: '',
    additionalNotes: '',
    ocrText: '',
    voiceText: ''
  });

  const [aiTriageResult, setAiTriageResult] = useState<any>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Add Handlers
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setDoctors([...doctors, { ...newDoc, id: `d${Date.now()}`, available: true }]);
    setNewDoc({ name: '', specialty: '', hospital: '', contact: '' });
    setShowModal(null);
  };

  const handleAddAsha = (e: React.FormEvent) => {
    e.preventDefault();
    setAshas([...ashas, { 
      id: `w${Date.now()}`, 
      name: newAsha.name, 
      village: newAsha.village, 
      assessments: 0, 
      highRiskIdentified: 0, 
      referrals: 0, 
      lastActive: 'Just now', 
      status: 'Active' 
    }]);
    setNewAsha({ name: '', village: '' });
    setShowModal(null);
  };

  const handleAddHospital = (e: React.FormEvent) => {
    e.preventDefault();
    setHospitals([...hospitals, { ...newHospital, id: `h${Date.now()}` }]);
    setNewHospital({ name: '', location: '', bedsAvailable: 10, contact: '' });
    setShowModal(null);
  };

  const handleAssignDoctor = (doctorId: string) => {
    if (!selectedPatientId) return;
    setPatients(patients.map(p => p.id === selectedPatientId ? { ...p, assignedDoctorId: doctorId } : p));
    setSelectedPatientId(null);
    setShowModal(null);
  };

  // Symptom Checkbox Toggle
  const toggleSymptom = (symptom: string) => {
    setPatientForm(prev => ({
      ...prev,
      symptomsChecklist: prev.symptomsChecklist.includes(symptom)
        ? prev.symptomsChecklist.filter(s => s !== symptom)
        : [...prev.symptomsChecklist, symptom]
    }));
  };

  // OCR Prescription Handler
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAI(true);
    try {
      const res: any = await aiService.uploadOCR(file);
      const text = res.extracted_text || res.text || JSON.stringify(res);
      setPatientForm(prev => ({ ...prev, ocrText: text }));
    } catch (err: any) {
      alert(`OCR Failed: ${err.message}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Speech Transcription Handler
  const handleSpeechUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAI(true);
    try {
      const res: any = await aiService.uploadSpeech(file);
      const text = res.transcribed_text || res.text || JSON.stringify(res);
      setPatientForm(prev => ({ ...prev, voiceText: text }));
    } catch (err: any) {
      alert(`Speech Transcription Failed: ${err.message}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // AI Triage Evaluator
  const handleRunClinicalTriage = async () => {
    setIsProcessingAI(true);
    try {
      const allSymptoms = [...patientForm.symptomsChecklist, patientForm.symptomsFreeText].filter(Boolean).join(', ');
      const medicalHistory = [
        patientForm.historyDiabetes && 'Diabetes',
        patientForm.historyHypertension && 'Hypertension',
        patientForm.historyHeartDisease && 'Heart Disease',
        patientForm.historyAsthma && 'Asthma',
        patientForm.historyKidneyDisease && 'Kidney Disease',
        patientForm.historyAllergies && 'Allergies'
      ].filter(Boolean).join(', ');

      const payload = {
        symptoms: allSymptoms || 'None reported',
        temperature: Number(patientForm.temperature) || 98.6,
        blood_pressure: patientForm.bloodPressure || '120/80',
        heart_rate: Number(patientForm.heartRate) || 72,
        oxygen_saturation: Number(patientForm.oxygenSaturation) || 98,
        medical_history: medicalHistory || 'None',
        current_medications: patientForm.currentMedications || 'None',
        additional_notes: `${patientForm.additionalNotes} | OCR: ${patientForm.ocrText} | Voice: ${patientForm.voiceText}`
      };

      const res = await aiService.getClinicalRisk(payload);
      setAiTriageResult(res);
    } catch (err: any) {
      alert(`Clinical Triage Failed: ${err.message}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Save Patient Assessment
  const handleSavePatientAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const isHighRisk = aiTriageResult?.clinical_risk === 'HIGH' || Number(patientForm.temperature) > 101 || Number(patientForm.oxygenSaturation) < 94;

    const newPatient = {
      id: `p${Date.now()}`,
      name: patientForm.name,
      age: Number(patientForm.age) || 30,
      gender: patientForm.gender as 'Male' | 'Female' | 'Other',
      village: patientForm.village,
      riskLevel: (isHighRisk ? 'HIGH' : 'LOW') as 'HIGH' | 'LOW',
      condition: patientForm.symptomsChecklist.join(', ') || patientForm.symptomsFreeText || 'General Screening',
      assignedDoctorId: undefined
    };

    setPatients([newPatient, ...patients]);
    setShowModal(null);
    setAiTriageResult(null);
  };

  const filteredPatients = patients.filter(p => {
    if (riskFilter === 'HIGH') return p.riskLevel === 'HIGH';
    if (riskFilter === 'LOW') return p.riskLevel === 'LOW';
    return true;
  });

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-2 sm:p-4 text-slate-800 font-sans">
      
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-sky-500 rounded-xl text-slate-950 font-bold shadow-inner">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">PHC Command Overview</h1>
            <p className="text-xs text-slate-400">Monitor healthcare activity and disease risk across villages.</p>
          </div>
        </div>

        {/* View Switcher Tabs & Actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'overview' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'patients' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Patients & Bookings ({patients.length})
          </button>
          <button 
            onClick={() => setActiveTab('management')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'management' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Resource Actions
          </button>

          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          
          <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={<Users className="w-5 h-5 text-sky-600" />} label="Total Patients" value={patients.length.toString()} change="+12%" />
            <StatCard icon={<ClipboardList className="w-5 h-5 text-sky-600" />} label="Assessments" value="428" change="+8%" />
            <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="High Risk" value={patients.filter(p => p.riskLevel === 'HIGH').length.toString()} change="+4%" isAlert />
            <StatCard icon={<Send className="w-5 h-5 text-amber-600" />} label="Referrals" value="24" change="+2%" />
            <StatCard icon={<UserCheck className="w-5 h-5 text-emerald-600" />} label="ASHA Workers" value={ashas.length.toString()} change="Active" />
            <StatCard icon={<MapPin className="w-5 h-5 text-indigo-600" />} label="Villages" value="12" change="Covered" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Disease Risk Trends</h2>
                  <p className="text-xs text-slate-500">Monthly breakdown of AI-identified risk factors</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +15% AI Screenings
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockDiseaseTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="hypertension" name="Hypertension" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="diabetes" name="Diabetes" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="heartDisease" name="Heart Disease" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">High-Risk Patients by Village</h2>
                  <p className="text-xs text-slate-500">Geographic hotspot identification</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <Activity className="w-4 h-4 text-sky-600" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockVillages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.split(' ')[0]} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                    <Bar dataKey="highRiskCount" name="High Risk Cases" fill="#0284C7" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-900 text-base">ASHA Worker Activity</h2>
                <p className="text-xs text-slate-500">Real-time field screening log & sync status</p>
              </div>
              <button className="text-xs text-sky-600 font-semibold hover:underline flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter Field Staff
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Worker Name</th>
                    <th className="p-4">Village</th>
                    <th className="p-4">Assessments</th>
                    <th className="p-4">High Risk Identified</th>
                    <th className="p-4">Referrals Sent</th>
                    <th className="p-4">Last Active</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {ashas.map((worker) => (
                    <tr key={worker.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{worker.name}</td>
                      <td className="p-4 text-slate-700">{worker.village}</td>
                      <td className="p-4 font-mono font-semibold text-slate-800">{worker.assessments}</td>
                      <td className="p-4 font-mono font-bold text-red-600">{worker.highRiskIdentified}</td>
                      <td className="p-4 font-mono text-slate-600">{worker.referrals}</td>
                      <td className="p-4 text-slate-500">{worker.lastActive}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold ${
                          worker.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {worker.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- TAB 2: PATIENTS & BOOKINGS --- */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categorize Patients:</span>
              <button 
                onClick={() => setRiskFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${riskFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                All Patients ({patients.length})
              </button>
              <button 
                onClick={() => setRiskFilter('HIGH')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${riskFilter === 'HIGH' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> High Risk Section ({patients.filter(p => p.riskLevel === 'HIGH').length})
              </button>
              <button 
                onClick={() => setRiskFilter('LOW')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${riskFilter === 'LOW' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Low Risk Section ({patients.filter(p => p.riskLevel === 'LOW').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map(patient => {
              const assignedDoctor = doctors.find(d => d.id === patient.assignedDoctorId);
              return (
                <div key={patient.id} className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${patient.riskLevel === 'HIGH' ? 'border-red-300 bg-red-50/20' : 'border-slate-200'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{patient.name}</h3>
                        <p className="text-xs text-slate-500">{patient.age} yrs • {patient.gender} • Village: {patient.village}</p>
                      </div>
                      <span className={`px-3 py-1 text-[11px] font-extrabold rounded-full ${patient.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'}`}>
                        {patient.riskLevel} RISK
                      </span>
                    </div>
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Diagnosis / Conditions:</p>
                      <p className="text-sm font-bold text-slate-800">{patient.condition}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500">Booked Doctor:</p>
                      <p className="text-xs font-bold text-sky-700">{assignedDoctor ? assignedDoctor.name : 'No Appointment Booked'}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setShowModal('book');
                      }}
                      className="px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book Appointment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: ADMIN MANAGEMENT --- */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* + New Patient Assessment Card */}
            <button 
              onClick={() => setShowModal('patientAssessment')} 
              className="p-5 bg-white border border-slate-200 hover:border-purple-500 rounded-2xl shadow-sm text-left flex items-center gap-4 transition group"
            >
              <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">+ New Patient Assessment</p>
                <p className="text-xs text-slate-500">Vitals, OCR, Voice & AI Triage</p>
              </div>
            </button>

            {/* + Add Doctor */}
            <button onClick={() => setShowModal('doctor')} className="p-5 bg-white border border-slate-200 hover:border-sky-500 rounded-2xl shadow-sm text-left flex items-center gap-4 transition group">
              <div className="p-3.5 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition"><Stethoscope className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">+ Add Doctor</p>
                <p className="text-xs text-slate-500">Register new PHC specialist</p>
              </div>
            </button>

            {/* + Add ASHA Worker */}
            <button onClick={() => setShowModal('asha')} className="p-5 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl shadow-sm text-left flex items-center gap-4 transition group">
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">+ Add ASHA Worker</p>
                <p className="text-xs text-slate-500">Register field health staff</p>
              </div>
            </button>

            {/* + Add Hospital/PHC */}
            <button onClick={() => setShowModal('hospital')} className="p-5 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl shadow-sm text-left flex items-center gap-4 transition group">
              <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition"><Building2 className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">+ Add Hospital/PHC</p>
                <p className="text-xs text-slate-500">Register referral facilities</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-sky-600"/> Available Doctors ({doctors.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {doctors.map(d => (
                  <div key={d.id} className="p-3 border rounded-xl bg-slate-50 text-xs">
                    <p className="font-bold text-slate-900">{d.name}</p>
                    <p className="text-slate-500">{d.specialty} • {d.hospital}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600"/> ASHA Workers ({ashas.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {ashas.map(a => (
                  <div key={a.id} className="p-3 border rounded-xl bg-slate-50 text-xs">
                    <p className="font-bold text-slate-900">{a.name}</p>
                    <p className="text-slate-500">Assigned: {a.village}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-600"/> Hospitals ({hospitals.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {hospitals.map(h => (
                  <div key={h.id} className="p-3 border rounded-xl bg-slate-50 text-xs">
                    <p className="font-bold text-slate-900">{h.name}</p>
                    <p className="text-slate-500">{h.location} • {h.bedsAvailable} Available Beds</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: COMPREHENSIVE PATIENT ASSESSMENT --- */}
      {showModal === 'patientAssessment' && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleSavePatientAssessment} className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-600" /> Patient Assessment & Health Record
                </h2>
                <p className="text-xs text-slate-500">Fill in patient info, vitals, symptoms, OCR, and speech inputs.</p>
              </div>
              <button type="button" onClick={() => setShowModal(null)} className="p-2 rounded-full hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            {/* SECTION 1: Patient Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 p-2 rounded-lg inline-block">1. Patient Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input required placeholder="Patient Full Name" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} className="p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-purple-500" />
                <input required type="number" placeholder="Age" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: e.target.value})} className="p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-purple-500" />
                <select value={patientForm.gender} onChange={e => setPatientForm({...patientForm, gender: e.target.value})} className="p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-purple-500">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input placeholder="Height (cm)" value={patientForm.height} onChange={e => setPatientForm({...patientForm, height: e.target.value})} className="p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-purple-500" />
                <input placeholder="Weight (kg)" value={patientForm.weight} onChange={e => setPatientForm({...patientForm, weight: e.target.value})} className="p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-purple-500" />
              </div>
            </div>

            {/* SECTION 2: Vital Signs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 p-2 rounded-lg inline-block">2. Vital Signs</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Temp (°F)</label>
                  <input placeholder="98.6" value={patientForm.temperature} onChange={e => setPatientForm({...patientForm, temperature: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Blood Pressure</label>
                  <input placeholder="120/80" value={patientForm.bloodPressure} onChange={e => setPatientForm({...patientForm, bloodPressure: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Heart Rate (BPM)</label>
                  <input placeholder="72" value={patientForm.heartRate} onChange={e => setPatientForm({...patientForm, heartRate: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">SpO2 (%)</label>
                  <input placeholder="98" value={patientForm.oxygenSaturation} onChange={e => setPatientForm({...patientForm, oxygenSaturation: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
                </div>
              </div>
            </div>

            {/* SECTION 3: Symptoms */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 p-2 rounded-lg inline-block">3. Symptoms</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Fever', 'Cough', 'Dizziness', 'Fatigue', 'Shortness of breath', 'Nausea / Vomiting'].map(symptom => (
                  <button type="button" key={symptom} onClick={() => toggleSymptom(symptom)} className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${patientForm.symptomsChecklist.includes(symptom) ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {patientForm.symptomsChecklist.includes(symptom) ? '✓ ' : '+ '}{symptom}
                  </button>
                ))}
              </div>
              <textarea placeholder="Describe additional symptoms (free text)..." value={patientForm.symptomsFreeText} onChange={e => setPatientForm({...patientForm, symptomsFreeText: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-amber-500 h-16" />
            </div>

            {/* SECTION 4: Medical History */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 p-2 rounded-lg inline-block">4. Medical History</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={patientForm.historyDiabetes} onChange={e => setPatientForm({...patientForm, historyDiabetes: e.target.checked})} /> Diabetes
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={patientForm.historyHypertension} onChange={e => setPatientForm({...patientForm, historyHypertension: e.target.checked})} /> Hypertension
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={patientForm.historyHeartDisease} onChange={e => setPatientForm({...patientForm, historyHeartDisease: e.target.checked})} /> Heart Disease
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={patientForm.historyAsthma} onChange={e => setPatientForm({...patientForm, historyAsthma: e.target.checked})} /> Asthma
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={patientForm.historyKidneyDisease} onChange={e => setPatientForm({...patientForm, historyKidneyDisease: e.target.checked})} /> Kidney Disease
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={patientForm.historyAllergies} onChange={e => setPatientForm({...patientForm, historyAllergies: e.target.checked})} /> Allergies
                </label>
              </div>
            </div>

            {/* SECTION 5: Medications & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Current Medications</label>
                <input placeholder="List medications..." value={patientForm.currentMedications} onChange={e => setPatientForm({...patientForm, currentMedications: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-slate-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Additional Notes</label>
                <input placeholder="Notes or special observations..." value={patientForm.additionalNotes} onChange={e => setPatientForm({...patientForm, additionalNotes: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-slate-500" />
              </div>
            </div>

            {/* SECTION 6: Prescription OCR & Voice Input AI Integration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-sky-600" /> Prescription Image (OCR)
                </label>
                <input type="file" accept="image/*" onChange={handleOcrUpload} className="text-xs mb-2 w-full" />
                <textarea readOnly placeholder="Extracted prescription text will appear here..." value={patientForm.ocrText} className="w-full p-2 text-xs border rounded-xl bg-white h-16" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Mic className="w-4 h-4 text-emerald-600" /> Voice Input (Speech-to-Text)
                </label>
                <input type="file" accept="audio/*" onChange={handleSpeechUpload} className="text-xs mb-2 w-full" />
                <textarea readOnly placeholder="Voice transcription will appear here..." value={patientForm.voiceText} className="w-full p-2 text-xs border rounded-xl bg-white h-16" />
              </div>
            </div>

            {/* SECTION 7: AI Clinical Risk Trigger & Response Box */}
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-600" /> AI Clinical Triage Evaluator
                </span>
                <button type="button" onClick={handleRunClinicalTriage} disabled={isProcessingAI} className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-1.5">
                  {isProcessingAI ? 'Processing AI...' : 'Run Triage Assessment'}
                </button>
              </div>

              {aiTriageResult && (
                <div className="p-3 bg-white border border-purple-200 rounded-xl space-y-1 text-xs">
                  <p><strong>Clinical Risk:</strong> <span className={`font-bold ${aiTriageResult.clinical_risk === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}`}>{aiTriageResult.clinical_risk}</span></p>
                  <p><strong>Clinical Score:</strong> {aiTriageResult.clinical_score}</p>
                  <p><strong>Clinical Reasons:</strong> {aiTriageResult.clinical_reasons?.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl transition">Save Patient Record</button>
            </div>

          </form>
        </div>
      )}

      {/* --- OTHER MODALS --- */}
      {showModal === 'book' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Book Doctor Appointment</h3>
              <button onClick={() => setShowModal(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Select an available doctor to schedule the patient:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {doctors.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-sky-50 transition cursor-pointer" onClick={() => handleAssignDoctor(doc.id)}>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                    <p className="text-[11px] text-slate-500">{doc.specialty} ({doc.hospital})</p>
                  </div>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-lg">Assign</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(null)} className="mt-4 w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {showModal === 'doctor' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddDoctor} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Doctor</h3>
            <input required placeholder="Doctor Full Name" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
            <input required placeholder="Specialty (e.g. Pediatrics, Cardiology)" value={newDoc.specialty} onChange={e => setNewDoc({...newDoc, specialty: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
            <input required placeholder="Hospital / PHC Location" value={newDoc.hospital} onChange={e => setNewDoc({...newDoc, hospital: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
            <input required placeholder="Contact Number" value={newDoc.contact} onChange={e => setNewDoc({...newDoc, contact: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700">Save Doctor</button>
            </div>
          </form>
        </div>
      )}

      {showModal === 'asha' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddAsha} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add ASHA Worker</h3>
            <input required placeholder="ASHA Worker Full Name" value={newAsha.name} onChange={e => setNewAsha({...newAsha, name: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-emerald-500" />
            <input required placeholder="Assigned Village" value={newAsha.village} onChange={e => setNewAsha({...newAsha, village: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-emerald-500" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700">Save Worker</button>
            </div>
          </form>
        </div>
      )}

      {showModal === 'hospital' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddHospital} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Hospital / Referral Facility</h3>
            <input required placeholder="Hospital Name" value={newHospital.name} onChange={e => setNewHospital({...newHospital, name: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500" />
            <input required placeholder="Location / Block" value={newHospital.location} onChange={e => setNewHospital({...newHospital, location: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500" />
            <input required type="number" placeholder="Available Bed Capacity" value={newHospital.bedsAvailable} onChange={e => setNewHospital({...newHospital, bedsAvailable: Number(e.target.value)})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Save Facility</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

// StatCard Component
const StatCard = ({ icon, label, value, change, isAlert = false }: { icon: React.ReactNode; label: string; value: string; change: string; isAlert?: boolean }) => (
  <div className={`p-4 bg-white border rounded-2xl shadow-sm transition-shadow hover:shadow-md ${isAlert ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
    <div className="flex items-center justify-between">
      <span className="p-2 bg-slate-50 rounded-xl border border-slate-100">{icon}</span>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isAlert ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
        {change}
      </span>
    </div>
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-xl font-extrabold text-slate-900 mt-0.5">{value}</p>
    </div>
  </div>
);

export default Dashboard;
export { Dashboard as AdminDashboard };