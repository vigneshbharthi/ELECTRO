import React, { useState } from 'react';
import { Receipt, Calculator, Award, Plus, CheckCircle, Search, Calendar, UserCheck, Package } from 'lucide-react';
import { Electrician, Product, PointTransaction, AppSettings } from '../types';

interface BillEntryModuleProps {
  electricians: Electrician[];
  products: Product[];
  settings: AppSettings;
  onAddTransaction: (tx: Omit<PointTransaction, 'id' | 'created_at'>) => Promise<void>;
}

export const BillEntryModule: React.FC<BillEntryModuleProps> = ({
  electricians,
  products,
  settings,
  onAddTransaction
}) => {
  const [selectedElectricianId, setSelectedElectricianId] = useState<string>(electricians[0]?.id || '');
  const [billNo, setBillNo] = useState<string>(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  const [billAmount, setBillAmount] = useState<number>(10000);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState<string>('Electrical materials purchase bill');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate points automatically from Bill Value!
  // Formula: points = Math.floor(billAmount * settings.pointsPerRupee)
  const calculatedPoints = Math.floor(billAmount * settings.pointsPerRupee);

  const selectedElectrician = electricians.find(e => e.id === selectedElectricianId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElectricianId || billAmount <= 0) {
      alert('Please select an electrician and enter a valid bill amount!');
      return;
    }

    const elec = electricians.find(e => e.id === selectedElectricianId);
    if (!elec) return;

    setIsSubmitting(true);
    await onAddTransaction({
      electrician_id: elec.id,
      electrician_name: elec.name,
      date: new Date().toISOString(),
      particular: `Bill #${billNo} Value: ₹${billAmount.toLocaleString('en-IN')} (${calculatedPoints} Pts Earned)`,
      debit_points: 0,
      credit_points: calculatedPoints
    });

    setIsSubmitting(false);
    alert(`Successfully processed Bill #${billNo}! Credited ${calculatedPoints} points to ${elec.name}.`);
    // Reset Bill No
    setBillNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const toggleProductSelection = (pId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase mb-1">
            Entries Module
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-400" />
            Bill Value & Points Credit Entry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Points are calculated strictly based on <strong>Total Bill Value (₹)</strong>. Select Order Man products for bill details.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
          <Calculator className="w-5 h-5 text-teal-400" />
          <div className="text-xs">
            <span className="text-slate-400 block">Current Reward Rate:</span>
            <span className="text-teal-300 font-extrabold">
              1 Point per ₹{(1 / settings.pointsPerRupee).toFixed(0)} Spent
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Entry Form */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Plus className="w-5 h-5 text-teal-400" />
            New Bill Value Entry Form
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bill / Invoice Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-981240"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Electrician *</label>
                <select
                  value={selectedElectricianId}
                  onChange={(e) => setSelectedElectricianId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input"
                >
                  {electricians.map(e => (
                    <option key={e.id} value={e.id} className="bg-slate-900 text-slate-200">
                      {e.name} ({e.mobile}) - Current: {e.points_balance} Pts
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bill Amount & Automatic Points Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-r from-slate-900 to-teal-950/40 p-4 rounded-xl border border-teal-500/30">
              <div>
                <label className="block text-slate-200 font-bold mb-1">Total Bill Value (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={billAmount}
                    onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl glass-input font-mono font-extrabold text-base text-emerald-400"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-slate-400 font-medium block">Calculated Points Earned:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Award className="w-6 h-6 text-amber-400" />
                  <span className="text-2xl font-extrabold text-amber-400 font-mono">
                    +{calculatedPoints} Points
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Products included in Bill (Order Man selection) */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Attach Purchased Products (Order Man Catalog)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                {products.map(p => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={`p-2 rounded-lg cursor-pointer border flex justify-between items-center transition-all ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate font-semibold">{p.name}</span>
                      <span className="font-mono text-[11px] shrink-0">₹{p.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Remarks / Note</label>
              <input
                type="text"
                placeholder="e.g. Building project wiring order"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
            >
              {isSubmitting ? 'Posting Entry...' : `Credit +${calculatedPoints} Points to ${selectedElectrician?.name || 'Electrician'}`}
            </button>
          </form>
        </div>

        {/* Selected Electrician Live Card */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserCheck className="w-4 h-4 text-teal-400" />
              Electrician Profile
            </h3>

            {selectedElectrician ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 text-sm">{selectedElectrician.name}</h4>
                  <p className="text-slate-400 mt-0.5">Mobile: <span className="font-mono text-slate-200">{selectedElectrician.mobile}</span></p>
                  <p className="text-slate-400">Pincode: <span className="text-teal-300 font-bold">{selectedElectrician.pincode}</span></p>
                </div>

                <div className="bg-teal-500/10 border border-teal-500/30 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-slate-300">Active Balance:</span>
                  <span className="font-mono font-extrabold text-teal-300 text-base">
                    {selectedElectrician.points_balance} Pts
                  </span>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-slate-300">After This Bill:</span>
                  <span className="font-mono font-extrabold text-amber-400 text-base">
                    {selectedElectrician.points_balance + calculatedPoints} Pts
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-4">Select an electrician to view profile.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
