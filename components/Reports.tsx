import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Mail,
  Loader2,
  Calendar,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';
import { AttendanceRecord, User, AttendanceStatus } from '../types';

interface ReportsProps {
  records: AttendanceRecord[];
  onEmailReport?: (to: string, subject: string, body: string) => Promise<void>;
}

const Reports: React.FC<ReportsProps> = ({ records, onEmailReport }) => {
  const [isEmailing, setIsEmailing] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');

  const filteredRecords = useMemo(() => {
    if (dateRange === 'all') return records;
    const cutoff = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    cutoff.setDate(cutoff.getDate() - days);
    
    return records.filter(r => {
      const recDate = new Date(r.date.replace(' ', 'T'));
      return recDate >= cutoff;
    });
  }, [records, dateRange]);

  const stats = useMemo(() => {
    const totalHours = filteredRecords.reduce((acc, rec) => acc + (rec.workHours || 0), 0);
    const presentCount = filteredRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const lateCount = filteredRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const total = filteredRecords.length || 1;
    
    const punctuality = ((presentCount / total) * 100).toFixed(1);
    return {
      totalHours: totalHours.toFixed(0),
      attendance: 94.2, // Mock global metric
      punctuality,
      issues: lateCount
    };
  }, [filteredRecords]);

  const handleDownloadCSV = () => {
    if (filteredRecords.length === 0) return;

    // Define headers
    const headers = ['Date', 'Employee', 'Check-In', 'Check-Out', 'Status', 'Work Hours'];
    
    // Convert records to CSV rows
    const rows = filteredRecords.map(r => [
      new Date(r.date.replace(' ', 'T')).toLocaleDateString(),
      r.userName || 'Unknown',
      r.checkIn ? new Date(r.checkIn.replace(' ', 'T')).toLocaleTimeString([], {hour12: false}) : 'N/A',
      r.checkOut ? new Date(r.checkOut.replace(' ', 'T')).toLocaleTimeString([], {hour12: false}) : 'N/A',
      r.status,
      r.workHours.toFixed(2)
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendify_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailReport = async () => {
    if (!onEmailReport) return;
    setIsEmailing(true);
    const reportSummary = `
      Institutional Performance Report (${dateRange.toUpperCase()})
      -------------------------------
      Total Man-Hours: ${stats.totalHours}h
      Punctuality Rate: ${stats.punctuality}%
      Total Logs Analyzed: ${filteredRecords.length}
      Download the full dataset via the portal analytics hub.
    `;
    try {
      await onEmailReport('management@attendify.com', 'Institutional Analytics Summary', reportSummary);
    } finally {
      setIsEmailing(false);
    }
  };

  const chartData = useMemo(() => {
    const data: Record<string, { hours: number, count: number }> = {};
    filteredRecords.forEach(r => {
      const dateKey = r.date.split(' ')[0];
      if (!data[dateKey]) data[dateKey] = { hours: 0, count: 0 };
      data[dateKey].hours += (r.workHours || 0);
      data[dateKey].count += 1;
    });

    return Object.entries(data)
      .map(([date, val]) => ({
        name: new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        hours: parseFloat(val.hours.toFixed(1)),
        date: date
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  const statusData = useMemo(() => [
    { name: 'Present', value: filteredRecords.filter(r => r.status === AttendanceStatus.PRESENT).length || 0, color: '#10b981' },
    { name: 'Late', value: filteredRecords.filter(r => r.status === AttendanceStatus.LATE).length || 0, color: '#f59e0b' },
    { name: 'Half Day', value: filteredRecords.filter(r => r.status === AttendanceStatus.HALF_DAY).length || 0, color: '#3b82f6' },
    { name: 'On Leave', value: filteredRecords.filter(r => r.status === AttendanceStatus.ON_LEAVE).length || 0, color: '#ef4444' },
  ].filter(s => s.value > 0), [filteredRecords]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Analytics Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Enterprise-wide productivity oversight</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 px-3 text-slate-400 dark:text-slate-600 border-r border-slate-100 dark:border-slate-800">
            <Filter size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Period</span>
          </div>
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'all', label: 'All Time' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setDateRange(opt.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                dateRange === opt.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Man-Hours', value: `${stats.totalHours}h`, trend: '+8%', up: true, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Avg. Attendance', value: `${stats.attendance}%`, trend: '+1.2%', up: true, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Punctuality', value: `${stats.punctuality}%`, trend: '-0.4%', up: false, icon: Activity, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Active Issues', value: stats.issues, trend: 'Normal', up: true, icon: AlertCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className={`${stat.bg} p-4 rounded-2xl transition-colors`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${stat.up ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Institutional Man-Hours</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Daily Hours</span>
               </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--chart-cursor, #f8fafc)'}}
                    contentStyle={{borderRadius: '24px', border: 'none', backgroundColor: 'var(--tooltip-bg, #ffffff)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px'}}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-800 p-10 rounded-[3rem] text-white flex flex-col shadow-2xl transition-colors duration-300">
          <h3 className="text-xl font-black mb-1">Status Allocation</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10">Log distribution for selected period</p>
          
          <div className="flex-1 h-[250px] w-full flex items-center justify-center relative">
            {statusData.length === 0 ? (
              <div className="text-white/20 text-center">
                 <AlertCircle size={40} className="mx-auto mb-2" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Insufficient Data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-black">{filteredRecords.length}</span>
               <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Logs</span>
            </div>
          </div>

          <div className="space-y-4 mt-10">
            {statusData.length > 0 ? statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{backgroundColor: item.color}}></div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.name}</span>
                </div>
                <span className="text-sm font-black text-white">{item.value} Units</span>
              </div>
            )) : (
              <p className="text-center text-[10px] text-slate-600 uppercase font-black tracking-widest">No active units</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[1.5rem] flex items-center justify-center">
             <Download size={28} />
           </div>
           <div>
             <h4 className="text-lg font-black text-slate-800 dark:text-white">Full Analytical Export</h4>
             <p className="text-sm text-slate-400 font-medium">Download the raw attendance dataset for the current period.</p>
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleEmailReport}
            disabled={isEmailing}
            className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {isEmailing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Dispatch to HR
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            <FileSpreadsheet size={16} /> Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;