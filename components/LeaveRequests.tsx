import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  User as UserIcon, 
  X, 
  MailCheck, 
  Settings2,
  Gavel,
  Type as TypeIcon,
  Save,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar as CalendarIcon,
  Tag
} from 'lucide-react';
import { LeaveRequest, LeaveType, LeaveStatus, User, UserRole, LeavePolicy } from '../types';
import { MOCK_USERS } from '../constants';

interface LeaveRequestsProps {
  user: User;
  requests: LeaveRequest[];
  policies: LeavePolicy[];
  onSubmit: (request: Partial<LeaveRequest>) => void;
  onUpdateStatus?: (requestId: string, status: LeaveStatus, sendEmail?: boolean) => void;
  onUpdatePolicy?: (policy: LeavePolicy) => void;
}

const LeaveRequests: React.FC<LeaveRequestsProps> = ({ 
  user, 
  requests, 
  policies, 
  onSubmit, 
  onUpdateStatus,
  onUpdatePolicy
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [activeView, setActiveView] = useState<'mine' | 'team'>(user.role !== UserRole.EMPLOYEE ? 'team' : 'mine');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    type: LeaveType.PAID,
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setShowForm(false);
    setFormData({ type: LeaveType.PAID, startDate: '', endDate: '', reason: '' });
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const leaveBalances = useMemo(() => {
    const myApprovedRequests = requests.filter(r => r.userId === user.id && r.status === LeaveStatus.APPROVED);

    const getUsedDays = (type: LeaveType) => {
      return myApprovedRequests
        .filter(r => r.type === type)
        .reduce((total, r) => total + calculateDays(r.startDate, r.endDate), 0);
    };

    return policies
      .filter(p => p.leave_type !== LeaveType.UNPAID)
      .map(policy => ({
        label: policy.display_name,
        total: policy.allowance,
        used: getUsedDays(policy.leave_type),
        type: policy.leave_type,
        color: policy.leave_type === LeaveType.PAID ? 'bg-blue-500' : 
               policy.leave_type === LeaveType.SICK ? 'bg-emerald-500' :
               policy.leave_type === LeaveType.CASUAL ? 'bg-purple-500' : 'bg-slate-500'
      }));
  }, [requests, user.id, policies]);

  const displayRequests = useMemo(() => {
    const base = activeView === 'mine' ? requests.filter(r => r.userId === user.id) : requests;
    return base.slice().reverse();
  }, [requests, user.id, activeView]);

  // Pagination Logic
  const totalPages = Math.ceil(displayRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayRequests.slice(start, start + itemsPerPage);
  }, [displayRequests, currentPage]);

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Leave Management</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Coordinate time-off and team availability</p>
        </div>
        
        <div className="flex items-center gap-4">
          {user.role !== UserRole.EMPLOYEE && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => { setActiveView('team'); setCurrentPage(1); }}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'team' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Team 
              </button>
              <button 
                onClick={() => { setActiveView('mine'); setCurrentPage(1); }}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'mine' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Personal
              </button>
            </div>
          )}
          
          {isAdmin && (
            <button 
              onClick={() => setShowPolicyModal(true)}
              className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
              title="Manage Leave Policies"
            >
              <Settings2 size={20} />
            </button>
          )}

          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-blue-100 dark:shadow-blue-900/20 transition-all hover:-translate-y-1"
          >
            <Plus size={20} />
            Request Leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center justify-between tracking-tight">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-500 dark:text-blue-400" />
                Annual Balances
              </div>
            </h3>
            <div className="space-y-8">
              {leaveBalances.length === 0 ? (
                <p className="text-center text-xs text-slate-400 font-bold uppercase py-10">No policies configured</p>
              ) : leaveBalances.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.label}</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white">
                        {Math.max(0, item.total - item.used)} Days Left
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-600">{item.used} Taken</span>
                  </div>
                  <div className="h-3 w-full bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`} 
                      style={{ width: `${Math.min(100, (item.used / item.total) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {displayRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-20 text-center transition-colors">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-800">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">No Requests Found</h3>
              <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto">All cleared up!</p>
            </div>
          ) : (
            <>
              <div className="space-y-6 flex-1">
                {paginatedRequests.map((req) => {
                  const reqUser = MOCK_USERS.find(u => u.id === req.userId);
                  return (
                    <div key={req.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group animate-in fade-in duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex gap-5">
                          <div className={`p-4 rounded-2xl flex items-center justify-center h-16 w-16 transition-colors ${
                            req.status === LeaveStatus.APPROVED ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                            req.status === LeaveStatus.REJECTED ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {req.status === LeaveStatus.APPROVED ? <CheckCircle2 size={32} /> : 
                             req.status === LeaveStatus.REJECTED ? <XCircle size={32} /> : <Clock size={32} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                               {activeView === 'team' && (
                                 <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                   <UserIcon size={12} className="text-slate-400" />
                                   <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate">{reqUser?.name || 'User'}</span>
                                 </div>
                               )}
                               <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 dark:text-slate-400 uppercase tracking-widest">{req.status}</span>
                            </div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{req.type} Leave</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
                              {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                              <span className="ml-2 text-slate-400 font-normal">({calculateDays(req.startDate, req.endDate)} days)</span>
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex md:flex-col items-center md:items-end justify-between gap-4">
                          <div className="text-right hidden md:block">
                             <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest mb-1">Logged</p>
                             <p className="text-sm font-black text-slate-800 dark:text-white">{new Date(req.appliedOn).toLocaleDateString()}</p>
                          </div>
                          
                          {activeView === 'team' && req.status === LeaveStatus.PENDING && onUpdateStatus && (
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => onUpdateStatus(req.id, LeaveStatus.REJECTED, true)}
                                  className="p-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-all"
                                >
                                  <XCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => onUpdateStatus(req.id, LeaveStatus.APPROVED, true)}
                                  className="p-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-all"
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-8">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all ${
                          currentPage === i + 1 
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                          : 'bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Leave Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Request Leave</h3>
                <p className="text-blue-100 text-sm font-medium">Provision institutional time-off</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absence Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(LeaveType).map(t => (
                    <button 
                      key={t} 
                      type="button" 
                      onClick={() => setFormData({...formData, type: t})} 
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.type === t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="date" 
                      required 
                      value={formData.startDate} 
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 font-bold dark:text-white outline-none focus:border-blue-500 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="date" 
                      required 
                      value={formData.endDate} 
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 font-bold dark:text-white outline-none focus:border-blue-500 transition-all" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Reason</label>
                <textarea 
                  required 
                  rows={4} 
                  placeholder="Explain your request for time-off..." 
                  value={formData.reason} 
                  onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 font-bold dark:text-white outline-none focus:border-blue-500 transition-all resize-none" 
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"><Send size={18} /> Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Policy Management Modal */}
      {showPolicyModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Institutional Policy</h3>
                <p className="text-slate-400 text-sm font-medium">Manage annual leave allowances</p>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {policies.map(policy => (
                <div key={policy.id} className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">{policy.leave_type} Policy</span>
                    <span className="text-xs font-bold text-slate-400">ID: {policy.id}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Label</label>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          type="text" 
                          value={policy.display_name} 
                          onChange={(e) => onUpdatePolicy && onUpdatePolicy({...policy, display_name: e.target.value})}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-bold text-sm dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Annual Days</label>
                      <div className="relative">
                        <TypeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          type="number" 
                          value={policy.allowance} 
                          onChange={(e) => onUpdatePolicy && onUpdatePolicy({...policy, allowance: parseInt(e.target.value) || 0})}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-bold text-sm dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowPolicyModal(false)}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all"
              >
                Close & Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;