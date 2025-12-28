
import React, { useMemo, useState } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Megaphone,
  PartyPopper,
  ChevronRight,
  Plus,
  X,
  Send,
  Trash2,
  CalendarDays,
  Tag,
  Type,
  AlertTriangle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  XAxis,
  YAxis
} from 'recharts';
import { User, AttendanceRecord, AttendanceStatus, Announcement, UserRole, Holiday, LeaveRequest, LeavePolicy, LeaveStatus, LeaveType } from '../types';

interface DashboardProps {
  user: User;
  records: AttendanceRecord[];
  leaves: LeaveRequest[];
  policies: LeavePolicy[];
  announcements: Announcement[];
  onAddAnnouncement?: (announcement: Partial<Announcement>) => void;
  holidays: Holiday[];
  onAddHoliday?: (holiday: Partial<Holiday>) => void;
  onDeleteHoliday?: (id: string) => void;
  shiftStartTime: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  records, 
  leaves,
  policies,
  announcements, 
  onAddAnnouncement,
  holidays,
  onAddHoliday,
  onDeleteHoliday,
  shiftStartTime
}) => {
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  
  const [newAnnounce, setNewAnnounce] = useState({ title: '', content: '', priority: 'info' as const });
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'national' as const });
  
  const latestRecord = records.length > 0 ? records[0] : null;
  const isCheckedIn = latestRecord && !latestRecord.checkOut;

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

  const handleAnnounceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddAnnouncement) {
      onAddAnnouncement(newAnnounce);
      setShowAnnounceModal(false);
      setNewAnnounce({ title: '', content: '', priority: 'info' });
    }
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddHoliday) {
      onAddHoliday(newHoliday);
      setShowHolidayModal(false);
      setNewHoliday({ name: '', date: '', type: 'national' });
    }
  };

  const parseDate = (dateStr: string) => new Date(dateStr.replace(' ', 'T'));

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRecords = records.filter(r => {
      const d = parseDate(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    let totalMonthlyHours = monthlyRecords.reduce((acc, r) => acc + (r.workHours || 0), 0);
    
    if (isCheckedIn && latestRecord) {
      const start = parseDate(latestRecord.checkIn).getTime();
      const current = new Date().getTime();
      const activeSessionHours = (current - start) / (1000 * 60 * 60);
      totalMonthlyHours += activeSessionHours;
    }

    const lateCount = monthlyRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const uniqueDaysPresent = new Set(monthlyRecords.map(r => r.date.split(' ')[0])).size;
    const attendanceRate = Math.min(Math.round((uniqueDaysPresent / 22) * 100), 100);

    const myApprovedLeaves = leaves.filter(l => 
      l.userId === user.id && 
      l.status === LeaveStatus.APPROVED &&
      l.type !== LeaveType.UNPAID
    );
    
    const totalAllowance = policies
      .filter(p => p.leave_type !== LeaveType.UNPAID)
      .reduce((acc, p) => acc + p.allowance, 0);
    
    const usedDays = myApprovedLeaves.reduce((acc, l) => acc + calculateDays(l.startDate, l.endDate), 0);
    const remainingBalance = Math.max(0, totalAllowance - usedDays);

    return {
      monthlyHours: totalMonthlyHours.toFixed(1),
      attendanceRate: `${attendanceRate}%`,
      lateCount: lateCount.toString(),
      leaveBalance: `${remainingBalance} Days`
    };
  }, [records, leaves, policies, user.id, isCheckedIn, latestRecord]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      const dayHours = records
        .filter(r => r.date.startsWith(dateStr))
        .reduce((acc, r) => acc + (r.workHours || 0), 0);
      result.push({ name: dayName, hours: parseFloat(dayHours.toFixed(1)) });
    }
    return result;
  }, [records]);

  const statConfig = [
    { label: 'Work Hours (Month)', sub: 'Cumulative productivity', value: `${stats.monthlyHours}h`, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Attendance Rate', sub: 'Target: 95%+', value: stats.attendanceRate, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Late Arrivals', sub: `After ${shiftStartTime}`, value: stats.lateCount, icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Leave Balance', sub: 'Eligible paid days', value: stats.leaveBalance, icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statConfig.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 italic mt-0.5">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Weekly Performance</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">Activity logged over the last 7 days</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: 'var(--tooltip-bg, #ffffff)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Megaphone size={20} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Institutional Announcements</h3>
              </div>
              <div className="flex items-center gap-3">
                {canManage && (
                   <button 
                    onClick={() => setShowAnnounceModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all"
                   >
                     <Plus size={16} />
                     New Post
                   </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <Megaphone size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Active Announcements</p>
                </div>
              ) : (
                announcements.slice(0, 4).map(item => (
                  <div key={item.id} className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-2 h-full ${
                      item.priority === 'high' ? 'bg-red-500' : 
                      item.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        item.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 
                        item.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      }`}>
                        {item.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-black text-slate-800 dark:text-white mb-2 truncate">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{item.content}</p>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-400 dark:text-slate-600 italic">By {item.author}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 dark:bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-white/10 p-2 rounded-lg">
                <Clock size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isCheckedIn ? 'bg-emerald-500' : 'bg-white/10 text-white/40'}`}>
                {isCheckedIn ? 'Session Live' : 'Clocked Out'}
              </span>
            </div>
            <h4 className="text-xl font-bold mb-1">Active Session</h4>
            <p className="text-white/60 text-sm mb-6">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            <div className="flex gap-4">
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Check In</p>
                <p className="font-bold text-lg">{isCheckedIn && latestRecord ? parseDate(latestRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Shift</p>
                <p className="font-bold text-lg text-emerald-400">{isCheckedIn ? 'Active' : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                     <PartyPopper size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Upcoming Holidays</h3>
               </div>
               {canManage && (
                 <button 
                  onClick={() => setShowHolidayModal(true)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                 >
                    <Plus size={20} />
                 </button>
               )}
            </div>
            <div className="space-y-6">
              {holidays.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarDays size={32} className="mx-auto text-slate-200 dark:text-slate-800 mb-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No scheduled holidays</p>
                </div>
              ) : holidays.map(holiday => {
                const holidayDate = new Date(holiday.date + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const diffTime = holidayDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isPast = diffDays < 0;

                return (
                  <div key={holiday.id} className={`flex items-center justify-between group ${isPast ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase leading-none mb-0.5">
                          {holidayDate.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-slate-800 dark:text-white leading-none">
                          {holidayDate.getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{holiday.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest">{holiday.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                         <p className={`text-xs font-black ${isPast ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'}`}>
                           {isPast ? 'Passed' : diffDays === 0 ? 'Today' : `${diffDays} Days`}
                         </p>
                         {!isPast && diffDays !== 0 && <p className="text-[9px] font-bold text-slate-400 uppercase">To Go</p>}
                      </div>
                      {canManage && (
                        <button 
                          onClick={() => onDeleteHoliday && onDeleteHoliday(holiday.id)}
                          className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-amber-500 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">New Announcement</h3>
                <p className="text-amber-100 text-sm">Broadcast to entire institution</p>
              </div>
              <button onClick={() => setShowAnnounceModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={24} /></button>
            </div>
            <form onSubmit={handleAnnounceSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headline</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="text" required placeholder="Subject..." value={newAnnounce.title} onChange={(e) => setNewAnnounce({...newAnnounce, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 font-bold dark:text-white outline-none focus:border-amber-500 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Level</label>
                <div className="flex gap-2">
                  {['info', 'medium', 'high'].map(p => (
                    <button key={p} type="button" onClick={() => setNewAnnounce({...newAnnounce, priority: p as any})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newAnnounce.priority === p ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content Body</label>
                <textarea required rows={4} placeholder="Type your message..." value={newAnnounce.content} onChange={(e) => setNewAnnounce({...newAnnounce, content: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 font-bold dark:text-white outline-none focus:border-amber-500 transition-all resize-none" />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowAnnounceModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"><Send size={18} /> Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-purple-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Schedule Holiday</h3>
                <p className="text-purple-100 text-sm">Institutional event planning</p>
              </div>
              <button onClick={() => setShowHolidayModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={24} /></button>
            </div>
            <form onSubmit={handleHolidaySubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Name</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="text" required placeholder="e.g. Winter Break" value={newHoliday.name} onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 font-bold dark:text-white outline-none focus:border-purple-500 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                <div className="flex gap-2">
                  {['national', 'company'].map(t => (
                    <button key={t} type="button" onClick={() => setNewHoliday({...newHoliday, type: t as any})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newHoliday.type === t ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calendar Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="date" required value={newHoliday.date} onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-3.5 font-bold dark:text-white outline-none focus:border-purple-500 transition-all" />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowHolidayModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
