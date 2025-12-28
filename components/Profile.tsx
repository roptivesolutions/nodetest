
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  Building, 
  Shield, 
  Check, 
  AlertCircle, 
  Loader2, 
  Camera, 
  Upload, 
  Trash2, 
  X,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdatePassword: (newPassword: string) => void;
  onUpdateAvatar: (avatar: string) => Promise<void>;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdatePassword, onUpdateAvatar }) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Camera Modal State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPass.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      await api.profile.updatePassword({
        user_id: user.id,
        current_password: currentPass,
        new_password: newPass
      });
      setMessage({ type: 'success', text: 'Identity key updated successfully!' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File is too large. Max 2MB allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsAvatarLoading(true);
        try {
          await onUpdateAvatar(reader.result as string);
        } finally {
          setIsAvatarLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1024, height: 1024, facingMode: 'user' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Unable to access camera. Please check your permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
        canvasRef.current.width = 512;
        canvasRef.current.height = 512;
        
        // Center crop
        const startX = (videoRef.current.videoWidth - size) / 2;
        const startY = (videoRef.current.videoHeight - size) / 2;
        
        context.drawImage(videoRef.current, startX, startY, size, size, 0, 0, 512, 512);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
        
        setIsAvatarLoading(true);
        try {
          await onUpdateAvatar(dataUrl);
          stopCamera();
        } finally {
          setIsAvatarLoading(false);
        }
      }
    }
  };

  const removeAvatar = async () => {
    if (window.confirm("Remove current photo and revert to institutional default initials?")) {
      setIsAvatarLoading(true);
      try {
        await onUpdateAvatar('');
      } finally {
        setIsAvatarLoading(false);
      }
    }
  };

  const currentAvatar = user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=200`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Avatar Management */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center transition-all relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            
            <div className="relative inline-block mb-6 group">
              {isAvatarLoading && (
                <div className="absolute inset-0 z-20 bg-black/40 rounded-[3rem] flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="text-white animate-spin" size={40} />
                </div>
              )}
              <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-xl transition-all group-hover:shadow-blue-500/20">
                <img 
                  src={currentAvatar} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt={user.name} 
                />
              </div>
              
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-lg border-4 border-white dark:border-slate-900">
                <Shield size={20} />
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 mb-6">{user.role}</p>

            <div className="space-y-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
              >
                <Upload size={18} />
                Upload from Local
              </button>
              <button 
                onClick={startCamera}
                className="w-full py-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-100 dark:border-slate-800 transition-all active:scale-95"
              >
                <Camera size={18} />
                Capture with Camera
              </button>
              {user.avatar && (
                <button 
                  onClick={removeAvatar}
                  className="w-full py-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-red-50 dark:border-red-900/30 transition-all active:scale-95"
                >
                  <Trash2 size={18} />
                  Remove Photo
                </button>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleFileUpload}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
             <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                  <Mail size={18} className="text-blue-500" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Institutional Email</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
                </div>
             </div>
             <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                  <Building size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Business Unit</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.department}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Security Controls */}
        <div className="lg:col-span-2 w-full bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Management</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Institutional security protocols</p>
            </div>
            <div className="hidden sm:block p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Shield size={24} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {message && (
              <div className={`flex items-center gap-3 p-5 rounded-[1.5rem] animate-in fade-in slide-in-from-top-2 border ${
                message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
              }`}>
                {message.type === 'success' ? <Check size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Lock size={14} className="text-slate-300" /> Existing Access Key
                </label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all font-bold dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Proposed Access Key</label>
                  <input 
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all font-bold dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Confirm Identity Protocol</label>
                  <input 
                    type="password"
                    required
                    placeholder="Re-enter access key"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all font-bold dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto px-12 py-5 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-[1.5rem] hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl shadow-slate-200 dark:shadow-blue-900/30 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Shield size={20} />}
                {isLoading ? 'DEPLOYING KEY...' : 'SYNC SECURITY KEY'}
              </button>
            </div>
          </form>

          <div className="mt-12 p-8 bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4 text-slate-400 dark:text-slate-600">
               <ImageIcon size={24} />
               <div>
                 <h4 className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Media Policy</h4>
                 <p className="text-[10px] font-medium leading-relaxed mt-1">Profile photos are visible institutional-wide for identity verification. Supported formats: PNG, JPEG, WEBP. Max size 2MB.</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[150] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-500 overflow-hidden border border-white/10">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                  <Camera size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Headshot Capture</h3>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Neural ID Verification</p>
                </div>
              </div>
              <button onClick={stopCamera} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="aspect-square bg-slate-950 rounded-[2.5rem] overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-2xl relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-80 border-2 border-dashed border-blue-500/50 rounded-full"></div>
                </div>
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div> REC
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-4">
                <button 
                  onClick={stopCamera}
                  className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                >
                  Discard
                </button>
                <button 
                  onClick={capturePhoto}
                  className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase text-xs tracking-widest"
                >
                  <Sparkles size={20} />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
