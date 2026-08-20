import React, { useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Tag, Calendar, X, Check, Filter, Upload, Download, FileSpreadsheet, Trash } from 'lucide-react';
import { Product } from '../types';

interface ProductCrudProps {
  products: Product[];
  onAdd: (data: Omit<Product, 'id' | 'updated_at' | 'created_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Product>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkAdd: (productsList: Omit<Product, 'id' | 'updated_at' | 'created_at'>[]) => Promise<void>;
}

export const ProductCrud: React.FC<ProductCrudProps> = ({
  products,
  onAdd,
  onUpdate,
  onDelete,
  onBulkDelete,
  onBulkAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [importedPreview, setImportedPreview] = useState<Omit<Product, 'id' | 'updated_at' | 'created_at'>[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    group_name: 'Switchgear',
    uom: 'Nos',
    price: 0
  });

  const availableGroups = Array.from(new Set(products.map(p => p.group_name))).concat(['Switchgear', 'Wires & Cables', 'Distribution Boards', 'Switches & Sockets', 'Lighting Solutions']);
  const uniqueGroups = Array.from(new Set(availableGroups));

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      group_name: 'Switchgear',
      uom: 'Nos',
      price: 250
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      group_name: p.group_name,
      uom: p.uom,
      price: p.price
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.group_name || !formData.uom) {
      alert('Please fill in product name, group, and UOM!');
      return;
    }

    if (editingProduct) {
      await onUpdate(editingProduct.id, formData);
    } else {
      await onAdd(formData);
    }
    setIsModalOpen(false);
  };

  // Parse CSV File or Text
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCsvData(text);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (text: string) => {
    setCsvRawText(text);
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return;

    // Header row skip, parse rows
    const parsed: Omit<Product, 'id' | 'updated_at' | 'created_at'>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 4) {
        parsed.push({
          name: parts[0],
          group_name: parts[1] || 'General',
          uom: parts[2] || 'Nos',
          price: parseFloat(parts[3]) || 0
        });
      }
    }
    setImportedPreview(parsed);
  };

  const handleExecuteCsvImport = async () => {
    if (importedPreview.length === 0) {
      alert('No valid products parsed from CSV!');
      return;
    }
    await onBulkAdd(importedPreview);
    setIsCsvModalOpen(false);
    setImportedPreview([]);
    setCsvRawText('');
    alert(`Successfully imported ${importedPreview.length} products from CSV!`);
  };

  const downloadSampleCsv = () => {
    const sample = `Name,Group,UOM,Price\n"2.5 sqmm FR Wire","Wires & Cables","Roll",2450.00\n"63A 4-Pole MCB","Switchgear","Nos",1250.00\n"LED Ceiling Light 18W","Lighting Solutions","Nos",450.00`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'JBS_Electro_Product_Import_Sample.csv';
    a.click();
  };

  const handleDeleteConfirm = async (id: string) => {
    await onDelete(id);
    setIsDeletingId(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredProducts.map(p => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => {
      const remaining = prev.filter(id => !visibleIds.includes(id));
      return allSelected ? remaining : [...remaining, ...visibleIds];
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected product(s)? This cannot be undone.`)) {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.uom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || p.group_name === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase mb-1">
            Master Catalog (Order Man)
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-400" />
            Product Master & Order Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Product details used by Order Man (Sales Order) with CSV Upload capability. Points are credited based on Total Bill Value.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Group Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Product Groups</option>
              {uniqueGroups.map(g => (
                <option key={g} value={g} className="bg-slate-900 text-slate-200">{g}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input"
            />
          </div>

          {/* CSV Import Button */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          {/* Bulk Delete Selected */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          {/* Add Single Product */}
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-teal-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Group / Category</th>
                <th className="py-3.5 px-4">UOM</th>
                <th className="py-3.5 px-4">Price (₹)</th>
                <th className="py-3.5 px-4">Updated Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No products found matching your search. Use "Import CSV" to upload items in bulk!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-slate-900/40 transition-colors ${selectedIds.includes(product.id) ? 'bg-teal-500/5' : ''}`}>
                    <td className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {product.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-teal-300 border border-slate-700">
                        <Tag className="w-3 h-3 text-teal-400" />
                        {product.group_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {product.uom}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      ₹{product.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(product.updated_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {isDeletingId === product.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteConfirm(product.id)}
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
                            onClick={() => setIsDeletingId(product.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Bulk Upload Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 relative border border-slate-700 shadow-2xl space-y-4">
            <button
              onClick={() => setIsCsvModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              CSV Bulk Product Upload
            </h3>

            <p className="text-xs text-slate-300">
              Upload a CSV file containing <strong>Name, Group, UOM, Price</strong> columns to automatically import product catalog entries.
            </p>

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Need sample CSV format?</span>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample CSV</span>
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1">Select CSV File</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileUpload}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600/30 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer"
              />
            </div>

            {importedPreview.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-400">
                  ✓ Parsed {importedPreview.length} products ready for import:
                </div>
                <div className="max-h-40 overflow-y-auto bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono divide-y divide-slate-800">
                  {importedPreview.map((item, idx) => (
                    <div key={idx} className="py-1 flex justify-between">
                      <span className="text-slate-200 font-sans truncate">{item.name}</span>
                      <span className="text-teal-300">{item.group_name} • {item.uom} • ₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCsvImport}
                disabled={importedPreview.length === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 disabled:opacity-50 text-white font-bold text-xs"
              >
                Import {importedPreview.length} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
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
              <Package className="w-5 h-5 text-teal-400" />
              {editingProduct ? 'Edit Product Details' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 32A Double Pole MCB"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Product Group *</label>
                  <input
                    type="text"
                    required
                    list="group-options"
                    placeholder="Group/Category"
                    value={formData.group_name}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                  <datalist id="group-options">
                    {uniqueGroups.map(g => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit of Measure (UOM) *</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Roll">Roll</option>
                    <option value="Box">Box</option>
                    <option value="Meter">Meter</option>
                    <option value="Set">Set</option>
                    <option value="Pkt">Pkt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Unit Price (₹) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
