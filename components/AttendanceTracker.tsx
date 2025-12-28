import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Zap, 
  ShieldCheck,
  Play,
  Square,
  Download,
  Globe,
  Navigation,
  MapPin,
  AlertCircle,
  FileX,
  History,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Timer,
  CheckCircle2,
  X
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, User } from '../types';

interface AttendanceTrackerProps {
  user: User;
  onCheckIn: (location?: { lat: number; lng: number }) => void;
  onCheckOut: (location?: { lat: number; lng: number }) => void;
  records: AttendanceRecord[];
  shiftStartTime: string;
  shiftEndTime: string;
  requiredHours: number;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ 
  user, 
  onCheckIn, 
  onCheckOut, 
  records, 
  shiftStartTime,
  shiftEndTime,
  requiredHours 
}) => {
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'ready' | 'error'>('idle');
  const [showEarlyOutConfirm, setShowEarlyOutConfirm] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const latestRecord = records.length > 0 ? records[0] : null;
  const isCheckedIn = latestRecord && !latestRecord.checkOut;

  // Pagination Logic
  const totalPages = Math.ceil(records.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return records.slice(start, start + itemsPerPage);
  }, [records, currentPage]);

  const isCurrentlyLate = useMemo(() => {
    if (isCheckedIn) return false;
    const [h, m] = shiftStartTime.split(':').map(Number);
    const shiftStart = new Date();
    shiftStart.setHours(h, m, 0, 0);
    return time.getTime() > shiftStart.getTime();
  }, [time, shiftStartTime, isCheckedIn]);

  const isEarlyOutCondition = useMemo(() => {
    if (!isCheckedIn) return false;
    const [h, m] = shiftEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(h, m, 0, 0);
    return time.getTime() < endTime.getTime();
  }, [time, shiftEndTime, isCheckedIn]);

  const shiftProgress = useMemo(() => {
    if (!isCheckedIn || !latestRecord) return 0;
    const checkInTime = new Date(latestRecord.checkIn.replace(' ', 'T')).getTime();
    const [h, m] = shiftEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(h, m, 0, 0);
    
    const totalDuration = endTime.getTime() - checkInTime;
    const currentElapsed = time.getTime() - checkInTime;
    
    return Math.min(100, Math.max(0, (currentElapsed / totalDuration) * 100));
  }, [time, isCheckedIn, latestRecord, shiftEndTime]);

  const remainingTimeStr = useMemo(() => {
    if (!isCheckedIn || !isEarlyOutCondition) return null;
    const [h, m] = shiftEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(h, m, 0, 0);
    
    const diff = endTime.getTime() - time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${mins}m remaining`;
  }, [time, isCheckedIn, isEarlyOutCondition, shiftEndTime]);

  const fetchLocation = (): Promise<{ lat: number; lng: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsStatus('error');
        resolve(undefined);
        return;
      }
      setGpsStatus('fetching');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsStatus('ready');
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          setGpsStatus('error');
          resolve(undefined);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async () => {
    setLoading(true);
    const location = await fetchLocation();
    setTimeout(() => {
      onCheckIn(location);
      setLoading(false);
    }, 800);
  };

  const handleCheckOutRequest = () => {
    if (isEarlyOutCondition) {
      setShowEarlyOutConfirm(true);
    } else {
      executeCheckOut();
    }
  };

  const executeCheckOut = async () => {
    setLoading(true);
    setShowEarlyOutConfirm(false);
    const location = await fetchLocation();
    setTimeout(() => {
      onCheckOut(location);
      setLoading(false);
    }, 800);
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = ['Date', 'Check-In', 'Check-Out', 'Duration (Hours)', 'Status'];
    const rows = records.map(r => [
      new Date(r.date.replace(' ', 'T')).toLocaleDateString(),
      r.checkIn ? new Date(r.checkIn.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
      r.checkOut ? new Date(r.checkOut.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Ongoing',
      r.workHours.toFixed(2),
      r.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Log_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateStr: string) => new Date(dateStr.replace(' ', 'T'));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col transition-colors duration-300">
          <div className={`${isCheckedIn ? 'bg-blue-600' : (isCurrentlyLate ? 'bg-amber-600' : 'bg-slate-900 dark:bg-slate-800')} p-8 text-center text-white relative overflow-hidden transition-colors duration-500`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <p className="text-white/60 text-sm font-medium mb-2 uppercase tracking-widest">
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h2 className="text-5xl font-black mb-1 tracking-tighter font-mono">
              {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            
            <div className="flex items-center justify-center gap-2 mt-4">
              {isCheckedIn ? (
                <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                  <Timer size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Session Active</span>
                </div>
              ) : isCurrentlyLate ? (
                <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full animate-pulse">
                  <AlertTriangle size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Late Threshold Passed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {gpsStatus === 'ready' ? <span className="text-emerald-400">GPS Locked</span> : 'System Signal Ready'}
                </div>
              )}
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-center gap-8">
            {isCheckedIn && (
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Progress</p>
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    {remainingTimeStr || 'Target Reached'}
                  </p>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isEarlyOutCondition ? 'bg-blue-500' : 'bg-emerald-500'}`}
                    style={{ width: `${shiftProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Play size={16} /></div>
                <div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">Start</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-300">{shiftStartTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Square size={16} /></div>
                <div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">End</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-300">{shiftEndTime}</p>
                </div>
              </div>
            </div>

            {isCheckedIn ? (
              <button 
                onClick={handleCheckOutRequest} 
                disabled={loading} 
                className={`w-full py-5 ${isEarlyOutCondition ? 'bg-slate-800' : 'bg-emerald-600'} hover:opacity-90 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 flex items-center justify-center gap-3 transition-all`}
              >
                {loading ? <Clock className="animate-spin" /> : <Square size={24} fill="white" />} CLOCK OUT
              </button>
            ) : (
              <button 
                onClick={handleCheckIn} 
                disabled={loading} 
                className={`w-full py-5 ${isCurrentlyLate ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 flex items-center justify-center gap-3 transition-all`}
              >
                {loading ? <Clock className="animate-spin" /> : <Play size={24} fill="white" />} 
                {isCurrentlyLate ? 'CHECK IN (LATE)' : 'CHECK IN'}
              </button>
            )}
            <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 text-[10px] font-black tracking-widest uppercase">
              <ShieldCheck size={16} /> GPS & TIME COMPLIANCE ACTIVE
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 transition-colors duration-300 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Attendance Log</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Verified check-in/out session history</p>
            </div>
            <button 
              onClick={handleExportCSV}
              disabled={records.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet size={18} /> Export CSV
            </button>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-12 text-slate-400 dark:text-slate-600">
                <FileX size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No records found</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                    <th className="pb-4">Date</th>
                    <th className="pb-4">In</th>
                    <th className="pb-4">Out</th>
                    <th className="pb-4">Duration</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="group hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors animate-in fade-in duration-300">
                      <td className="py-4 font-bold text-sm">{formatDateTime(record.date).toLocaleDateString()}</td>
                      <td className="py-4 font-mono text-sm">{formatDateTime(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                      <td className="py-4 font-mono text-sm">{record.checkOut ? formatDateTime(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</td>
                      <td className="py-4 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        {record.checkOut ? `${record.workHours.toFixed(2)}h` : '--:--'}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          record.status === AttendanceStatus.PRESENT ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                          record.status === AttendanceStatus.LATE ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                          record.status === AttendanceStatus.EARLY_LEAVING ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800 mt-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-blue-600 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === i + 1 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-blue-600 border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Early Out Confirmation Modal */}
      {showEarlyOutConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black tracking-tight uppercase">Early Departure</h3>
              </div>
              <button onClick={() => setShowEarlyOutConfirm(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                <p className="text-sm font-bold text-red-600 dark:text-red-400 text-center">
                  You are clocking out before the official shift end ({shiftEndTime}).
                </p>
                <p className="text-xs font-medium text-red-500 dark:text-red-400/60 text-center mt-2 italic">
                  This session will be flagged for HR review.
                </p>
              </div>
              
              {remainingTimeStr && (
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Remaining</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{remainingTimeStr}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowEarlyOutConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl uppercase text-xs tracking-widest"
                >
                  Stay in Shift
                </button>
                <button 
                  onClick={executeCheckOut}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 uppercase text-xs tracking-widest active:scale-95 transition-all"
                >
                  Proceed Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;