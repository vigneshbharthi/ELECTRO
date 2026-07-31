import React, { useState } from 'react';
import { Settings, Sliders, Database, Save, CheckCircle2, ShieldCheck, UserPlus, Key } from 'lucide-react';
import { AppSettings, UserAuth, CompanyProfile } from '../types';

interface SettingsModuleProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  auth: UserAuth;
  setAuth: React.Dispatch<React.SetStateAction<UserAuth>>;
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
}

const AdminCredentialsManager: React.FC<{
  companyProfile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
}> = ({ companyProfile, onSave }) => {
  const [form, setForm] = useState({
    adminUsername: companyProfile.adminUsername,
    adminPassword: companyProfile.adminPassword,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.adminUsername.trim() || !form.adminPassword.trim()) {
      alert('Username and password cannot be empty.');
      return;
    }
    if (form.adminPassword !== confirmPassword) {
      alert('Password and confirm password do not match.');
      return;
    }
    onSave({ ...companyProfile, adminUsername: form.adminUsername.trim(), adminPassword: form.adminPassword });
    setSavedAt(Date.now());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="bg-teal-500/10 border border-teal-500/30 p-3 rounded-xl">
        <p className="text-[11px] text-slate-300">
          Set or update the Admin login credentials. The Admin uses these to sign in via the portal.
          Only the Developer account can change them.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Admin Username *</label>
          <input
            type="text"
            required
            value={form.adminUsername}
            onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
            className="w-full px-3 py-2 rounded-xl glass-input font-mono"
          />
        </div>
        <div>
          <label className="block text-slate-300 font-medium mb-1">New Admin Password *</label>
          <input
            type="password"
            required
            value={form.adminPassword}
            onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
            className="w-full px-3 py-2 rounded-xl glass-input font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Confirm New Password *</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        {savedAt && Date.now() - savedAt < 3000 && (
          <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Admin credentials updated
          </span>
        )}
        <button
          type="submit"
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold hover:brightness-110"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Save Admin Credentials</span>
        </button>
      </div>
    </form>
  );
};

const CreateAdminManager: React.FC<{
  onCreate: (profile: CompanyProfile) => void;
}> = ({ onCreate }) => {
  const [form, setForm] = useState({
    companyName: 'ELECTRO Electricals & Enterprise',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    newAdminUsername: '',
    newAdminPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.newAdminUsername.trim() || !form.newAdminPassword.trim()) {
      alert('Admin username and password are required.');
      return;
    }
    if (form.newAdminPassword.length < 6) {
      alert('Admin password must be at least 6 characters.');
      return;
    }
    const profile: CompanyProfile = {
      companyName: form.companyName.trim() || 'ELECTRO',
      gstin: form.gstin,
      phone: form.phone,
      email: form.email,
      address: form.address,
      adminUsername: form.newAdminUsername.trim(),
      adminPassword: form.newAdminPassword,
      devUsername: 'dev@electro.in',
      devPassword: 'dev123',
    };
    onCreate(profile);
    alert(`New Admin account "${profile.adminUsername}" has been created. They can log in immediately.`);
    setForm({ ...form, newAdminUsername: '', newAdminPassword: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl">
        <p className="text-[11px] text-slate-300">
          <strong className="text-purple-300">Onboard a new Admin</strong> with their own login. The new Admin can use their username + password to sign in. This overrides the existing Admin credential.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Admin Username *</label>
          <input
            type="text"
            required
            placeholder="e.g. manager@electro.in"
            value={form.newAdminUsername}
            onChange={(e) => setForm({ ...form, newAdminUsername: e.target.value })}
            className="w-full px-3 py-2 rounded-xl glass-input font-mono"
          />
        </div>
        <div>
          <label className="block text-slate-300 font-medium mb-1">Admin Password *</label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Minimum 6 characters"
            value={form.newAdminPassword}
            onChange={(e) => setForm({ ...form, newAdminPassword: e.target.value })}
            className="w-full px-3 py-2 rounded-xl glass-input font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-slate-800">
        <button
          type="submit"
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create / Replace Admin</span>
        </button>
      </div>
    </form>
  );
};

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  setSettings,
  auth,
  setAuth,
  companyProfile,
  onSaveCompanyProfile
}) => {
  const [percentDraft, setPercentDraft] = useState<number>(
    Number.isFinite(settings.pointsPercent) && settings.pointsPercent > 0 ? settings.pointsPercent : 1
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    if (!Number.isFinite(percentDraft) || percentDraft <= 0 || percentDraft > 100) {
      alert('Please enter a valid percentage between 0.1 and 100.');
      return;
    }
    setSettings(prev => ({ ...prev, pointsPercent: percentDraft }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const currentPercent = Number.isFinite(settings.pointsPercent) && settings.pointsPercent > 0
    ? settings.pointsPercent
    : 1;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase mb-1">
            Settings & Configuration
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-400" />
            System & Points Percentage Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure the reward points percentage and database connection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bill Value to Points Calculation Setting */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-teal-400" />
            Points Reward Rate (Percentage of Bill Value)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Reward Points (as % of Bill Value) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={percentDraft}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (e.target.value === '' || Number.isNaN(v)) { setPercentDraft(0); return; }
                    setPercentDraft(v);
                  }}
                  className="w-24 px-3 py-2 rounded-xl glass-input font-mono font-bold text-emerald-400"
                />
                <span className="text-slate-300 font-bold">%</span>
                <span className="text-[11px] text-slate-500 ml-1">Allowed: 0.1 – 100</span>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Formula: <code className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-300 font-mono">Points = ⌊ Bill Amount × {currentPercent}% ⌋</code>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Example: At <strong>{currentPercent}%</strong>, a <strong>₹15,000</strong> bill awards <strong className="text-amber-400">{Math.floor(15000 * (currentPercent / 100))} Points</strong> to the electrician.
              </p>
            </div>
          </div>
        </div>

        {/* Developer-only: Admin Credentials Management */}
        {auth.userRole === 'developer' && (
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Update Admin Credentials (Developer Only)
            </h3>

            <AdminCredentialsManager
              companyProfile={companyProfile}
              onSave={onSaveCompanyProfile}
            />
          </div>
        )}

        {/* Developer-only: Onboard a New Admin */}
        {auth.userRole === 'developer' && (
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserPlus className="w-5 h-5 text-purple-400" />
              Onboard New Admin (Developer Only)
            </h3>

            <CreateAdminManager onCreate={onSaveCompanyProfile} />
          </div>
        )}

        {/* Database Connection info (visible to admin + developer) */}
        {auth.userRole !== 'guest' && (
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="w-5 h-5 text-teal-400" />
              Database Connection
            </h3>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Status:</span>
              <span className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {import.meta.env.VITE_SUPABASE_URL ? `Supabase Connected (${import.meta.env.VITE_SUPABASE_URL})` : 'Supabase (not configured)'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
