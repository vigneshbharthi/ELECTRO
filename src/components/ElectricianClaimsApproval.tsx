import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Award, FileText, UserCheck, Plus, Sparkles, Image, Eye, X, Upload } from 'lucide-react';
import { Electrician, ElectricianClaim } from '../types';

interface ElectricianClaimsApprovalProps {
  electricians: Electrician[];
  claims: ElectricianClaim[];
  onUpdateClaimStatus: (id: string, status: 'approved' | 'rejected', remarks?: string) => Promise<void>;
  onSubmitClaim: (claim: Omit<ElectricianClaim, 'id' | 'status' | 'submitted_date'>) => Promise<void>;
}

export const ElectricianClaimsApproval: React.FC<ElectricianClaimsApprovalProps> = ({
  electricians,
  claims,
  onUpdateClaimStatus,
  onSubmitClaim
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedInvoiceImage, setSelectedInvoiceImage] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState<{ [id: string]: string }>({});

  // Submit Claim Modal Form State
  const [selectedElectricianId, setSelectedElectricianId] = useState(electricians[0]?.id || '');
  const [billNo, setBillNo] = useState(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  const [billAmount, setBillAmount] = useState(12000);
  const [remarks, setRemarks] = useState('Wiring materials bill copy');
  const [invoiceImagePreview, setInvoiceImagePreview] = useState<string>('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60');

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

  const handleNewClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const elec = electricians.find(e => e.id === selectedElectricianId);
    if (!elec) return;

    const claimedPts = Math.floor(billAmount * 0.01);

    await onSubmitClaim({
      electrician_id: elec.id,
      electrician_name: elec.name,
      electrician_mobile: elec.mobile,
      bill_no: billNo,
      bill_amount: billAmount,
      claimed_points: claimedPts,
      invoice_image_url: invoiceImagePreview,
      remarks
    });

    setIsSubmitModalOpen(false);
    alert('New Electrician Claim submitted to Pending Approval Queue!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase mb-1">
            Admin Verification Portal
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-400" />
            Electrician Point Claims & Pending Approvals
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review invoice bills and photos submitted by electricians. Admin inspection of invoice images is required before approval.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Simulate Electrician Claim Submission</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Approvals</span>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40">
            {pendingClaims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center space-x-2 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'approved'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Approved History ({approvedClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center space-x-2 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'rejected'
              ? 'border-rose-400 text-rose-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>Rejected ({rejectedClaims.length})</span>
        </button>
      </div>

      {/* Claims Grid */}
      {displayedClaims.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            No {activeTab} electrician claims found.
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'pending' ? 'All electrician point claims have been processed.' : 'No items in history.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedClaims.map((claim) => (
            <div
              key={claim.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Electrician Header */}
                <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-teal-400" />
                      {claim.electrician_name || 'Electrician'}
                    </h3>
                    <p className="text-xs text-slate-400">Mobile: <span className="font-mono text-slate-300">{claim.electrician_mobile}</span></p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    claim.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : claim.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {claim.status}
                  </span>
                </div>

                {/* Claim Details */}
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bill Ref Number</span>
                      <span className="font-mono font-bold text-slate-200">{claim.bill_no}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Bill Amount</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">₹{claim.bill_amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Claimed Points</span>
                      <span className="font-mono font-extrabold text-amber-400 text-sm">+{claim.claimed_points} Pts</span>
                    </div>
                  </div>

                  {/* Invoice Bill Image Thumbnail & View Button */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {claim.invoice_image_url ? (
                        <img
                          src={claim.invoice_image_url}
                          alt="Invoice Bill"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-700 cursor-pointer"
                          onClick={() => setSelectedInvoiceImage(claim.invoice_image_url || null)}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                          <Image className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <span className="text-slate-200 font-bold block text-xs">Uploaded Bill Photo</span>
                        <span className="text-[10px] text-slate-400">Click preview to inspect receipt</span>
                      </div>
                    </div>

                    {claim.invoice_image_url && (
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceImage(claim.invoice_image_url || null)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Bill</span>
                      </button>
                    )}
                  </div>

                  {claim.remarks && (
                    <div className="text-slate-300 text-[11px] bg-slate-900/40 p-2 rounded-lg">
                      <span className="text-slate-500 block">Remarks:</span>
                      {claim.remarks}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500">
                    Submitted: {new Date(claim.submitted_date).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Admin Action Buttons (for pending items) */}
              {claim.status === 'pending' && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Rejection comment..."
                      value={rejectRemarks[claim.id] || ''}
                      onChange={(e) => setRejectRemarks({ ...rejectRemarks, [claim.id]: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-[11px] rounded-lg glass-input"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(claim.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(claim.id)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-extrabold shadow-md shadow-emerald-500/20"
                    >
                      Approve Claim
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invoice Full Image Inspection Lightbox Modal */}
      {selectedInvoiceImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl w-full glass-panel border border-slate-700 rounded-2xl p-4 overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setSelectedInvoiceImage(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-700"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full mb-3 text-left">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Uploaded Electrician Bill Invoice Document
              </h3>
              <p className="text-[11px] text-slate-400">Inspect receipt details before approving reward points.</p>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-2">
              <img
                src={selectedInvoiceImage}
                alt="Full Invoice Bill"
                className="max-w-full h-auto object-contain rounded-lg mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Simulate Claim Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-teal-400" />
              Simulate Electrician Point Claim
            </h3>

            <form onSubmit={handleNewClaimSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Electrician *</label>
                <select
                  value={selectedElectricianId}
                  onChange={(e) => setSelectedElectricianId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                >
                  {electricians.map(e => (
                    <option key={e.id} value={e.id} className="bg-slate-900 text-slate-200">
                      {e.name} ({e.mobile})
                    </option>
                  ))}
                </select>
              </div>

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
                <label className="block text-slate-300 font-medium mb-1">Bill Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono font-bold text-emerald-400"
                />
              </div>

              {/* Upload Invoice Image Input */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Upload Invoice Bill Image Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 cursor-pointer"
                />
                {invoiceImagePreview && (
                  <div className="mt-2 flex items-center space-x-2">
                    <img
                      src={invoiceImagePreview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                    />
                    <span className="text-[11px] text-teal-400 font-medium">Invoice image loaded</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Claim Remarks</label>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold hover:brightness-110"
                >
                  Submit Claim to Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
