import React from 'react';
import { Settings, Sliders, Shield, Database, Code, Save, CheckCircle2 } from 'lucide-react';
import { AppSettings, UserAuth } from '../types';

interface SettingsModuleProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  auth: UserAuth;
  setAuth: React.Dispatch<React.SetStateAction<UserAuth>>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  setSettings,
  auth,
  setAuth
}) => {
  const handlePercentChange = (percent: number) => {
    if (!Number.isFinite(percent) || percent <= 0) return;
    setSettings(prev => ({
      ...prev,
      pointsPercent: percent
    }));
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
            Configure the reward points percentage, developer auth modes, and database connection.
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
                  value={currentPercent}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    // Allow user to clear/intermediate states without snapping back to 1
                    if (e.target.value === '' || Number.isNaN(v)) return;
                    handlePercentChange(v);
                  }}
                  className="w-24 px-3 py-2 rounded-xl glass-input font-mono font-bold text-emerald-400"
                />
                <span className="text-slate-300 font-bold">%</span>
                <span className="text-[11px] text-slate-500 ml-1">Allowed: 0.1 – 100</span>
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

        {/* Developer & Authentication Access Settings */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Code className="w-5 h-5 text-purple-400" />
            Developer & Auth Mode Configuration
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-300 block">Developer Full Auth Mode</span>
                <span className="text-[11px] text-slate-400">Bypasses login authentication friction</span>
              </div>
              <button
                type="button"
                onClick={() => setAuth(prev => ({
                  ...prev,
                  isDeveloperMode: !prev.isDeveloperMode,
                  isAuthenticated: true,
                  userRole: !prev.isDeveloperMode ? 'developer' : 'admin',
                  username: !prev.isDeveloperMode ? 'Developer (Full Access)' : 'Admin User'
                }))}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  auth.isDeveloperMode
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {auth.isDeveloperMode ? 'Active (Full Access)' : 'Enable Dev Mode'}
              </button>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Database Connection:</span>
              <span className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                import.meta.env.VITE_SUPABASE_URL ? `Supabase Connected (${import.meta.env.VITE_SUPABASE_URL})` : 'Supabase (not configured)'
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
