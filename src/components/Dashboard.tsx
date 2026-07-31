import React from 'react';
import { Users, Package, Award, FileSpreadsheet, ArrowUpRight, TrendingUp, Zap, ShieldCheck, UserCheck, Plus } from 'lucide-react';
import { Electrician, Product, PointTransaction } from '../types';

interface DashboardProps {
  electricians: Electrician[];
  products: Product[];
  transactions: PointTransaction[];
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  electricians,
  products,
  transactions,
  onNavigate
}) => {
  const totalElectricians = electricians.length;
  const totalProducts = products.length;

  const totalCredit = transactions.reduce((acc, t) => acc + (t.credit_points || 0), 0);
  const totalDebit = transactions.reduce((acc, t) => acc + (t.debit_points || 0), 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900/60 via-slate-900 to-slate-950 border border-teal-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Welcome to ELECTRO System</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Electrician Loyalty & Points Ledger Management
          </h1>

          <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
            Seamlessly manage electrician profiles, catalog product reward values, process points redemptions, and view accounting ledger statements.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => onNavigate('electricians')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-teal-500/20"
            >
              <Users className="w-4 h-4" />
              <span>Manage Electricians</span>
            </button>

            <button
              onClick={() => onNavigate('ledger')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span>View Points Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('electricians')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Electricians</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-100 mt-3">{totalElectricians}</h3>
          <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            Active Profiles
          </p>
        </div>

        <div
          onClick={() => onNavigate('products')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Product Items</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-100 mt-3">{totalProducts}</h3>
          <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1 font-medium">
            Catalog Items
          </p>
        </div>

        <div
          onClick={() => onNavigate('ledger')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Reward Credits</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-3 font-mono">+{totalCredit}</h3>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            Points Awarded
          </p>
        </div>

        <div
          onClick={() => onNavigate('redemption')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Points Redeemed</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-amber-400 mt-3 font-mono">-{totalDebit}</h3>
          <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
            Redeemed by Admin
          </p>
        </div>
      </div>

      {/* Grid containing Recent Activity and Quick Electrician Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              Recent Ledger Transactions
            </h3>
            <button
              onClick={() => onNavigate('ledger')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-200">{tx.particular}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tx.electrician_name || 'Electrician'} • {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  {tx.credit_points > 0 && (
                    <span className="font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
                      +{tx.credit_points} Pts
                    </span>
                  )}
                  {tx.debit_points > 0 && (
                    <span className="font-mono font-extrabold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/30">
                      -{tx.debit_points} Pts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Electrician Summary */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserCheck className="w-5 h-5 text-teal-400" />
            Top Electricians
          </h3>

          <div className="space-y-3">
            {electricians.slice(0, 4).map((elec) => (
              <div key={elec.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-200">{elec.name}</h4>
                  <p className="text-[11px] text-slate-400">{elec.mobile} • {elec.experience} yrs exp</p>
                </div>
                <span className="font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                  {elec.points_balance} Pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
