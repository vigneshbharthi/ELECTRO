import React, { useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, X, Check, Building2, FileText } from 'lucide-react';
import { Customer } from '../types';

interface CustomerCrudProps {
  customers: Customer[];
  onAdd: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer>;
  onUpdate: (id: string, updates: Partial<Customer>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const CustomerCrud: React.FC<CustomerCrudProps> = ({
  customers,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    gstin: ''
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', mobile: '', email: '', address: '', city: '', gstin: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      gstin: c.gstin || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter customer name!');
      return;
    }

    if (editingCustomer) {
      await onUpdate(editingCustomer.id, formData);
    } else {
      await onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async (id: string) => {
    await onDelete(id);
    setIsDeletingId(null);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.mobile || '').includes(searchTerm) ||
    (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase mb-1">
            Master Management
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            Customer Master (CRUD)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain all customers used in the Order Book. Order Man can search & select these customers while booking orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, mobile, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 hover:brightness-110 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      {filteredCustomers.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center text-sm text-slate-400">
          No customers found. Click <strong>Add Customer</strong> to create your first customer.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map(c => (
            <div key={c.id} className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-100 truncate">{c.name}</h3>
                      {c.city && (
                        <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {c.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                  {c.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono text-slate-200">{c.mobile}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate text-slate-300">{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span className="text-slate-400">{c.address}</span>
                    </div>
                  )}
                  {c.gstin && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono text-slate-400 text-[11px]">{c.gstin}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-800/80 pt-3 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {isDeletingId === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteConfirm(c.id)}
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
                      onClick={() => setIsDeletingId(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <Users className="w-5 h-5 text-sky-400" />
              {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Murugan Stores"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile</label>
                  <input
                    type="tel"
                    placeholder="10 digit mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Salem"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email ID</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Address</label>
                <textarea
                  placeholder="Street, area..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 33XXXXX0000X1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110"
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};