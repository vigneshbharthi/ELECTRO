import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Award, FileText, UserCheck, Plus, Sparkles, Image, Eye, X, Upload } from 'lucide-react';
import { Electrician, ElectricianClaim, AppSettings } from '../types';

interface ElectricianClaimsApprovalProps {
  electricians: Electrician[];
  claims: ElectricianClaim[];
  settings: AppSettings;
  onUpdateClaimStatus: (id: string, status: 'approved' | 'rejected', remarks?: string) => Promise<void>;
  onSubmitClaim: (claim: Omit<ElectricianClaim, 'id' | 'status' | 'submitted_date'>) => Promise<void>;
}

export const ElectricianClaimsApproval: React.FC<ElectricianClaimsApprovalProps> = ({
  electricians,
  claims,
  settings,
  onUpdateClaimStatus,
  onSubmitClaim
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedInvoiceImage, setSelectedInvoiceImage] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState<{ [id: string]: string }>({});

  // Submit Claim Modal Form State (Clean - No Pre-filling!)
  const [selectedElectricianId, setSelectedElectricianId] = useState(electricians[0]?.id || '');
  const [billNo, setBillNo] = useState('');
  const [billAmount, setBillAmount] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [invoiceImagePreview, setInvoiceImagePreview] = useState<string>('');

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const approvedClaims = claims.filter(c => c.status === 'approved');
  const rejectedClaims = claims.filter(c => c.status === 'rejected');

  const displayedClaims = activeTab === 'pending'
    ? pendingClaims
    : activeTab === 'approved'
    ? approvedClaims
    : rejectedClaims;

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

  const handleApprove = async (id: string) => {
    await onUpdateClaimStatus(id, 'approved', 'Approved by Admin');
    setSelectedInvoiceImage(null);
    alert('Claim Approved! Points successfully credited to Electrician ledger.');
  };

  const handleReject = async (id: string) => {
    const comment = rejectRemarks[id] || 'Invalid bill document';
    await onUpdateClaimStatus(id, 'rejected', comment);
    setSelectedInvoiceImage(null);
    alert('Claim Rejected.');
  };

  const handleManualClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const elec = electricians.find(e => e.id === selectedElectricianId);
    const numericAmount = Number(billAmount);
    if (!elec || !billNo || !numericAmount || numericAmount <= 0) {
      alert('Please fill in all required fields!');
      return;
    }

    const claimedPts = Math.floor(numericAmount * (settings.pointsPercent / 100));

    await onSubmitClaim({
      electrician_id: elec.id,
      electrician_name: elec.name,
      electrician_mobile: elec.mobile,
      bill_no: billNo,
      bill_amount: numericAmount,
      claimed_points: claimedPts,
      invoice_image_url: invoiceImagePreview,
      remarks
    });

    setIsSubmitModalOpen(false);
    setBillNo('');
    setBillAmount('');
    setRemarks('');
    setInvoiceImagePreview('');
    alert('Electrician claim submitted successfully for Admin review!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-amber-500">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase mb-1">
            Verification Queue
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            Electrician Bill Claims & Invoice Approvals
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review uploaded bill invoices from electricians, inspect documents, and approve point credits.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Claim Submission</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Review ({pendingClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'approved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Approved ({approvedClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'rejected'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-500/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>Rejected ({rejectedClaims.length})</span>
        </button>
      </div>

      {/* Claims List */}
      {displayedClaims.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl text-slate-400 text-xs">
          No {activeTab} electrician claims in queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedClaims.map((claim) => (
            <div
              key={claim.id}
              className="glass-panel rounded-2xl p-5 space-y-4 relative border hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-300">#{claim.bill_no}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(claim.submitted_date).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {claim.invoice_image_url ? (
                    <div
                      onClick={() => setSelectedInvoiceImage(claim.invoice_image_url || null)}
                      className="relative cursor-pointer group shrink-0"
                    >
                      <img
                        src={claim.invoice_image_url}
                        alt="Invoice"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-700 group-hover:brightness-110 transition-all"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                      <Image className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{claim.electrician_name}</h4>
                    <p className="text-xs text-slate-400 font-mono">{claim.electrician_mobile}</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      Bill Amount: <span className="text-teal-300 font-mono">₹{claim.bill_amount.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Claim Points:</span>
                  <span className="text-amber-400 font-extrabold font-mono text-sm">
                    +{claim.claimed_points} Pts
                  </span>
                </div>

                {claim.remarks && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                    {claim.remarks}
                  </p>
                )}
              </div>

              {/* Approval Actions */}
              {activeTab === 'pending' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <input
                    type="text"
                    placeholder="Optional rejection remarks..."
                    value={rejectRemarks[claim.id] || ''}
                    onChange={(e) => setRejectRemarks({ ...rejectRemarks, [claim.id]: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApprove(claim.id)}
                      className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(claim.id)}
                      className="py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Fullscreen Inspection Modal */}
      {selectedInvoiceImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedInvoiceImage(null)}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedInvoiceImage}
              alt="Invoice Fullscreen"
              className="max-h-[80vh] w-auto object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* New Manual Claim Modal (Clean - No Pre-filling!) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
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
                <h3 className="font-bold text-slate-100 text-base">New Electrician Bill Claim</h3>
                <p className="text-xs text-slate-400">Submit bill claim on behalf of an electrician</p>
              </div>
            </div>

            <form onSubmit={handleManualClaimSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Electrician *</label>
                <select
                  value={selectedElectricianId}
                  onChange={(e) => setSelectedElectricianId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input font-bold"
                >
                  {electricians.map(elec => (
                    <option key={elec.id} value={elec.id} className="bg-slate-900 text-slate-200">
                      {elec.name} ({elec.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bill / Invoice Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-99102"
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
                  placeholder="e.g. 12000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold text-teal-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Particulars / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased wire rolls"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Upload Invoice Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
              >
                Submit Claim to Queue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
