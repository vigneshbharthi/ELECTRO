import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, Calendar, Phone, Mail, MapPin, Briefcase, Award, X, FileSpreadsheet } from 'lucide-react';
import { Electrician } from '../types';

interface ElectricianCrudProps {
  electricians: Electrician[];
  onAdd: (data: Omit<Electrician, 'id' | 'points_balance' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Electrician>) => Promise<void>;
  onDelete: (id: string, clearRecords?: boolean) => Promise<void>;
  onGetRelatedCounts: (id: string) => { claims: number; transactions: number; redemptions: number };
  onViewLedger: (electricianId: string) => void;
}

export const ElectricianCrud: React.FC<ElectricianCrudProps> = ({
  electricians,
  onAdd,
  onUpdate,
  onDelete,
  onGetRelatedCounts,
  onViewLedger
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingElectrician, setEditingElectrician] = useState<Electrician | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteClearRecords, setDeleteClearRecords] = useState(false);
  const [deleteCounts, setDeleteCounts] = useState<{ claims: number; transactions: number; redemptions: number } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    mobile: '',
    email: '',
    password: '123456',
    dob: '',
    address: '',
    pincode: '',
    experience: 1
  });

  const openAddModal = () => {
    setEditingElectrician(null);
    setFormData({
      name: '',
      father_name: '',
      mobile: '',
      email: '',
      password: '123456',
      dob: '1995-01-01',
      address: '',
      pincode: '',
      experience: 2
    });
    setIsModalOpen(true);
  };

  const openEditModal = (elec: Electrician) => {
    setEditingElectrician(elec);
    setFormData({
      name: elec.name,
      father_name: elec.father_name,
      mobile: elec.mobile,
      email: elec.email || '',
      password: elec.password || '123456',
      dob: elec.dob,
      address: elec.address,
      pincode: elec.pincode,
      experience: elec.experience
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.father_name || !formData.mobile || !formData.dob || !formData.address || !formData.pincode) {
      alert('Please fill in all mandatory fields!');
      return;
    }

    if (editingElectrician) {
      await onUpdate(editingElectrician.id, formData);
    } else {
      await onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async (id: string) => {
    await onDelete(id, deleteClearRecords);
    setIsDeletingId(null);
    setDeleteClearRecords(false);
    setDeleteCounts(null);
  };

  const handleRequestDelete = (id: string) => {
    setDeleteClearRecords(false);
    setDeleteCounts(onGetRelatedCounts(id));
    setIsDeletingId(id);
  };

  const handleToggleStatus = async (elec: Electrician) => {
    const next = elec.status === 'inactive' ? 'active' : 'inactive';
    await onUpdate(elec.id, { status: next });
  };

  const filteredElectricians = electricians.filter(e =>
    (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.father_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.mobile || '').includes(searchTerm) ||
    (e.pincode || '').includes(searchTerm) ||
    (e.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-400" />
            Electrician Management (CRUD)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Register and update electrician profiles with Personal Details, Contact, Address, & Experience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, mobile, pincode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input"
            />
          </div>

          {/* Add Electrician Button */}
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Electrician</span>
          </button>
        </div>
      </div>

      {/* Electricians Grid / List */}
      {filteredElectricians.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Electricians Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try tweaking your search query or add a new electrician.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredElectricians.map((elec) => (
            <div
              key={elec.id}
              className="glass-panel glass-panel-hover p-5 rounded-2xl relative flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                      {elec.name}
                      {elec.status === 'inactive' && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-slate-700/60 text-slate-300 border border-slate-600">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      S/O: <span className="text-slate-300 font-medium">{elec.father_name}</span>
                    </p>
                  </div>
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg px-2.5 py-1 flex items-center gap-1 text-teal-300 font-extrabold text-xs">
                    <Award className="w-3.5 h-3.5" />
                    <span>{elec.points_balance} Pts</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="font-mono text-slate-200">{elec.mobile}</span>
                  </div>

                  {elec.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate text-slate-300">{elec.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>DOB: {elec.dob}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{elec.address} - <strong className="text-teal-300">{elec.pincode}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Experience: <strong className="text-emerald-400">{elec.experience} Years</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-4">
                <button
                  onClick={() => onViewLedger(elec.id)}
                  className="flex items-center space-x-1 text-xs text-teal-400 hover:text-teal-300 bg-teal-500/10 px-2.5 py-1.5 rounded-lg border border-teal-500/20"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ledger</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(elec)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                      elec.status === 'inactive'
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                    title={elec.status === 'inactive' ? 'Activate Electrician' : 'Deactivate Electrician'}
                  >
                    {elec.status === 'inactive' ? 'Activate' : 'Deactivate'}
                  </button>

                  <button
                    onClick={() => openEditModal(elec)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                    title="Edit Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleRequestDelete(elec.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Delete Electrician"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Electrician Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-teal-400" />
              {editingElectrician ? 'Edit Electrician Details' : 'Add New Electrician'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik Raja"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Father's Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramasamy"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile Number (Login ID) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Portal Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Password for electrician login"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mail ID</label>
                <input
                  type="email"
                  placeholder="e.g. electrician@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street address, landmark, city"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6 digit pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold hover:brightness-110"
                >
                  {editingElectrician ? 'Save Changes' : 'Create Electrician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (rendered at component root to avoid transformed-ancestor issues) */}
      {isDeletingId && (
        (() => {
          const deletingElec = electricians.find(e => e.id === isDeletingId);
          if (!deletingElec) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setIsDeletingId(null); setDeleteClearRecords(false); setDeleteCounts(null); }}>
              <div
                className="glass-panel w-full max-w-sm rounded-2xl p-5 relative border border-slate-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="font-bold text-slate-100 text-sm">Delete {deletingElec.name}?</h4>
                {deleteCounts && (deleteCounts.claims > 0 || deleteCounts.transactions > 0 || deleteCounts.redemptions > 0) ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-slate-300">
                      This electrician has:
                    </p>
                    <ul className="text-[11px] text-slate-400 space-y-1">
                      <li>• {deleteCounts.claims} bill claim(s)</li>
                      <li>• {deleteCounts.transactions} ledger transaction(s)</li>
                      <li>• {deleteCounts.redemptions} redemption request(s)</li>
                    </ul>
                    <label className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deleteClearRecords}
                        onChange={(e) => setDeleteClearRecords(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-[11px] text-rose-300 font-semibold">
                        Also permanently clear all these records. <span className="text-rose-400/80 font-normal">This removes the audit trail & point history — cannot be undone.</span>
                      </span>
                    </label>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    No claims, transactions or redemptions linked — safe to delete.
                  </p>
                )}
                <div className="flex justify-end gap-2 mt-5">
                  <button
                    onClick={() => { setIsDeletingId(null); setDeleteClearRecords(false); setDeleteCounts(null); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(deletingElec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold text-white ${deleteCounts && (deleteCounts.claims > 0 || deleteCounts.transactions > 0 || deleteCounts.redemptions > 0) && !deleteClearRecords ? 'bg-slate-600' : 'bg-rose-600 hover:bg-rose-500'}`}
                  >
                    {deleteCounts && (deleteCounts.claims > 0 || deleteCounts.transactions > 0 || deleteCounts.redemptions > 0) && !deleteClearRecords ? 'Delete Profile Only' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
