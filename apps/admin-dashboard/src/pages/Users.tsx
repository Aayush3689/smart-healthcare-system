import React, { useState } from 'react';
import { UserPlus, Search, X } from 'lucide-react';
import { mockUsers } from '../data/adminMockData';
import { AdminUser } from '../types/admin';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Doctor' as const, village: 'Village A' });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const created: AdminUser = {
      id: `u${users.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      village: newUser.village,
      status: 'Active',
      lastActive: 'Just now'
    };
    setUsers([...users, created]);
    setIsModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Doctor', village: 'Village A' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500">Manage Doctors, ASHA Workers, and System Administrators.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 self-start sm:self-auto">
          <UserPlus className="w-4 h-4" /> Add New User
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search user..." className="w-full text-sm outline-none bg-transparent" />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3.5">Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Assigned PHC / Village</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-medium text-slate-800">{u.name}</td>
                <td className="p-3.5 text-slate-600">{u.email}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">{u.role}</span>
                </td>
                <td className="p-3.5 text-slate-600">{u.village || 'N/A'}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">{u.status}</span>
                </td>
                <td className="p-3.5 text-slate-500 text-xs">{u.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-800">Add New User</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Full Name</label>
                <input required type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Dr. Ramesh Kumar" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Email Address</label>
                <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm" placeholder="user@healthai.com" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="Doctor">Doctor</option>
                    <option value="ASHA Worker">ASHA Worker</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Village/PHC</label>
                  <input type="text" value={newUser.village} onChange={(e) => setNewUser({ ...newUser, village: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};