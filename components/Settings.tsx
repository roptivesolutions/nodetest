import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Save, 
  ShieldAlert, 
  Zap, 
  CheckCircle2,
  Loader2,
  Mail,
  Server,
  Lock,
  User as UserIcon,
  Globe,
  Timer
} from 'lucide-react';

interface SettingsProps {
  shiftStartTime: string;
  shiftEndTime: string;
  requiredHours: string;
  onUpdateSetting: (key: string, value: string) => Promise<void>;
  smtpSettings: {
    host: string;
    port: string;
    user: string;
    pass: string;
    fromName: string;
  };
  onUpdateSMTP: (key: string, value: string) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ 
  shiftStartTime, 
  shiftEndTime,
  requiredHours,
  onUpdateSetting, 
  smtpSettings, 
  onUpdateSMTP 
}) => {
  const [localShiftStart, setLocalShiftStart] = useState(shiftStartTime);
  const [localShiftEnd, setLocalShiftEnd] = useState(shiftEndTime);
  const [localReqHours, setLocalReqHours] = useState(requiredHours);
  const [isSavingShift, setIsSavingShift] = useState(false);
  
  const [localSMTP, setLocalSMTP] = useState(smtpSettings);
  const [isSavingSMTP, setIsSavingSMTP] = useState(false);

  const handleSaveShift = async () => {
    setIsSavingShift(true);
    try {
      await onUpdateSetting('shift_start_time', localShiftStart);
      await onUpdateSetting('shift_end_time', localShiftEnd);
      await onUpdateSetting('required_work_hours', localReqHours);
    } finally {
      setIsSavingShift(false);
    }
  };

  const handleSaveSMTP = async () => {
    setIsSavingSMTP(true);
    try {
      await onUpdateSMTP('smtp_host', localSMTP.host);
      await onUpdateSMTP('smtp_port', localSMTP.port);
      await onUpdateSMTP('smtp_user', localSMTP.user);
      await onUpdateSMTP('smtp_pass', localSMTP.pass);
      await onUpdateSMTP('smtp_from_name', localSMTP.fromName);
    } finally {
      setIsSavingSMTP(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
        <div className="p-10 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <SettingsIcon size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">System Configurations</h3>
              <p className="text-slate-400 text-sm font-medium">Manage institutional operational thresholds</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-12">
          {/* Shift Timing Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Clock size={20} />
                <h4 className="font-black text-xs uppercase tracking-widest">Shift Parameters</h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Define the institutional shift window. Clock-outs before the <span className="text-red-500 font-bold">End Time</span> will be flagged as <span className="text-red-500 font-bold uppercase">Early Leaving</span>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Shift Start</label>
                  <input 
                    type="time"
                    value={localShiftStart}
                    onChange={(e) => setLocalShiftStart(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-lg text-center dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Shift End</label>
                  <input 
                    type="time"
                    value={localShiftEnd}
                    onChange={(e) => setLocalShiftEnd(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-lg text-center dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Timer size={14} /> Required Man-Hours per Day
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.5"
                    value={localReqHours}
                    onChange={(e) => setLocalReqHours(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-all font-black text-xl text-center dark:text-white"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">HOURS</span>
                </div>
              </div>

              <button 
                onClick={handleSaveShift}
                disabled={isSavingShift}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {isSavingShift ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSavingShift ? 'UPDATING...' : 'SAVE SHIFT CONFIG'}
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SMTP Configuration Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Mail size={20} />
                <h4 className="font-black text-xs uppercase tracking-widest">SMTP Relay Engine</h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Configure your enterprise SMTP server for automated notifications, reports, and leave approvals. 
              </p>
            </div>

            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Server size={12} /> SMTP Host
                  </label>
                  <input 
                    type="text"
                    value={localSMTP.host}
                    onChange={(e) => setLocalSMTP({...localSMTP, host: e.target.value})}
                    placeholder="smtp.gmail.com"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500 transition-all font-bold text-sm dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Globe size={12} /> Port
                  </label>
                  <input 
                    type="text"
                    value={localSMTP.port}
                    onChange={(e) => setLocalSMTP({...localSMTP, port: e.target.value})}
                    placeholder="587"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500 transition-all font-bold text-sm dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserIcon size={12} /> SMTP User
                  </label>
                  <input 
                    type="text"
                    value={localSMTP.user}
                    onChange={(e) => setLocalSMTP({...localSMTP, user: e.target.value})}
                    placeholder="admin@attendify.com"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500 transition-all font-bold text-sm dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Lock size={12} /> SMTP Password
                  </label>
                  <input 
                    type="password"
                    value={localSMTP.pass}
                    onChange={(e) => setLocalSMTP({...localSMTP, pass: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500 transition-all font-bold text-sm dark:text-white"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSMTP}
                disabled={isSavingSMTP}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {isSavingSMTP ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSavingSMTP ? 'DEPLOYING ENGINE...' : 'SAVE SMTP CONFIG'}
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Institutional Compliance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl w-fit mb-4 shadow-sm">
                <ShieldAlert size={20} className="text-amber-500" />
              </div>
              <h5 className="font-bold text-slate-800 dark:text-white mb-2">Grace Period</h5>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">Standard 5-minute variance is currently applied institutional-wide.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl w-fit mb-4 shadow-sm">
                <Zap size={20} className="text-blue-500" />
              </div>
              <h5 className="font-bold text-slate-800 dark:text-white mb-2">Auto-Reporting</h5>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">Weekly performance digests are dispatched to Management every Sunday.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl w-fit mb-4 shadow-sm">
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
              <h5 className="font-bold text-slate-800 dark:text-white mb-2">GPS Verification</h5>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">Active: Location coordinates required for all clock-in events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;