
import React, { useState, useRef, useEffect } from 'react';
import { UserRole, User, AppNotification } from '../types';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  Settings as SettingsIcon, 
  Users, 
  Clock, 
  Bell, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Briefcase,
  User as UserIcon,
  Sun,
  Moon,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Check
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  notifications: AppNotification[];
  onMarkNotifRead: (id: string) => void;
  onClearNotifications: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  user, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  children, 
  theme, 
  setTheme,
  notifications,
  onMarkNotifRead,
  onClearNotifications
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    { id: 'attendance', label: 'My Attendance', icon: CalendarCheck, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    { id: 'leaves', label: 'Leave Requests', icon: FileText, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    { id: 'directory', label: 'Directory', icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'reports', label: 'Reports', icon: Briefcase, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'profile', label: 'Profile', icon: UserIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: [UserRole.ADMIN] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col z-40`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-slate-800 dark:text-white text-xl tracking-tight">AMS<span className="text-blue-600">Pro</span></span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              {isSidebarOpen && activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors`}
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between z-30 shrink-0 transition-colors duration-300">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
              {filteredNavItems.find(i => i.id === activeTab)?.label || 'Overview'}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Welcome back, {user.name}</p>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{user.role}</span>
            </div>
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800 rounded-full relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                    <button 
                      onClick={onClearNotifications}
                      className="text-[10px] font-black uppercase text-blue-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell size={32} className="mx-auto mb-2 text-slate-200" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-5 border-b border-slate-50 dark:border-slate-800 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors relative group ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                        >
                          <div className="mt-1">{getNotifIcon(notif.type)}</div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{notif.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-2 block">{formatTimestamp(notif.timestamp)}</span>
                          </div>
                          {!notif.read && (
                            <button 
                              onClick={() => onMarkNotifRead(notif.id)}
                              className="absolute top-5 right-5 p-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
