import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, AppNotification, LeavePolicy } from '../types';
import { api } from '../services/api';
import { 
  UserPlus, 
  Search, 
  Mail, 
  Briefcase, 
  Shield, 
  X,
  Check,
  Building,
  Plus,
  Pencil,
  Trash2,
  Send,
  MessageSquare,
  Loader2,
  ExternalLink,
  Gavel,
  Type as TypeIcon,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  AlertTriangle,
  Users as UsersIcon,
  Activity,
  Megaphone,
  Clock,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Hash,
  FileSpreadsheet
} from 'lucide-react';

interface EmployeeDirectoryProps {
  currentUser: User;
  employees: User[];
  onAddEmployee: (employee: User) => void;
  onUpdateEmployee: (id: string, employee: Partial<User>) => void;
  onDeleteEmployee: (id: string) => void;
  departments: string[];
  onAddDepartment: (name: string) => void;
  onUpdateDepartment: (oldName: string, newName: string) => void;
  onDeleteDepartment: (name: string) => void;
  onSendNotification?: (notif: Partial<AppNotification>) => Promise<void>;
  onSendEmail?: (to: string, subject: string, body: string) => Promise<void>;
  policies: LeavePolicy[];
  onUpdatePolicy: (policy: LeavePolicy) => void;
}

const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({ 
  currentUser, 
  employees, 
  onAddEmployee, 
  onUpdateEmployee,
  onDeleteEmployee,
  departments, 
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onSendNotification,
  onSendEmail,
  policies,
  onUpdatePolicy
}) => {
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<'members' | 'units' | 'communication' | 'policies'>('members');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  
  // State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [tempEditName, setTempEditName] = useState('');
  
  // Fix: Explicitly define the union type for notifForm to prevent inference narrowing to exactly 'info'
  const [notifForm, setNotifForm] = useState<{ title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({ title: '', message: '', type: 'info' });
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [isSending, setIsSending] = useState(false);
  
  // Global Broadcast State
  // Fix: Explicitly define the union type for broadcastForm to prevent inference narrowing to exactly 'info', resolving comparison errors with 'high' and 'medium' on line 196
  const [broadcastForm, setBroadcastForm] = useState<{ title: string; content: string; priority: 'info' | 'medium' | 'high' }>({ title: '', content: '', priority: 'info' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Comm Logs State
  const [commLogs, setCommLogs] = useState<any[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    role: UserRole.EMPLOYEE,
    department: departments[0] || ''
  });

  const [editEmp, setEditEmp] = useState<Partial<User>>({});

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  useEffect(() => {
    if (activeDirectoryTab === 'communication') {
      fetchCommLogs();
    }
  }, [activeDirectoryTab]);

  const fetchCommLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      const logs = await api.email.getLogs();
      setCommLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error("Failed to fetch comm logs");
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.department && departments.length > 0) {
      newEmp.department = departments[0];
    }
    const employee: any = {
      ...newEmp,
      id: 'provisioning-' + Date.now(),
      avatar: '', 
      isActive: true
    };
    onAddEmployee(employee);
    setShowModal(false);
    setNewEmp({ name: '', email: '', role: UserRole.EMPLOYEE, department: departments[0] || '' });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      onUpdateEmployee(selectedUser.id, editEmp);
      setShowEditModal(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !onSendEmail) return;
    setIsSending(true);
    try {
      await onSendEmail(selectedUser.email, emailForm.subject, emailForm.body);
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !onSendNotification) return;
    setIsSending(true);
    try {
      await onSendNotification({
        userId: selectedUser.id,
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type
      });
      setShowNotifModal(false);
      setNotifForm({ title: '', message: '', type: 'info' });
    } finally {
      setIsSending(false);
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSendNotification) return;
    setIsBroadcasting(true);
    try {
      // Fix: The comparison now works as broadcastForm.priority is correctly typed as a union of strings
      await onSendNotification({
        userId: 'all',
        title: broadcastForm.title,
        message: broadcastForm.content,
        type: broadcastForm.priority === 'high' ? 'error' : (broadcastForm.priority === 'medium' ? 'warning' : 'info')
      });
      setBroadcastForm({ title: '', content: '', priority: 'info' });
      alert("System-wide broadcast dispatched successfully.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [employees, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on tab or search change
  }, [searchTerm, activeDirectoryTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Institutional Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Workforce management and communication protocols</p>
          
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mt-6 w-fit overflow-x-auto max-w-full">
            {[
              { id: 'members', label: 'Team Members', icon: UsersIcon },
              { id: 'units', label: 'Business Units', icon: Building },
              { id: 'communication', label: 'Communication Hub', icon: Mail },
              { id: 'policies', label: 'Leave Policies', icon: Gavel },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveDirectoryTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeDirectoryTab === tab.id 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeDirectoryTab === 'members' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 transition-all dark:text-white dark:placeholder:text-slate-600 shadow-sm"
              />
            </div>
            {canManage && (
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all active:scale-95"
              >
                <UserPlus size={18} />
                Provision User
              </button>
            )}
          </div>
        )}

        {activeDirectoryTab === 'units' && canManage && (
          <button 
            onClick={() => setShowUnitModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            Create Unit
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300 flex flex-col min-h-[500px]">
        
        {/* MEMBERS VIEW */}
        {activeDirectoryTab === 'members' && (
          <div className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Member Info</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Unit</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Level</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Quick Outreach</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No team members matched your search</td>
                    </tr>
                  ) : paginatedEmployees.map((emp) => {
                    const avatarUrl = emp.avatar && emp.avatar !== '' ? emp.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=128`;
                    const isActive = emp.isActive !== false;
                    
                    return (
                      <tr key={emp.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors animate-in fade-in duration-300 ${!isActive ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <img src={avatarUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-800" alt={emp.name} />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">{emp.name}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium"><Mail size={12} /> {emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{emp.department || 'Unassigned'}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest ${
                            emp.role === UserRole.ADMIN ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 
                            emp.role === UserRole.MANAGER ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            {canManage && emp.id !== currentUser.id && (
                              <>
                                <button onClick={() => { setSelectedUser(emp); setShowNotifModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl transition-all" title="Send System Alert"><MessageSquare size={18} /></button>
                                <button onClick={() => { setSelectedUser(emp); setShowEmailModal(true); }} className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl transition-all" title="Send Formal Email"><Mail size={18} /></button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {canManage && (
                            <div className="flex items-center justify-end gap-2">
                               <button onClick={() => { setSelectedUser(emp); setEditEmp({ ...emp }); setShowEditModal(true); }} className="p-2 text-slate-300 hover:text-blue-600 rounded-xl transition-all"><Pencil size={18} /></button>
                               {emp.id !== currentUser.id && (
                                 <button onClick={() => { setSelectedUser(emp); setShowDeleteConfirm(true); }} className="p-2 text-slate-300 hover:text-red-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                               )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/20 mt-auto">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  Showing {paginatedEmployees.length} of {filteredEmployees.length} Team Members
                </p>
                <div className="flex gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                        currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BUSINESS UNITS VIEW */}
        {activeDirectoryTab === 'units' && (
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept, idx) => (
                <div key={idx} className="group bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-blue-600 dark:text-blue-400">
                      <Building size={20} />
                    </div>
                    {canManage && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingDept(dept); setTempEditName(dept); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Pencil size={14} /></button>
                        <button onClick={() => { if(confirm('Remove this unit?')) onDeleteDepartment(dept); }} className="p-2 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  {editingDept === dept ? (
                    <div className="flex gap-2">
                       <input 
                        autoFocus
                        value={tempEditName}
                        onChange={(e) => setTempEditName(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm font-bold flex-1"
                       />
                       <button onClick={() => { onUpdateDepartment(dept, tempEditName); setEditingDept(null); }} className="text-emerald-500"><Check size={20} /></button>
                       <button onClick={() => setEditingDept(null)} className="text-red-500"><X size={20} /></button>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{dept}</h4>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {employees.filter(e => e.department === dept).slice(0, 3).map((e, i) => (
                            <img key={i} src={e.avatar || `https://ui-avatars.com/api/?name=${e.name}`} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" alt={e.name} />
                          ))}
                          {employees.filter(e => e.department === dept).length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold">
                              +{employees.filter(e => e.department === dept).length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{employees.filter(e => e.department === dept).length} Members</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMUNICATION HUB VIEW */}
        {activeDirectoryTab === 'communication' && (
          <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
            <div className="lg:w-1/3 p-10 space-y-8">
               <div>
                 <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">Global Broadcast</h4>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">System-wide alerts appear in all member notification feeds instantly.</p>
               </div>
               
               <form onSubmit={handleBroadcastSubmit} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alert Title</label>
                    <input 
                      required
                      type="text" 
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                      placeholder="e.g. System Update" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                    <div className="flex gap-2">
                      {['info', 'medium', 'high'].map(p => (
                        <button 
                          key={p}
                          type="button"
                          onClick={() => setBroadcastForm({...broadcastForm, priority: p as any})}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border-2 transition-all ${broadcastForm.priority === p ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</label>
                    <textarea 
                      required
                      rows={4} 
                      value={broadcastForm.content}
                      onChange={(e) => setBroadcastForm({...broadcastForm, content: e.target.value})}
                      placeholder="Protocol details..." 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-blue-500 resize-none" 
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isBroadcasting}
                    className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                    {isBroadcasting ? 'TRANSMITTING...' : 'Broadcast Alert'}
                  </button>
               </form>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Communication Relay Logs</h4>
                <button onClick={fetchCommLogs} className="p-2 text-slate-400 hover:text-blue-600 transition-all">
                  <Activity size={18} className={isRefreshingLogs ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                      <th className="px-8 py-4">Recipient</th>
                      <th className="px-8 py-4">Subject</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Dispatched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {commLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No communication history logged</td>
                      </tr>
                    ) : commLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                        <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{log.recipient}</td>
                        <td className="px-8 py-4 text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{log.subject}</td>
                        <td className="px-8 py-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${log.status === 'SENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-[10px] font-bold text-slate-400">{new Date(log.sent_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* POLICIES VIEW */}
        {activeDirectoryTab === 'policies' && (
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {policies.map(policy => (
                <div key={policy.id} className="p-8 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-blue-600 dark:text-blue-400">
                        <Gavel size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{policy.leave_type}</h4>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Policy #{policy.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                      <input 
                        type="text" 
                        value={policy.display_name} 
                        onChange={(e) => onUpdatePolicy({...policy, display_name: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Annual Allowance</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input 
                          type="number" 
                          value={policy.allowance} 
                          onChange={(e) => onUpdatePolicy({...policy, allowance: parseInt(e.target.value) || 0})}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/20 flex items-center gap-6">
               <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-blue-600">
                 <Shield size={32} />
               </div>
               <div>
                 <h5 className="text-lg font-black text-slate-900 dark:text-white">Institutional Sync</h5>
                 <p className="text-sm text-slate-500 font-medium">Policy updates are propagated across all employee dashboards instantly. Leave balances will be recalculated based on adjusted allowances.</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Provision User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Provision User</h3>
                <p className="text-blue-100 text-sm">Create institutional access credentials</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input required value={newEmp.name} onChange={(e) => setNewEmp({...newEmp, name: e.target.value})} type="text" placeholder="John Doe" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <input required value={newEmp.email} onChange={(e) => setNewEmp({...newEmp, email: e.target.value})} type="email" placeholder="name@company.com" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Level</label>
                  <select value={newEmp.role} onChange={(e) => setNewEmp({...newEmp, role: e.target.value as UserRole})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500">
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Unit</label>
                  <select value={newEmp.department} onChange={(e) => setNewEmp({...newEmp, department: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500">
                    <option value="">Select Unit</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Provision User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Edit Profile</h3>
                <p className="text-slate-400 text-sm">Updating records for {selectedUser.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={24} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input required value={editEmp.name} onChange={(e) => setEditEmp({...editEmp, name: e.target.value})} type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <input required value={editEmp.email} onChange={(e) => setEditEmp({...editEmp, email: e.target.value})} type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Level</label>
                  <select value={editEmp.role} onChange={(e) => setEditEmp({...editEmp, role: e.target.value as UserRole})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500">
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Unit</label>
                  <select value={editEmp.department} onChange={(e) => setEditEmp({...editEmp, department: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setEditEmp({...editEmp, isActive: !editEmp.isActive})}
                  className={`p-2 rounded-lg transition-all ${editEmp.isActive ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {editEmp.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Account Status</p>
                  <p className={`text-sm font-bold ${editEmp.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {editEmp.isActive ? 'Active - Full Access' : 'Inactive - Access Revoked'}
                  </p>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl">Sync Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 p-10 text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Confirm Deletion</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
              Are you sure you want to remove <span className="text-slate-900 dark:text-white font-bold">{selectedUser.name}</span> from the institutional directory? This action is irreversible.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { onDeleteEmployee(selectedUser.id); setShowDeleteConfirm(false); }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20">Delete Permanentely</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Keep Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail size={24} />
                <h3 className="text-2xl font-black tracking-tight">Direct Email</h3>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={24} /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-8 space-y-6">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}`} alt="" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400">Recipient</p>
                   <p className="text-sm font-bold">{selectedUser.name} &lt;{selectedUser.email}&gt;</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Line</label>
                <input required value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} type="text" placeholder="Institutional update..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Body</label>
                <textarea required rows={6} value={emailForm.body} onChange={(e) => setEmailForm({...emailForm, body: e.target.value})} placeholder="Compose your formal message..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-emerald-500 resize-none" />
              </div>
              <button disabled={isSending} type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50">
                {isSending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                {isSending ? 'Transmitting...' : 'Dispatch Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare size={24} />
                <h3 className="text-2xl font-black tracking-tight">System Alert</h3>
              </div>
              <button onClick={() => setShowNotifModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={24} /></button>
            </div>
            <form onSubmit={handleSendNotif} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alert Level</label>
                <div className="flex gap-2">
                  {['info', 'success', 'warning', 'error'].map(t => (
                    <button key={t} type="button" onClick={() => setNotifForm({...notifForm, type: t as any})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 transition-all ${notifForm.type === t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headline</label>
                <input required value={notifForm.title} onChange={(e) => setNotifForm({...notifForm, title: e.target.value})} type="text" placeholder="Short summary..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</label>
                <textarea required rows={4} value={notifForm.message} onChange={(e) => setNotifForm({...notifForm, message: e.target.value})} placeholder="Detailed instruction..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500 resize-none" />
              </div>
              <button disabled={isSending} type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50">
                {isSending ? <Loader2 className="animate-spin" /> : <Megaphone size={20} />}
                {isSending ? 'Processing...' : 'Send System Alert'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-md shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building size={24} />
                <h3 className="text-2xl font-black tracking-tight">Create Business Unit</h3>
              </div>
              <button onClick={() => setShowUnitModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Name</label>
                <input required value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} type="text" placeholder="e.g. Quality Assurance" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 font-bold dark:text-white outline-none focus:border-emerald-500" />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowUnitModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">Discard</button>
                <button onClick={() => { if(newDeptName) onAddDepartment(newDeptName); setShowUnitModal(false); setNewDeptName(''); }} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Establish Unit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;