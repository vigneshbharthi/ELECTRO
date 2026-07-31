import React, { useState } from 'react';
import { UserCheck, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Key, Shield, X, Check } from 'lucide-react';
import { OrderMan } from '../types';

interface OrderManCrudProps {
  orderMen: OrderMan[];
  onAdd: (data: Omit<OrderMan, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<OrderMan>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const OrderManCrud: React.FC<OrderManCrudProps> = ({
  orderMen,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderMan, setEditingOrderMan] = useState<OrderMan | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    region: 'Salem & Namakkal Zone',
    status: 'active' as 'active' | 'inactive'
  });

  const openAddModal = () => {
    setEditingOrderMan(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: 'order123',
      region: 'Salem & Namakkal Zone',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (om: OrderMan) => {
    setEditingOrderMan(om);
    setFormData({
      name: om.name,
      mobile: om.mobile,
      email: om.email || '',
      password: om.password || 'order123',
      region: om.region,
      status: om.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.region) {
      alert('Please fill in name, mobile, and assigned region!');
      return;
    }

    if (editingOrderMan) {
      await onUpdate(editingOrderMan.id, formData);
    } else {
      await onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async (id: string) => {
    await onDelete(id);
    setIsDeletingId(null);
  };

  const filteredOrderMen = orderMen.filter(om =>
    om.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    om.mobile.includes(searchTerm) ||
    om.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase mb-1">
            Master Management
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-purple-400" />
            Order Man Master (Sales Personnel CRUD)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Order Man staff search product catalog & prices for orders. Order Man has no reward points.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Order Man, region, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 hover:brightness-110 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Order Man</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrderMen.map(om => (
          <div key={om.id} className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{om.name}</h3>
                  <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {om.region}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  om.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {om.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-mono text-slate-200">{om.mobile}</span>
                </div>

                {om.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate text-slate-300">{om.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-mono text-slate-400 text-[11px]">Password: ********</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-4">
              <span className="text-[10px] text-slate-500">Order Man Login Enabled</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(om)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800"
                  title="Edit Order Man"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {isDeletingId === om.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteConfirm(om.id)}
                      className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeletingId(null)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsDeletingId(om.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-purple-400" />
              {editingOrderMan ? 'Edit Order Man Profile' : 'Add New Order Man'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile (Login ID) *</label>
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
                  <label className="block text-slate-300 font-medium mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email ID</label>
                <input
                  type="email"
                  placeholder="orderman@electro.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Region / Zone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salem Zone"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110"
                >
                  {editingOrderMan ? 'Save Changes' : 'Create Order Man'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
