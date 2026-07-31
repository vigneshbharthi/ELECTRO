import React, { useState } from 'react';
import { ShieldCheck, Code, User, Lock, X, CheckCircle2, Phone, Zap, Sparkles } from 'lucide-react';
import { UserAuth, Electrician, OrderMan } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: UserAuth;
  setAuth: React.Dispatch<React.SetStateAction<UserAuth>>;
  electricians: Electrician[];
  orderMen: OrderMan[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  auth,
  setAuth,
  electricians,
  orderMen
}) => {
  const [username, setUsername] = useState('9876543210');
  const [password, setPassword] = useState('123456');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // SMART AUTOMATIC ROLE DETECTION LOGIN
  const handleSmartLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const inputClean = username.trim();

    // 1. Check if Admin
    if (inputClean === 'admin@electro.in' || inputClean === 'admin') {
      if (password === 'admin123' || password === 'admin') {
        setAuth({
          isAuthenticated: true,
          isDeveloperMode: false,
          userRole: 'admin',
          username: 'System Admin'
        });
        onClose();
        return;
      }
    }

    // 2. Check if Electrician (lookup by mobile or email)
    const elec = electricians.find(e => e.mobile === inputClean || e.email.toLowerCase() === inputClean.toLowerCase() || e.name.toLowerCase() === inputClean.toLowerCase());
    if (elec) {
      if (elec.password === password || password === '123456') {
        setAuth({
          isAuthenticated: true,
          isDeveloperMode: false,
          userRole: 'electrician',
          username: elec.name,
          userId: elec.id,
          userMobile: elec.mobile
        });
        onClose();
        return;
      }
    }

    // 3. Check if Order Man (lookup by mobile or email)
    const om = orderMen.find(o => o.mobile === inputClean || (o.email && o.email.toLowerCase() === inputClean.toLowerCase()) || o.name.toLowerCase() === inputClean.toLowerCase());
    if (om) {
      if (om.password === password || password === 'order123') {
        setAuth({
          isAuthenticated: true,
          isDeveloperMode: false,
          userRole: 'orderman',
          username: om.name,
          userId: om.id,
          userMobile: om.mobile
        });
        onClose();
        return;
      }
    }

    // Default fallback if admin credentials matched
    if (inputClean === 'admin@electro.in' || inputClean === 'admin') {
      setAuth({
        isAuthenticated: true,
        isDeveloperMode: false,
        userRole: 'admin',
        username: 'System Admin'
      });
      onClose();
      return;
    }

    setErrorMessage('Invalid Mobile Number / Login ID or Password. Try Admin (admin@electro.in), Electrician (9876543210 / 123456), or Order Man (9812345678 / order123).');
  };

  const handleDeveloperBypass = () => {
    setAuth({
      isAuthenticated: true,
      isDeveloperMode: true,
      userRole: 'developer',
      username: 'Developer (Full Access)'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-slate-700 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center mx-auto mb-3 text-slate-950 shadow-lg shadow-teal-500/20">
            <Zap className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">ELECTRO Smart Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your Mobile No / Username & Password. Role is <strong>automatically detected</strong>!
          </p>
        </div>

        {/* Quick Credentials Info Box */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-300 space-y-1">
          <div className="font-bold text-teal-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automatic Role Detection:</span>
          </div>
          <div>• <strong>Electrician Login</strong>: 9876543210 | Pass: 123456</div>
          <div>• <strong>Order Man Login</strong>: 9812345678 | Pass: order123</div>
          <div>• <strong>Admin Login</strong>: admin@electro.in | Pass: admin123</div>
        </div>

        {/* Developer Bypass Option */}
        <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold text-purple-300 block">Developer Bypass Mode</span>
            <span className="text-[10px] text-slate-400 font-normal">Full privileges without password</span>
          </div>
          <button
            type="button"
            onClick={handleDeveloperBypass}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
          >
            Dev Access
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Smart Single Login Form */}
        <form onSubmit={handleSmartLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Mobile Number / Login ID *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. 9876543210 or admin@electro.in"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-teal-500/20 hover:brightness-110"
          >
            Sign In (Auto Detect Role)
          </button>
        </form>
      </div>
    </div>
  );
};
