import React, { useState } from 'react';
import { Award, CheckCircle, XCircle, Clock, PlusCircle, MinusCircle, User, AlertCircle, Sparkles } from 'lucide-react';
import { Electrician, Redemption, PointTransaction } from '../types';

interface PointsRedemptionProps {
  electricians: Electrician[];
  redemptions: Redemption[];
  onAddTransaction: (tx: Omit<PointTransaction, 'id' | 'created_at'>) => Promise<void>;
  onRequestRedemption: (redemption: Omit<Redemption, 'id' | 'status' | 'requested_date'>) => Promise<void>;
  onUpdateRedemptionStatus: (id: string, status: 'approved' | 'rejected', remarks?: string) => Promise<void>;
}

export const PointsRedemption: React.FC<PointsRedemptionProps> = ({
  electricians,
  redemptions,
  onAddTransaction,
  onRequestRedemption,
  onUpdateRedemptionStatus
}) => {
  const [selectedElectricianId, setSelectedElectricianId] = useState<string>(electricians[0]?.id || '');
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit');
  const [pointsAmount, setPointsAmount] = useState<number | ''>('');
  const [particular, setParticular] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Direct Adjust/Debit/Credit Points
  const handleDirectPointAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPoints = Number(pointsAmount);
    if (!selectedElectricianId || !numericPoints || numericPoints <= 0) {
      alert('Please select an electrician and enter valid points!');
      return;
    }

    const elec = electricians.find(e => e.id === selectedElectricianId);
    if (!elec) return;

    if (transactionType === 'debit' && elec.points_balance < numericPoints) {
      alert(`Insufficient balance! Electrician ${elec.name} has only ${elec.points_balance} points available.`);
      return;
    }

    setIsSubmitting(true);
    await onAddTransaction({
      electrician_id: elec.id,
      electrician_name: elec.name,
      date: new Date().toISOString(),
      particular: particular || (transactionType === 'credit' ? 'Admin Manual Bonus Credit' : 'Admin Gift Voucher Debit'),
      debit_points: transactionType === 'debit' ? numericPoints : 0,
      credit_points: transactionType === 'credit' ? numericPoints : 0
    });

    setIsSubmitting(false);
    alert(`Successfully ${transactionType === 'credit' ? 'credited' : 'debited'} ${pointsAmount} points for ${elec.name}!`);
  };

  const selectedElectrician = electricians.find(e => e.id === selectedElectricianId);
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
  const historyRedemptions = redemptions.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Admin Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-teal-500/15 border border-amber-500/30 p-5 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <h3 className="font-bold text-amber-300 text-sm">
            Admin Points Redemption Portal
          </h3>
          <p className="text-slate-300 mt-1">
            Points Redemption features are currently restricted exclusively to <strong>Admin Side Execution</strong>. As noted, future releases will extend self-service redemption requests to the Electrician Mobile App side.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Direct Admin Points Issue / Redeem Form */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-400" />
              Issue / Redeem Points (Admin)
            </h3>

            <form onSubmit={handleDirectPointAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Electrician *</label>
                <select
                  value={selectedElectricianId}
                  onChange={(e) => setSelectedElectricianId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input"
                >
                  {electricians.map(e => (
                    <option key={e.id} value={e.id} className="bg-slate-900 text-slate-200">
                      {e.name} (Mobile: {e.mobile}) - {e.points_balance} Pts Available
                    </option>
                  ))}
                </select>
              </div>

              {selectedElectrician && (
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current Balance:</span>
                  <span className="text-amber-400 font-extrabold text-sm">
                    {selectedElectrician.points_balance} Points
                  </span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Transaction Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('debit');
                      setParticular('Redemption: Fastrack Gift Voucher');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all ${
                      transactionType === 'debit'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>Redeem (Debit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('credit');
                      setParticular('Admin Incentive Bonus Credit');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all ${
                      transactionType === 'credit'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Reward (Credit)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Points Amount *</label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  required
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Particulars / Remarks *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fastrack Watch Voucher / Scan Bonus"
                  value={particular}
                  onChange={(e) => setParticular(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-extrabold text-xs transition-all shadow-lg ${
                  transactionType === 'debit'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/20'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {isSubmitting ? 'Processing...' : transactionType === 'debit' ? 'Execute Point Redemption' : 'Credit Reward Points'}
              </button>
            </form>
          </div>
        </div>

        {/* Pending & Historical Redemption Queue */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Redemption Approvals ({pendingRedemptions.length})
            </h3>

            {pendingRedemptions.length === 0 ? (
              <div className="bg-slate-900/50 rounded-xl p-6 text-center text-xs text-slate-500 border border-slate-800">
                No pending redemption requests requiring admin approval.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRedemptions.map(r => (
                  <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{r.electrician_name || 'Electrician'}</span>
                        <span className="bg-amber-500/10 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-500/30">
                          {r.points} Points
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">Gift: <strong className="text-teal-300">{r.gift_name}</strong></p>
                      <p className="text-[11px] text-slate-500">Requested: {new Date(r.requested_date).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateRedemptionStatus(r.id, 'approved', 'Approved by Admin')}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => onUpdateRedemptionStatus(r.id, 'rejected', 'Rejected by Admin')}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed Redemption History */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3">
              Processed Redemption History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Electrician</th>
                    <th className="py-2.5 px-3">Gift Item</th>
                    <th className="py-2.5 px-3">Points</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyRedemptions.map(h => (
                    <tr key={h.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{h.electrician_name}</td>
                      <td className="py-2.5 px-3 text-slate-300">{h.gift_name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400">-{h.points}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          h.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(h.requested_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
