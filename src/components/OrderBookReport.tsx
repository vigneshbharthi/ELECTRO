import React, { useState } from 'react';
import { CheckCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { Order, OrderMan, Product } from '../types';

interface OrderBookReportProps {
  orders: Order[];
  orderMen: OrderMan[];
  products: Product[];
  onUpdateOrderStatus: (id: string, status: 'pending' | 'billed', remarks?: string) => Promise<void>;
  onUpdateOrder?: (id: string, updates: Partial<Order>) => Promise<void>;
}

export const OrderBookReport: React.FC<OrderBookReportProps> = ({ orders, orderMen, products, onUpdateOrderStatus, onUpdateOrder }) => {
  const [filterMan, setFilterMan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomer, setEditCustomer] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editItems, setEditItems] = useState<{ id: string; product_id: string; product_name: string; uom: string; qty: number; rate: number; amount: number; searchText?: string }[]>([]);

  const filtered = orders.filter(o => {
    const manMatch = filterMan === 'all' || o.order_man_id === filterMan;
    const statusMatch = filterStatus === 'all' || o.status === filterStatus;
    return manMatch && statusMatch;
  });

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <h2 className="text-xl font-extrabold text-slate-100">Order Book Report (Admin)</h2>
      <div className="flex gap-2 flex-wrap">
        <select value={filterMan} onChange={e => setFilterMan(e.target.value)} className="px-3 py-1.5 rounded-xl glass-input text-xs font-bold">
          <option value="all">All Order Men</option>
          {orderMen.map(om => <option key={om.id} value={om.id}>{om.name} ({om.region})</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-xl glass-input text-xs font-bold">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="billed">Billed</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/60 text-slate-300 font-extrabold uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left">Order No</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Order Man</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Total (₹)</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(order => (
                <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                <td className="px-3 py-2 font-mono text-teal-300 font-bold">{order.order_no}</td>
                <td className="px-3 py-2 text-slate-200">{order.customer_name}</td>
                <td className="px-3 py-2 text-slate-400">{order.order_man_name || orderMen.find(om => om.id === order.order_man_id)?.name || '-'}</td>
                <td className="px-3 py-2 text-slate-400">{new Date(order.order_date).toLocaleDateString('en-IN')}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-amber-400">₹{order.total_amount}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${order.status === 'billed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-center flex gap-1 justify-center">
                  <button
                    onClick={() => setViewOrder(order)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-[10px] font-extrabold"
                    title="View line items"
                  >
                    <span>View</span>
                  </button>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'billed', 'Billed by admin')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] font-extrabold"
                      title="Mark as Billed"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Billed</span>
                    </button>
                  )}
                  {order.status === 'billed' && (
                    <span className="text-[10px] text-slate-500">Done</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500 text-xs">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditingOrder(null)}>
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 relative border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-100 mb-4">Edit Order #{editingOrder.order_no}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={editCustomer}
                  onChange={e => setEditCustomer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-xs font-bold">Line Items</label>
                  <button
                    type="button"
                    onClick={() => setEditItems([...editItems, { id: `line-${Date.now()}-${Math.random()}`, product_id: '', product_name: '', uom: '', qty: 1, rate: 0, amount: 0, searchText: '' }])}
                    className="text-xs font-extrabold text-violet-300 hover:text-violet-200 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>
                <div className="space-y-2">
                  {editItems.map((it, idx) => (
                    <div key={it.id} className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={it.searchText || it.product_name || ''}
                          onChange={e => {
                            const val = e.target.value;
                            const updated = [...editItems];
                            updated[idx] = { ...updated[idx], searchText: val, product_id: '', product_name: '', uom: '', rate: 0, amount: 0 };
                            setEditItems(updated);
                          }}
                          placeholder="Search product..."
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                        />
                        {editItems[idx].searchText && (
                          <div className="absolute z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto mt-1 w-full">
                            {products.filter(p => (p.name || '').toLowerCase().includes((editItems[idx].searchText || '').toLowerCase())).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const updated = [...editItems];
                                  updated[idx] = { ...updated[idx], product_id: p.id, product_name: p.name, uom: p.uom, qty: updated[idx].qty || 1, rate: p.price || 0, amount: (updated[idx].qty || 1) * (p.price || 0), searchText: '' };
                                  setEditItems(updated);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 text-slate-200"
                              >
                                {p.name} (₹{p.price} / {p.uom})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={e => {
                          const updated = [...editItems];
                          updated[idx] = { ...updated[idx], qty: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * updated[idx].rate };
                          setEditItems(updated);
                        }}
                        className="w-20 px-2 py-2 rounded-xl glass-input text-xs"
                        placeholder="Qty"
                      />
                      <span className="text-xs text-slate-300 font-mono w-16">₹{it.amount}</span>
                      <button type="button" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300 p-1" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-100 border-t border-slate-800 pt-2">
                <span>Total:</span>
                <span>₹{editItems.reduce((s, it) => s + (it.amount || 0), 0)}</span>
              </div>
              <textarea
                placeholder="Remarks (optional)..."
                value={editRemarks}
                onChange={e => setEditRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs h-20 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingOrder(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800" type="button">Cancel</button>
                <button
                  onClick={async () => {
                    if (!onUpdateOrder) { setEditingOrder(null); return; }
                    if (!editCustomer.trim()) { alert('Customer name is required'); return; }
                    if (editItems.length === 0 || editItems.some(it => !it.product_id)) { alert('Add at least one product with a valid selection'); return; }
                    await onUpdateOrder(editingOrder.id, {
                      customer_name: editCustomer.trim(),
                      items: editItems.map(it => ({
                        id: it.id,
                        product_id: it.product_id,
                        product_name: it.product_name,
                        uom: it.uom,
                        qty: it.qty,
                        rate: it.rate,
                        amount: it.amount
                      })),
                      total_amount: editItems.reduce((s, it) => s + (it.amount || 0), 0),
                      remarks: editRemarks
                    });
                    setEditingOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500"
                  type="button"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setViewOrder(null)}>
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 relative border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Order #{viewOrder.order_no}</h3>
                <p className="text-xs text-slate-400">{new Date(viewOrder.order_date).toLocaleString('en-IN')}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${viewOrder.status === 'billed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                {viewOrder.status}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">Customer Name</label>
                <p className="text-sm font-bold text-slate-100">{viewOrder.customer_name}</p>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">Line Items</label>
                <table className="w-full text-xs">
                  <thead className="bg-slate-800/60 text-slate-300 uppercase">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Product</th>
                      <th className="px-2 py-1.5 text-center">Qty</th>
                      <th className="px-2 py-1.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items.map((it, i) => (
                      <tr key={i} className="border-t border-slate-800/40">
                        <td className="px-2 py-1 text-slate-200">{it.product_name}</td>
                        <td className="px-2 py-1 text-center text-slate-300">{it.qty} x {it.uom}</td>
                        <td className="px-2 py-1 text-right text-amber-400 font-mono font-bold">₹{it.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right text-sm font-extrabold text-slate-100 mt-2 border-t border-slate-800 pt-2">Total: ₹{viewOrder.total_amount}</div>
              </div>
              {viewOrder.remarks && (
                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1">Remarks</label>
                  <p className="text-sm text-slate-400">{viewOrder.remarks}</p>
                </div>
              )}
              {viewOrder.voice_note_url && (
                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1">Voice Note</label>
                  <audio src={viewOrder.voice_note_url} controls className="w-full h-10" />
                </div>
              )}
              {viewOrder.status === 'pending' && (
                <button
                  onClick={() => {
                    setEditingOrder(viewOrder);
                    setEditCustomer(viewOrder.customer_name);
                    setEditRemarks(viewOrder.remarks || '');
                    setEditItems(viewOrder.items.map(it => ({ ...it, searchText: '' })));
                    setViewOrder(null);
                  }}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs"
                >
                  Edit Order
                </button>
              )}
              <div className="flex justify-end">
                <button onClick={() => setViewOrder(null)} className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-slate-700 hover:bg-slate-600" type="button">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
