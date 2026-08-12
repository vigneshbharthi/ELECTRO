import React, { useState } from 'react';
import { Plus, Trash2, FileSpreadsheet, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { OrderMan, Order, Product, OrderItem } from '../types';

interface OrderBookModuleProps {
  orderMan: OrderMan;
  products: Product[];
  orders: Order[];
  settings: { pointsPercent: number; minBillAmount: number; appName: string };
  onAddOrder: (order: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: 'pending' | 'billed', remarks?: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}

export const OrderBookModule: React.FC<OrderBookModuleProps> = ({
  orderMan, products, orders, settings,
  onAddOrder, onUpdateOrder, onUpdateOrderStatus, onDeleteOrder
}) => {
  const myOrders = orders.filter(o => o.order_man_id === orderMan.id);
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<{ id: string; product_id: string; product_name: string; uom: string; qty: number; rate: number; amount: number }[]>([]);
  const [remarks, setRemarks] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const addItemRow = () => {
    setItems([...items, { id: `line-${crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random()}`, product_id: '', product_name: '', uom: '', qty: 1, rate: 0, amount: 0 }]);
  };
  const updateItemRow = (idx: number, field: string, value: any) => {
    const updated = [...items];
    const row = { ...updated[idx] };
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      row.product_id = value || '';
      row.product_name = prod?.name || '';
      row.uom = prod?.uom || '';
      row.rate = prod?.price || 0;
      row.amount = (row.qty || 1) * (row.rate || 0);
    } else if (field === 'qty') {
      row.qty = Number(value) || 0;
      row.amount = row.qty * row.rate;
    } else {
      (row as any)[field] = value;
    }
    updated[idx] = row;
    setItems(updated);
  };
  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };
  const totalAmount = items.reduce((sum, it) => sum + (it.amount || 0), 0);

  const handleSaveOrder = async () => {
    if (!customerName.trim()) { alert('Please enter customer name'); return; }
    if (items.length === 0) { alert('Please add at least one product line item'); return; }
    if (items.some(it => !it.product_id)) { alert('Please select product for all line items'); return; }
    if (items.some(it => !it.qty || it.qty <= 0)) { alert('Qty must be greater than zero for every line item'); return; }

    const orderData = {
      order_man_id: orderMan.id,
      order_man_name: orderMan.name,
      customer_name: customerName.trim(),
      items: items.map(it => ({
        id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        uom: it.uom,
        qty: it.qty,
        rate: it.rate,
        amount: it.amount
      })),
      total_amount: totalAmount,
      status: 'pending' as 'pending',
      remarks: remarks.trim(),
      order_date: new Date().toISOString()
    };

    if (editingId) {
      await onUpdateOrder(editingId, {
        customer_name: orderData.customer_name,
        items: orderData.items,
        total_amount: orderData.total_amount,
        remarks: orderData.remarks
      });
      setEditingId(null);
    } else {
      await onAddOrder(orderData);
    }
    setShowModal(false);
    setCustomerName('');
    setItems([]);
    setRemarks('');
  };

  const openEdit = (order: Order) => {
    setEditingId(order.id);
    setCustomerName(order.customer_name);
    setRemarks(order.remarks || '');
    setItems(order.items.map(it => ({
      id: it.id || `line-${Date.now()}`,
      product_id: it.product_id,
      product_name: it.product_name,
      uom: it.uom,
      qty: it.qty,
      rate: it.rate,
      amount: it.amount
    })));
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-violet-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-violet-400">Order Man Portal</span>
            <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">Welcome, {orderMan.name}</h2>
            <p className="text-xs text-slate-400 mt-1">Region: <span className="text-violet-300 font-bold">{orderMan.region}</span></p>
          </div>
          <button
            onClick={() => { setShowModal(true); setEditingId(null); setCustomerName(''); setItems([]); setRemarks(''); }}
            className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-slate-950 font-extrabold text-xs shadow-lg hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-slate-100 text-sm">My Orders ({myOrders.length})</h3>
        {myOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No orders yet. Click <strong>New Order</strong> to start.</div>
        ) : (
          <div className="space-y-3">
            {myOrders.map(order => (
              <div key={order.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-violet-300">#{order.order_no}</span>
                    <h4 className="text-sm font-bold text-slate-100">{order.customer_name}</h4>
                    <p className="text-[11px] text-slate-400">{new Date(order.order_date).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${order.status === 'billed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-3 text-xs border border-slate-800/60">
                  <table className="w-full text-left">
                    <tbody>
                      {order.items.map((it, i) => (
                        <tr key={i} className="border-b border-slate-800/40 last:border-0">
                          <td className="py-1 text-slate-300">{it.product_name}</td>
                          <td className="py-1 text-slate-400">{it.qty} x ₹{it.rate}</td>
                          <td className="py-1 text-right text-amber-400 font-mono font-bold">₹{it.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-right text-sm font-extrabold text-slate-100 mt-2 border-t border-slate-800 pt-2">Total: ₹{order.total_amount}</div>
                </div>
                {order.remarks && <p className="text-[11px] text-slate-500">Remarks: {order.remarks}</p>}
                <div className="flex items-center gap-2 pt-2">
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => openEdit(order)} className="text-[11px] font-bold text-teal-400 hover:underline">Edit</button>
                      <button onClick={() => { if (confirm(`Delete order ${order.order_no}? This cannot be undone.`)) onDeleteOrder(order.id); }} className="text-[11px] font-bold text-rose-400 hover:underline">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New / Edit Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 relative border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-violet-400" />
              {editingId ? 'Edit Order' : 'New Order'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Type customer name..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-xs font-bold">Line Items</label>
                  <button onClick={addItemRow} className="text-xs font-extrabold text-violet-300 hover:text-violet-200 flex items-center gap-1" type="button">
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={it.id} className="flex items-end gap-2">
                      <div className="flex-1">
                        <select
                          value={it.product_id}
                          onChange={e => updateItemRow(idx, 'product_id', e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                        >
                          <option value="">Select product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (₹{p.price} / {p.uom})</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={e => updateItemRow(idx, 'qty', Number(e.target.value))}
                        className="w-20 px-2 py-2 rounded-xl glass-input text-xs"
                        placeholder="Qty"
                      />
                      <span className="text-xs text-slate-300 font-mono w-16">₹{it.amount}</span>
                      <button onClick={() => removeItemRow(idx)} className="text-rose-400 hover:text-rose-300 p-1" title="Remove" type="button">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-100 border-t border-slate-800 pt-2">
                <span>Running Total:</span>
                <span>₹{totalAmount}</span>
              </div>

              <textarea
                placeholder="Remarks (optional)..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs h-20 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800" type="button">Cancel</button>
                <button onClick={handleSaveOrder} className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500" type="button">Save Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
