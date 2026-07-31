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
  const handlePointsRatioChange = (rupeesForOnePoint: number) => {
    if (rupeesForOnePoint <= 0) return;
    setSettings(prev => ({
      ...prev,
      pointsPerRupee: 1 / rupeesForOnePoint
    }));
  };

  const currentRupeesPerPoint = (1 / settings.pointsPerRupee).toFixed(0);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase mb-1">
            Settings & Configuration
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-400" />
            System & Points Ratio Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure bill-to-points calculation formulas, developer auth modes, and database connection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bill Value to Points Calculation Setting */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-teal-400" />
            Bill Value Points Calculation Formula
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Bill Amount (₹) required for 1 Reward Point
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">1 Point = ₹</span>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={currentRupeesPerPoint}
                  onChange={(e) => handlePointsRatioChange(parseFloat(e.target.value) || 100)}
                  className="w-32 px-3 py-2 rounded-xl glass-input font-mono font-bold text-emerald-400"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Example: If set to ₹100, a ₹15,000 bill awards <strong>150 Points</strong> to the electrician.
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
