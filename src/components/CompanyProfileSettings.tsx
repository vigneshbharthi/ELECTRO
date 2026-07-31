import React, { useState } from 'react';
import { Building2, Key, Save, ShieldCheck, Mail, Phone, MapPin, CheckCircle2, Code, FileText } from 'lucide-react';
import { CompanyProfile } from '../types';

interface CompanyProfileSettingsProps {
  companyProfile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
}

export const CompanyProfileSettings: React.FC<CompanyProfileSettingsProps> = ({
  companyProfile,
  onSaveProfile
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(companyProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase mb-1">
            Enterprise Settings
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-400" />
            Company Profile & Credentials Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure company identity details and manage login credentials for Admin and Developer access.
          </p>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile & Credentials Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Identity Settings */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-teal-400" />
              Company Details
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Enterprise Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">GSTIN Number</label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Support Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Official Support Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Registered Business Address</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 rounded-xl glass-input"
                />
              </div>
            </div>
          </div>

          {/* Credentials Settings (Admin & Developer) */}
          <div className="space-y-6">
            {/* Admin Credentials */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                Change Admin Login Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Admin Email / Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Admin Password *</label>
                  <input
                    type="text"
                    required
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Developer Separate Credentials */}
            <div className="glass-panel p-6 rounded-2xl space-y-4 border-purple-500/30">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Code className="w-5 h-5 text-purple-400" />
                Developer Dedicated Login Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Developer Login ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.devUsername}
                    onChange={(e) => setFormData({ ...formData, devUsername: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Developer Password *</label>
                  <input
                    type="text"
                    required
                    value={formData.devPassword}
                    onChange={(e) => setFormData({ ...formData, devPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Credentials</span>
          </button>
        </div>
      </form>
    </div>
  );
};
