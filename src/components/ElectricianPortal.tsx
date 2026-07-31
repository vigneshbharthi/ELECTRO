import React, { useState } from 'react';
import { Award, FileSpreadsheet, Upload, Plus, CheckCircle2, Clock, Image, ArrowUpRight, ArrowDownLeft, Wallet, User, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { Electrician, PointTransaction, ElectricianClaim, AppSettings } from '../types';

interface ElectricianPortalProps {
  electrician: Electrician;
  transactions: PointTransaction[];
  claims: ElectricianClaim[];
  settings: AppSettings;
  onSubmitClaim: (claim: Omit<ElectricianClaim, 'id' | 'status' | 'submitted_date'>) => Promise<void>;
  onUpdateClaim?: (id: string, updates: Partial<ElectricianClaim>) => Promise<void>;
  onDeleteClaim?: (id: string) => Promise<void>;
}

export const ElectricianPortal: React.FC<ElectricianPortalProps> = ({
  electrician,
  transactions,
  claims,
  settings,
  onSubmitClaim,
  onUpdateClaim,
  onDeleteClaim
}) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<ElectricianClaim | null>(null);

  // Submit Claim Form State (Clean - No Pre-filling!)
  const [billNo, setBillNo] = useState('');
  const [billAmount, setBillAmount] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [invoiceImagePreview, setInvoiceImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Claim Form State
  const [editBillNo, setEditBillNo] = useState('');
  const [editBillAmount, setEditBillAmount] = useState<number | ''>('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editInvoiceImage, setEditInvoiceImage] = useState<string>('');

  // Filter transactions & claims for THIS electrician
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

  const openAddModal = () => {
    setBillNo('');
    setBillAmount('');
    setRemarks('');
    setInvoiceImagePreview('');
    setIsSubmitModalOpen(true);
  };

  const openEditModal = (claim: ElectricianClaim) => {
    setEditingClaim(claim);
    setEditBillNo(claim.bill_no);
    setEditBillAmount(claim.bill_amount);
    setEditRemarks(claim.remarks || '');
    setEditInvoiceImage(claim.invoice_image_url || '');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        if (isEdit) {
          setEditInvoiceImage(evt.target.result as string);
        } else {
          setInvoiceImagePreview(evt.target.result as string);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(billAmount);
    if (!billNo || !numericAmount || numericAmount <= 0) {
      alert('Please enter valid Bill Number and Bill Amount!');
      return;
    }

    setIsSubmitting(true);
    const claimedPts = Math.floor(numericAmount * settings.pointsPerRupee);

    await onSubmitClaim({
      electrician_id: electrician.id,
      electrician_name: electrician.name,
      electrician_mobile: electrician.mobile,
      bill_no: billNo,
      bill_amount: numericAmount,
      claimed_points: claimedPts,
      invoice_image_url: invoiceImagePreview,
      remarks
    });

    setIsSubmitting(false);
    setIsSubmitModalOpen(false);
    alert('Your bill claim has been submitted for Admin approval!');
  };

  const handleClaimUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim || !onUpdateClaim) return;

    const numericAmount = Number(editBillAmount);
    if (!editBillNo || !numericAmount || numericAmount <= 0) {
      alert('Please enter valid Bill Number and Bill Amount!');
      return;
    }

    const claimedPts = Math.floor(numericAmount * settings.pointsPerRupee);

    await onUpdateClaim(editingClaim.id, {
      bill_no: editBillNo,
      bill_amount: numericAmount,
      claimed_points: claimedPts,
      remarks: editRemarks,
      invoice_image_url: editInvoiceImage
    });

    setEditingClaim(null);
    alert('Your pending claim has been updated successfully!');
  };

  const handleDeleteClaimConfirm = async (id: string) => {
    if (confirm('Are you sure you want to delete this pending claim?')) {
      if (onDeleteClaim) {
        await onDeleteClaim(id);
      }
    }
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
                {electrician.points_balance || 0} <span className="text-xs font-sans text-slate-300">Pts</span>
              </h3>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Bill Receipt</span>
          </button>
        </div>
      </div>

      {/* Submitted Claims Queue Section (With Edit & Delete Options!) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">My Bill Submissions Queue</h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Submissions: <strong className="text-slate-200">{myClaims.length}</strong>
          </span>
        </div>

        {myClaims.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No bill receipt claims uploaded yet. Click <strong>Upload Bill Receipt</strong> above to claim points!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-300">#{claim.bill_no}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    claim.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : claim.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {claim.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {claim.invoice_image_url ? (
                    <img
                      src={claim.invoice_image_url}
                      alt="Invoice"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                      <Image className="w-6 h-6" />
                    </div>
                  )}

                  <div className="text-xs space-y-0.5">
                    <div className="text-slate-300 font-bold">
                      ₹{claim.bill_amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-amber-400 font-mono font-bold">
                      +{claim.claimed_points} Points
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(claim.submitted_date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                {claim.remarks && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                    {claim.remarks}
                  </p>
                )}

                {/* Edit & Delete Controls for Pending Claims */}
                {claim.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => openEditModal(claim)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClaimConfirm(claim.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points Accounting Ledger Statement */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">My Reward Points Ledger</h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Entries: <strong className="text-slate-200">{ledgerRows.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Particular (Description)</th>
                <th className="py-3 px-4 text-rose-400 text-right">Debit (-)</th>
                <th className="py-3 px-4 text-emerald-400 text-right">Credit (+)</th>
                <th className="py-3 px-4 text-teal-300 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              ) : (
                ledgerRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-sans">{row.sNo}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {new Date(row.date).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-sans">{row.particular}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      {row.debit_points > 0 ? `-${row.debit_points}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {row.credit_points > 0 ? `+${row.credit_points}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-teal-300 bg-slate-950/40">
                      {row.balance} Pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Bill Claim Modal (Clean - No Pre-filling!) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-slate-700 shadow-2xl space-y-4">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Upload Bill Receipt for Points</h3>
                <p className="text-xs text-slate-400">Submit bill receipt details for Admin verification</p>
              </div>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bill / Invoice Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-882910"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Total Bill Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold text-teal-300"
                />
                {Number(billAmount) > 0 && (
                  <p className="text-[11px] text-amber-400 mt-1 font-mono">
                    Estimated Points Claimable: +{Math.floor(Number(billAmount) * settings.pointsPerRupee)} Points
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bill Particulars / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased wire rolls and switches"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Invoice Image / Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, false)}
                  className="w-full text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-700"
                />
                {invoiceImagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={invoiceImagePreview}
                      alt="Invoice Preview"
                      className="w-full h-36 object-cover rounded-xl border border-slate-700"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
              >
                {isSubmitting ? 'Submitting Claim...' : 'Submit Claim to Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pending Claim Modal */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-slate-700 shadow-2xl space-y-4">
            <button
              onClick={() => setEditingClaim(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Edit Pending Claim</h3>
                <p className="text-xs text-slate-400">Update bill details before admin approval</p>
              </div>
            </div>

            <form onSubmit={handleClaimUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bill / Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={editBillNo}
                  onChange={(e) => setEditBillNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Total Bill Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editBillAmount}
                  onChange={(e) => setEditBillAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold text-teal-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bill Particulars / Notes</label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Invoice Image / Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, true)}
                  className="w-full text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-700"
                />
                {editInvoiceImage && (
                  <div className="mt-2 relative">
                    <img
                      src={editInvoiceImage}
                      alt="Invoice Preview"
                      className="w-full h-36 object-cover rounded-xl border border-slate-700"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
              >
                Update Pending Claim
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
