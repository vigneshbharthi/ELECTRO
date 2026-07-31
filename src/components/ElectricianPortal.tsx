import React, { useState } from 'react';
import { Award, FileSpreadsheet, Upload, Plus, CheckCircle2, Clock, Image, ArrowUpRight, ArrowDownLeft, Wallet, User } from 'lucide-react';
import { Electrician, PointTransaction, ElectricianClaim } from '../types';

interface ElectricianPortalProps {
  electrician: Electrician;
  transactions: PointTransaction[];
  claims: ElectricianClaim[];
  onSubmitClaim: (claim: Omit<ElectricianClaim, 'id' | 'status' | 'submitted_date'>) => Promise<void>;
}

export const ElectricianPortal: React.FC<ElectricianPortalProps> = ({
  electrician,
  transactions,
  claims,
  onSubmitClaim
}) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [billNo, setBillNo] = useState(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  const [billAmount, setBillAmount] = useState(5000);
  const [remarks, setRemarks] = useState('Purchased wiring materials');
  const [invoiceImagePreview, setInvoiceImagePreview] = useState<string>('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter transactions for THIS electrician only!
  const myTransactions = transactions
    .filter(t => t.electrician_id === electrician.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute running balance
  let runningBalance = 0;
  const ledgerRows = myTransactions.map((tx, idx) => {
    runningBalance += (tx.credit_points || 0) - (tx.debit_points || 0);
    return {
      sNo: idx + 1,
      ...tx,
      balance: runningBalance
    };
  });

  const myClaims = claims.filter(c => c.electrician_id === electrician.id);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setInvoiceImagePreview(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (billAmount <= 0) return;

    setIsSubmitting(true);
    const claimedPts = Math.floor(billAmount * 0.01);

    await onSubmitClaim({
      electrician_id: electrician.id,
      electrician_name: electrician.name,
      electrician_mobile: electrician.mobile,
      bill_no: billNo,
      bill_amount: billAmount,
      claimed_points: claimedPts,
      invoice_image_url: invoiceImagePreview,
      remarks
    });

    setIsSubmitting(false);
    setIsSubmitModalOpen(false);
    alert('Your bill claim & invoice photo have been submitted for Admin approval!');
  };

  return (
    <div className="space-y-6">
      {/* Electrician Profile Header & Balance Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-teal-500">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-400">
            Electrician Loyalty Portal
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-0.5">
            Welcome, {electrician.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mobile: <span className="font-mono text-slate-200">{electrician.mobile}</span> • Pincode: <span className="text-teal-300 font-bold">{electrician.pincode}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/40 p-4 rounded-2xl flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">My Reward Balance</span>
              <h3 className="text-2xl font-extrabold text-amber-400 font-mono">
                {electrician.points_balance} Points
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 transition-all"
          >
            <Upload className="w-4 h-4 stroke-[3]" />
            <span>Upload Bill for Points</span>
          </button>
        </div>
      </div>

      {/* Submitted Claims Status Tracker */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="w-5 h-5 text-amber-400" />
          My Submitted Bill Claims ({myClaims.length})
        </h3>

        {myClaims.length === 0 ? (
          <p className="text-xs text-slate-500">You haven't submitted any bill claims yet. Click "Upload Bill for Points" to earn rewards!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myClaims.map(claim => (
              <div key={claim.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">Bill #{claim.bill_no}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      claim.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : claim.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">Amount: <strong className="text-emerald-400 font-mono">₹{claim.bill_amount}</strong></p>
                  <p className="text-[10px] text-slate-500">{new Date(claim.submitted_date).toLocaleDateString()}</p>
                </div>

                <span className="font-mono font-extrabold text-amber-400 text-sm">
                  +{claim.claimed_points} Pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Electrician Personal Points Ledger Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            My Personal Points Statement Ledger
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4 w-16 text-center">S.No</th>
                <th className="py-3 px-4 w-44">Date & Time</th>
                <th className="py-3 px-4">Particular (Description)</th>
                <th className="py-3 px-4 text-right text-rose-400">Debit (-)</th>
                <th className="py-3 px-4 text-right text-emerald-400">Credit (+)</th>
                <th className="py-3 px-4 text-right text-teal-300">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No ledger transactions found yet.
                  </td>
                </tr>
              ) : (
                ledgerRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{row.sNo}</td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">{new Date(row.date).toLocaleString()}</td>
                    <td className="py-3 px-4 font-sans text-slate-200">{row.particular}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">{row.debit_points > 0 ? `-${row.debit_points}` : '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{row.credit_points > 0 ? `+${row.credit_points}` : '-'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-teal-300">{row.balance} Pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Bill Claim Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-teal-400" />
              Upload Bill Receipt for Points
            </h3>

            <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bill Reference No *</label>
                <input
                  type="text"
                  required
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Total Bill Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold text-emerald-400"
                />
                <p className="text-[10px] text-teal-400 mt-1">Estimated Points: +{Math.floor(billAmount * 0.01)} Points</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Upload Bill Invoice Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 cursor-pointer"
                />
                {invoiceImagePreview && (
                  <div className="mt-2 flex items-center space-x-2">
                    <img
                      src={invoiceImagePreview}
                      alt="Bill Receipt"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                    />
                    <span className="text-[11px] text-teal-400 font-medium font-mono">Invoice photo attached</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold hover:brightness-110"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
