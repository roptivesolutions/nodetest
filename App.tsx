import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, AttendanceRecord, UserRole, AttendanceStatus, LeaveRequest, LeaveStatus, LeaveType, Announcement, Holiday, AppNotification, LeavePolicy } from './types';
import { storage } from './services/storage';
import { api } from './services/api';
import { MOCK_ANNOUNCEMENTS, MOCK_HOLIDAYS, MOCK_USERS } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AttendanceTracker from './components/AttendanceTracker';
import LeaveRequests from './components/LeaveRequests';
import Reports from './components/Reports';
import EmployeeDirectory from './components/EmployeeDirectory';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { LogIn, ShieldAlert, KeyRound, Mail, CheckCircle2, Loader2, WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storage.get('current_user', null));
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(storage.get('theme', 'light'));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({ 
    shift_start_time: '09:00',
    shift_end_time: '18:00',
    required_work_hours: '8'
  });
  const [toast, setToast] = useState<string | null>(null);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [loginView, setLoginView] = useState<'login' | 'forgot'>('login');

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    try {
      const promises = {
        att: api.attendance.getLogs(user.id, user.role, signal),
        leave: api.leaves.get(user.id, user.role, signal),
        ann: api.announcements.get(signal),
        hol: api.holidays.get(signal),
        notif: api.notifications.get(user.id, signal),
        emp: user.role !== UserRole.EMPLOYEE ? api.directory.getEmployees(signal) : Promise.resolve([]),
        dept: user.role !== UserRole.EMPLOYEE ? api.directory.getDepartments(signal) : Promise.resolve([]),
        pol: api.policies.get(signal),
        set: api.settings.get(signal)
      };

      const results = await Promise.allSettled(Object.values(promises));
      const keys = Object.keys(promises);
      const data: Record<string, any> = {};
      
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          data[keys[idx]] = res.value;
        }
      });

      const isCriticalFailed = results.some(r => r.status === 'rejected' && (r.reason.message === 'Failed to fetch' || r.reason.message?.includes('Network')));
      setIsOfflineMode(isCriticalFailed);

      if (data.att) {
        setRecords(data.att.map((r: any) => ({
          id: String(r.id),
          userId: String(r.user_id),
          userName: r.user_name || user.name,
          date: r.check_in,
          checkIn: r.check_in,
          checkOut: r.check_out || undefined,
          status: r.status as AttendanceStatus,
          workHours: r.work_hours ? parseFloat(r.work_hours) : 0,
          location: r.lat_in ? { lat: parseFloat(r.lat_in), lng: parseFloat(r.lng_in) } : undefined,
          checkOutLocation: r.lat_out ? { lat: parseFloat(r.lat_out), lng: parseFloat(r.lng_out) } : undefined
        })));
      }

      if (data.leave) {
        setLeaves(data.leave.map((l: any) => ({
          id: String(l.id),
          userId: String(l.user_id),
          type: l.type as LeaveType,
          startDate: l.start_date,
          endDate: l.end_date,
          reason: l.reason,
          status: l.status as LeaveStatus,
          appliedOn: l.applied_on
        })));
      }

      if (data.ann) {
        setAnnouncements(data.ann.map((a: any) => ({
          id: String(a.id),
          title: a.title,
          content: a.content,
          author: a.author,
          date: a.created_at,
          priority: a.priority
        })));
      }

      if (data.hol) setHolidays(data.hol.map((h: any) => ({ ...h, id: String(h.id) })));
      if (data.notif) {
        setNotifications(data.notif.map((n: any) => ({
          id: String(n.id),
          userId: String(n.user_id),
          title: n.title,
          message: n.message,
          type: n.type,
          read: Boolean(parseInt(n.is_read)),
          timestamp: n.created_at
        })));
      }
      
      if (data.emp) setEmployees(data.emp.map((e: any) => ({ ...e, id: String(e.id), isActive: Boolean(parseInt(e.is_active)) })));
      if (data.dept) setDepartments(data.dept.map((d: any) => ({ ...d, id: String(d.id) })));
      if (data.pol) setPolicies(data.pol.map((p: any) => ({ ...p, id: String(p.id) })));
      if (data.set) setSystemSettings(data.set);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Data sync engine failure:', err);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (loading) return;
      handleLogout();
      setToast("Session expired. Please log in again.");
    };
    window.addEventListener('attendify-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('attendify-unauthorized', handleUnauthorized);
  }, [loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchData]);

  const userRecords = useMemo(() => {
    if (!user) return [];
    return records.filter(r => String(r.userId) === String(user.id));
  }, [records, user]);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications;
  }, [notifications, user]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storage.set('theme', theme);
  }, [theme]);

  useEffect(() => { storage.set('current_user', user); }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const handleClearNotifications = async () => {
    if (!user) return;
    try {
      await api.notifications.clear(user.id);
      setNotifications([]);
    } catch (err) {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login({ email: loginEmail, password: loginPass });
      const authenticatedUser = {
        ...res.user,
        id: String(res.user.id)
      };
      storage.set('current_user', authenticatedUser);
      setUser(authenticatedUser);
      setToast(`Welcome back, ${res.user.name}`);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      setActiveTab('dashboard');
      storage.set('current_user', null);
      storage.set('csrf_token', null);
    }
  };

  const handleCheckIn = async (location?: { lat: number; lng: number }) => {
    if (!user) return;
    
    const now = new Date();
    const [shiftHour, shiftMinute] = (systemSettings.shift_start_time || '09:00').split(':').map(Number);
    const shiftStart = new Date();
    shiftStart.setHours(shiftHour, shiftMinute, 0, 0);
    
    // Check-in before time is PRESENT, after is LATE
    const isLate = now.getTime() > shiftStart.getTime();
    const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    try {
      await api.attendance.checkIn(user.id, {
        lat: location?.lat,
        lng: location?.lng,
        device: navigator.userAgent,
        status: status
      });
      setToast(isLate ? "Clocked in (Late Arrival)." : "Clocked in successfully.");
      fetchData();
    } catch (err: any) {
      setToast(`Sync Error: ${err.message}`);
    }
  };

  const handleCheckOut = async (location?: { lat: number; lng: number }) => {
    if (!user) return;
    
    const now = new Date();
    const [endHour, endMinute] = (systemSettings.shift_end_time || '18:00').split(':').map(Number);
    const shiftEnd = new Date();
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    const isEarly = now.getTime() < shiftEnd.getTime();
    const status = isEarly ? AttendanceStatus.EARLY_LEAVING : undefined;

    try {
      await api.attendance.checkOut(user.id, {
        lat: location?.lat,
        lng: location?.lng,
        status: status // Server should handle updating status if provided
      });
      setToast(isEarly ? "Shift closed (Early Departure recorded)." : "Shift closed successfully.");
      fetchData();
    } catch (err: any) {
      setToast(`Sync Error: ${err.message}`);
    }
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    setToast("SMTP: Dispatching mail...");
    try {
      await api.email.send(to, subject, body);
      setToast("Email sent.");
    } catch (err: any) {
      setToast(`SMTP Error: ${err.message}`);
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleSendNotification = async (data: any) => {
    try {
      await api.notifications.post({
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type
      });
      setToast(`Notification dispatched.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleLeaveSubmit = async (data: Partial<LeaveRequest>) => {
    if (!user) return;
    try {
      await api.leaves.submit({
        user_id: user.id,
        type: data.type,
        start_date: data.startDate,
        end_date: data.endDate,
        reason: data.reason
      });
      setToast("Leave request submitted.");
      fetchData();
    } catch (err: any) {
      setToast(`Sync Error: ${err.message}`);
    }
  };

  const handleUpdateLeaveStatus = async (requestId: string, status: LeaveStatus, sendEmail: boolean = false) => {
    try {
      await api.leaves.updateStatus(requestId, status);
      setToast(`Status updated to ${status}.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleUpdatePolicy = async (policy: LeavePolicy) => {
    try {
      await api.policies.update(policy);
      setToast(`Policy updated.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleUpdateShiftTime = async (key: string, time: string) => {
    try {
      await api.settings.update(key, time);
      setToast(`Setting updated.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleUpdateSMTPSetting = async (key: string, value: string) => {
    try {
      await api.settings.update(key, value);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleAddEmployee = async (newEmployee: User) => {
    try {
      await api.directory.addEmployee({
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        department_id: departments.find(d => d.name === newEmployee.department)?.id
      });
      setToast(`Employee ${newEmployee.name} created.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleUpdateEmployee = async (id: string, updatedData: Partial<User>) => {
    try {
      await api.directory.updateEmployee(id, {
        name: updatedData.name,
        email: updatedData.email,
        role: updatedData.role,
        department_id: departments.find(d => d.name === updatedData.department)?.id,
        isActive: updatedData.isActive
      });
      setToast(`Profile updated.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await api.directory.deleteEmployee(id);
      setToast(`User removed.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleUpdatePassword = async (newPassword: string) => {
    if (!user) return;
    setToast("Identity key update triggered.");
  };

  const handleUpdateAvatar = async (avatar: string) => {
    if (!user) return;
    try {
      const res = await api.profile.updateAvatar(user.id, avatar);
      setUser(prev => prev ? { ...prev, avatar: res.avatar } : null);
      setToast("Profile photo updated.");
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleAddAnnouncement = async (announcement: Partial<Announcement>) => {
    if (!user) return;
    try {
      await api.announcements.post({
        title: announcement.title,
        content: announcement.content,
        author_id: user.id,
        priority: announcement.priority
      });
      setToast("Announcement posted.");
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleAddDepartment = async (name: string) => {
    try {
      await api.directory.addDepartment(name);
      setToast(`Unit created.`);
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleUpdateDepartment = async (oldName: string, newName: string) => {
    const dept = departments.find(d => d.name === oldName);
    if (!dept) return;
    try {
      await api.directory.updateDepartment(dept.id, newName);
      setToast("Unit updated.");
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteDepartment = async (name: string) => {
    const dept = departments.find(d => d.name === name);
    if (!dept) return;
    try {
      await api.directory.deleteDepartment(dept.id);
      setToast("Unit removed.");
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleAddHoliday = async (holiday: Partial<Holiday>) => {
    try {
      await api.holidays.post({
        name: holiday.name,
        date: holiday.date,
        type: holiday.type
      });
      setToast("Holiday added.");
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await api.holidays.delete(id);
      setToast("Holiday removed.");
      fetchData();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            records={userRecords} 
            leaves={leaves}
            policies={policies}
            announcements={announcements}
            onAddAnnouncement={handleAddAnnouncement}
            holidays={holidays}
            onAddHoliday={handleAddHoliday}
            onDeleteHoliday={handleDeleteHoliday}
            shiftStartTime={systemSettings.shift_start_time || '09:00'}
          />
        );
      case 'attendance':
        return (
          <AttendanceTracker 
            user={user} 
            records={userRecords} 
            onCheckIn={handleCheckIn} 
            onCheckOut={handleCheckOut} 
            shiftStartTime={systemSettings.shift_start_time || '09:00'}
            shiftEndTime={systemSettings.shift_end_time || '18:00'}
            requiredHours={parseFloat(systemSettings.required_work_hours || '8')}
          />
        );
      case 'leaves':
        return (
          <LeaveRequests 
            user={user} 
            requests={leaves} 
            policies={policies}
            onSubmit={handleLeaveSubmit} 
            onUpdateStatus={user.role !== UserRole.EMPLOYEE ? handleUpdateLeaveStatus : undefined}
            onUpdatePolicy={handleUpdatePolicy}
          />
        );
      case 'directory':
        return (
          <EmployeeDirectory 
            currentUser={user} 
            employees={employees} 
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            departments={departments.map(d => d.name)}
            onAddDepartment={handleAddDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onSendNotification={handleSendNotification}
            onSendEmail={handleSendEmail}
            policies={policies}
            onUpdatePolicy={handleUpdatePolicy}
          />
        );
      case 'reports':
        return <Reports records={records} onEmailReport={handleSendEmail} />;
      case 'profile':
        return <Profile user={user} onUpdatePassword={handleUpdatePassword} onUpdateAvatar={handleUpdateAvatar} />;
      case 'settings':
        return (
          <Settings 
            shiftStartTime={systemSettings.shift_start_time || '09:00'} 
            shiftEndTime={systemSettings.shift_end_time || '18:00'}
            requiredHours={systemSettings.required_work_hours || '8'}
            onUpdateSetting={handleUpdateShiftTime}
            smtpSettings={{
              host: systemSettings.smtp_host || '',
              port: systemSettings.smtp_port || '',
              user: systemSettings.smtp_user || '',
              pass: systemSettings.smtp_pass || '',
              fromName: systemSettings.smtp_from_name || ''
            }}
            onUpdateSMTP={handleUpdateSMTPSetting}
          />
        );
      default:
        return <Dashboard user={user} records={userRecords} leaves={leaves} policies={policies} announcements={announcements} holidays={holidays} shiftStartTime={systemSettings.shift_start_time || '09:00'} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-slate-800">
          <div className="p-10 bg-blue-600 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">AMS Pro</h2>
            <p className="text-blue-100 text-sm font-medium italic">Institutional Access Portal</p>
          </div>
          
          <div className="p-10 space-y-6">
            {loginView === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                    <ShieldAlert size={16} />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail size={12} /> Email
                  </label>
                  <input 
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@ams-pro.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all font-bold dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <KeyRound size={12} /> Access Key
                    </label>
                    <button type="button" onClick={() => setLoginView('forgot')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Forgot?</button>
                  </div>
                  <input 
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all font-bold dark:text-white"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 dark:shadow-blue-900/20 hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                  {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
                </button>
              </form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="text-center space-y-2 mb-4">
                   <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Recovery</h3>
                   <p className="text-xs text-slate-400 font-medium">A reset link will be dispatched to your email.</p>
                </div>
                <input 
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 font-bold dark:text-white"
                />
                <button 
                  onClick={() => { setToast("Recovery link dispatched."); setLoginView('login'); }}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 transition-all"
                >
                  SEND RESET LINK
                </button>
                <button 
                  onClick={() => setLoginView('login')}
                  className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      theme={theme}
      setTheme={setTheme}
      notifications={userNotifications}
      onMarkNotifRead={handleMarkNotifRead}
      onClearNotifications={handleClearNotifications}
    >
      {isOfflineMode && (
        <div className="bg-amber-500 text-white px-8 py-2.5 flex items-center justify-between text-xs font-black uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <WifiOff size={16} />
             <span>Offline Preview Mode</span>
           </div>
           <button onClick={() => fetchData()} className="flex items-center gap-1 hover:underline">
             <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
             Reconnect
           </button>
        </div>
      )}
      {renderContent()}
      {toast && (
        <div className="fixed bottom-24 right-6 z-[110] bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 border border-white/10">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest">{toast}</span>
        </div>
      )}
    </Layout>
  );
};

export default App;