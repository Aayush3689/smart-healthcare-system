import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { toast } from '../../utils/toast';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('ASHA Worker');
  const [village, setVillage] = useState('Village A');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`User ${name} created successfully!`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#1976D2]" />
            <h3 className="font-bold text-slate-900 text-sm">Add Healthcare System User</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunita Devi"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#1976D2]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option>ASHA Worker</option>
              <option>Medical Officer (Doctor)</option>
              <option>Administrator</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Village</label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option>Village A</option>
              <option>Village B</option>
              <option>Village C</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#1976D2] text-white font-bold rounded-lg">Add User</button>
          </div>
        </form>
      </div>
    </div>
  );
};