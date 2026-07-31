import React, { useState } from 'react';
import { Package, Search, Tag, Filter } from 'lucide-react';
import { Product, OrderMan } from '../types';

interface OrderManProductViewProps {
  orderMan: OrderMan;
  products: Product[];
}

export const OrderManProductView: React.FC<OrderManProductViewProps> = ({
  orderMan,
  products
}) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const availableGroups = Array.from(new Set(products.map(p => p.group_name)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.uom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || p.group_name === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Order Man Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-purple-500">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-purple-400">
            Order Man Sales Portal
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-0.5">
            Product Price & Stock Search Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sales Staff: <strong className="text-slate-200">{orderMan.name}</strong> • Region: <span className="text-purple-300 font-semibold">{orderMan.region}</span>
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Group Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Categories</option>
              {availableGroups.map(g => (
                <option key={g} value={g} className="bg-slate-900 text-slate-200">{g}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, category, UOM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input"
            />
          </div>
        </div>
      </div>

      {/* Product Price Catalog Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category / Group</th>
                <th className="py-3.5 px-4">Unit of Measure (UOM)</th>
                <th className="py-3.5 px-4 text-right">Unit Price (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100 text-sm">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-purple-300 border border-slate-700">
                        <Tag className="w-3 h-3 text-purple-400" />
                        {p.group_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {p.uom}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-400 text-sm">
                      ₹{p.price.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
