import React, { useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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
              <React.Fragment key={order.id}>
                <tr className="hover:bg-slate-900/30 transition-colors">
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
                    onClick={() => setEditingOrder(editingOrder?.id === order.id ? null : order)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-[10px] font-extrabold"
                    title="View / Edit"
                  >
                    <span>{editingOrder?.id === order.id ? 'Close' : 'View/Edit'}</span>
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
              {editingOrder?.id === order.id && (
                <tr>
                  <td colSpan={7} className="bg-slate-900/40 px-4 py-4 border-b border-slate-800">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">Full Line Items</h4>
                          <p className="text-xs text-slate-400">#{order.order_no} · {order.customer_name}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const newCustomer = prompt('Customer name:', order.customer_name);
                            const newRemarks = prompt('Remarks:', order.remarks || '');
                            if (onUpdateOrder && (newCustomer !== null || newRemarks !== null)) {
                              const updates: Partial<Order> = {};
                              if (newCustomer !== null && newCustomer.trim()) updates.customer_name = newCustomer.trim();
                              if (newRemarks !== null) updates.remarks = newRemarks || '';
                              await onUpdateOrder?.(order.id, updates);
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-violet-600 text-white text-[10px] font-extrabold hover:bg-violet-500"
                        >
                          Save Edit
                        </button>
                      </div>
                      <table className="w-full text-xs bg-slate-950/40 rounded-xl overflow-hidden">
                        <thead className="bg-slate-800/60 text-slate-300 text-[10px] uppercase font-extrabold">
                          <tr>
                            <th className="px-2 py-1.5 text-left">Product</th>
                            <th className="px-2 py-1.5 text-center">Qty</th>
                            <th className="px-2 py-1.5 text-right">Rate (₹)</th>
                            <th className="px-2 py-1.5 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((it, i) => (
                            <tr key={i} className="border-t border-slate-800/40">
                              <td className="px-2 py-1 text-slate-200">{it.product_name}</td>
                              <td className="px-2 py-1 text-center text-slate-300">{it.qty}</td>
                              <td className="px-2 py-1 text-right text-slate-400 font-mono">{it.rate}</td>
                              <td className="px-2 py-1 text-right text-amber-400 font-mono font-bold">{it.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500 text-xs">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
