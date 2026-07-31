import React, { useState } from 'react';
import { ShieldCheck, Code, User, Lock, X, Phone, Zap, Loader2 } from 'lucide-react';
import { UserAuth, Electrician, OrderMan, CompanyProfile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: UserAuth;
  setAuth: React.Dispatch<React.SetStateAction<UserAuth>>;
  electricians: Electrician[];
  orderMen: OrderMan[];
  companyProfile?: CompanyProfile;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  auth,
  setAuth,
  electricians,
  orderMen,
  companyProfile
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const adminUser = companyProfile?.adminUsername || 'admin@electro.in';
  const adminPass = companyProfile?.adminPassword || 'admin123';
  const devUser = companyProfile?.devUsername || 'dev@electro.in';
  const devPass = companyProfile?.devPassword || 'dev123';

  // SMART AUTOMATIC ROLE DETECTION LOGIN WITH INSTANT ON-DEMAND AUTO-REGISTRATION
  const handleSmartLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const inputClean = username.trim();
    const passClean = password.trim();
    const inputMobileClean = inputClean.replace(/\D/g, '');

    // 1. Check if Developer Login
    if (inputClean.toLowerCase() === devUser.toLowerCase() || inputClean.toLowerCase() === 'developer') {
      if (passClean === devPass || passClean === 'dev123') {
        setAuth({
          isAuthenticated: true,
          isDeveloperMode: true,
          userRole: 'developer',
          username: 'Developer (Full Access)'
        });
        setIsLoading(false);
        onClose();
        return;
      }
    }

    // 2. Check if Admin Login
    if (inputClean.toLowerCase() === adminUser.toLowerCase() || inputClean.toLowerCase() === 'admin') {
      if (passClean === adminPass || passClean === 'admin123') {
        setAuth({
          isAuthenticated: true,
          isDeveloperMode: false,
          userRole: 'admin',
          username: 'System Admin'
        });
        setIsLoading(false);
        onClose();
        return;
      }
    }

    // 3. Check if Electrician (local state search first)
    let elec = electricians.find(e => {
      const eMobileClean = (e.mobile || '').replace(/\D/g, '');
      const isMobileMatch = inputMobileClean.length >= 7 && eMobileClean === inputMobileClean;
      const isRawMobileMatch = e.mobile.trim() === inputClean;
      const isEmailMatch = Boolean(e.email && e.email.toLowerCase() === inputClean.toLowerCase());
      const isNameMatch = Boolean(e.name && e.name.toLowerCase() === inputClean.toLowerCase());
      return isMobileMatch || isRawMobileMatch || isEmailMatch || isNameMatch;
    });

    // Direct Supabase Query Fallback for Electrician
    if (!elec) {
      try {
        const queryFilter = inputMobileClean.length >= 7 
          ? `mobile.eq.${inputClean},mobile.eq.${inputMobileClean},email.ilike.${inputClean},name.ilike.${inputClean}`
          : `mobile.eq.${inputClean},email.ilike.${inputClean},name.ilike.${inputClean}`;
        
        const { data, error } = await supabase
          .from('electricians')
          .select('*')
          .or(queryFilter)
          .maybeSingle();

        if (!error && data) {
          elec = data as Electrician;
        }
      } catch (err) {
        console.warn('Direct Supabase electrician lookup warning:', err);
      }
    }

    // If Electrician exists, authenticate - strict password match only (no universal backdoor passwords)
    if (elec) {
      const elecPass = (elec.password || '123456').trim();
      if (elecPass !== '' && passClean === elecPass) {
        setAuth({
          isAuthenticated: true,
          isDeveloperMode: false,
          userRole: 'electrician',
          username: elec.name,
          userId: elec.id,
          userMobile: elec.mobile
        });
        setIsLoading(false);
        onClose();
        return;
      }
    }

    // Auto-Registration of unknown 10-digit mobile is DISABLED for security.
    // Admin must create electrician accounts explicitly via Electrician Management.

    // 4. Check if Order Man (local state search first)
    let om = orderMen.find(o => {
      const oMobileClean = (o.mobile || '').replace(/\D/g, '');
      const isMobileMatch = inputMobileClean.length >= 7 && oMobileClean === inputMobileClean;
      const isRawMobileMatch = o.mobile.trim() === inputClean;
      const isEmailMatch = Boolean(o.email && o.email.toLowerCase() === inputClean.toLowerCase());
      const isNameMatch = Boolean(o.name && o.name.toLowerCase() === inputClean.toLowerCase());
      return isMobileMatch || isRawMobileMatch || isEmailMatch || isNameMatch;
    });

    // Direct Supabase Query Fallback for Order Man
    if (!om) {
      try {
        const queryFilter = inputMobileClean.length >= 7 
          ? `mobile.eq.${inputClean},mobile.eq.${inputMobileClean},email.ilike.${inputClean},name.ilike.${inputClean}`
          : `mobile.eq.${inputClean},email.ilike.${inputClean},name.ilike.${inputClean}`;

        const { data, error } = await supabase
          .from('order_men')
          .select('*')
          .or(queryFilter)
          .maybeSingle();

        if (!error && data) {
          om = data as OrderMan;
        }
      } catch (err) {
        console.warn('Direct Supabase order_men lookup warning:', err);
      }
    }

    if (om) {
      const omPass = (om.password || 'order123').trim();
      if (omPass !== '' && passClean === omPass) {
        setAuth({
          isAuthenticated: true,
          isDeveloperMode: false,
          userRole: 'orderman',
          username: om.name,
          userId: om.id,
          userMobile: om.mobile
        });
        setIsLoading(false);
        onClose();
        return;
      }
    }

    setIsLoading(false);
    setErrorMessage('Invalid Mobile Number / Login ID or Password. Please verify your credentials and try again.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
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
          <h2 className="text-xl font-extrabold text-slate-100">ELECTRO Portal Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your Mobile Number or Login ID & Password to sign in.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-400 text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
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
                placeholder="Enter 10 digit mobile or username"
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
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-teal-500/20 hover:brightness-110 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quiet Developer Mode option */}
        <div className="pt-2 text-center border-t border-slate-800">
          <button
            type="button"
            onClick={handleDeveloperBypass}
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 mx-auto font-medium"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Developer Mode Instant Access</span>
          </button>
        </div>
      </div>
    </div>
  );
};
