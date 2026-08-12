import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, Filter, Search, UserCheck, Calendar, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { Electrician, PointTransaction } from '../types';

interface PointsLedgerReportProps {
  electricians: Electrician[];
  transactions: PointTransaction[];
  selectedElectricianId?: string;
}

export const PointsLedgerReport: React.FC<PointsLedgerReportProps> = ({
  electricians,
  transactions,
  selectedElectricianId: initialElectricianId
}) => {
  const [selectedElectricianId, setSelectedElectricianId] = useState<string>(initialElectricianId || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Filter transactions
  const selectedElec = electricians.find(e => e.id === selectedElectricianId);
  const filteredTransactions = transactions.filter(t => {
    const matchesElectrician = selectedElectricianId === 'all' || 
      t.electrician_id === selectedElectricianId || 
      (selectedElec && (t.electrician_name === selectedElec.name || t.electrician_id === selectedElec.id));
    const matchesSearch = (t.particular || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.electrician_name && t.electrician_name.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDate = true;
    const txTime = new Date(t.date).getTime();

    if (datePreset === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      matchesDate = txTime >= todayStart;
    } else if (datePreset === 'thisWeek') {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      matchesDate = txTime >= sevenDaysAgo;
    } else if (datePreset === 'thisMonth') {
      const now = new Date();
      const txDate = new Date(t.date);
      matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    } else if (datePreset === 'custom') {
      if (fromDate) {
        const fromTime = new Date(fromDate).setHours(0, 0, 0, 0);
        matchesDate = matchesDate && txTime >= fromTime;
      }
      if (toDate) {
        const toTime = new Date(toDate).setHours(23, 59, 59, 999);
        matchesDate = matchesDate && txTime <= toTime;
      }
    }

    return matchesElectrician && matchesSearch && matchesDate;
  });

  // Sort ascending by date for proper running ledger balance calculation
  const sortedForLedger = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute running balance for each row
  let runningBalance = 0;
  const ledgerRows = sortedForLedger.map((tx, index) => {
    runningBalance += (tx.credit_points || 0) - (tx.debit_points || 0);
    return {
      sNo: index + 1,
      ...tx,
      balance: runningBalance
    };
  });

  // Calculate Summary Metrics
  const totalCredit = ledgerRows.reduce((sum, r) => sum + (r.credit_points || 0), 0);
  const totalDebit = ledgerRows.reduce((sum, r) => sum + (r.debit_points || 0), 0);
  const netBalance = totalCredit - totalDebit;

  const currentElectrician = electricians.find(e => e.id === selectedElectricianId);

  // Print Ledger action
  const handlePrint = () => {
    window.print();
  };

  // CSV Export action
  const handleExportCSV = () => {
    const headers = ['S.No', 'Date', 'Electrician', 'Particular', 'Debit Points', 'Credit Points', 'Balance'];
    const csvLines = ledgerRows.map(r => [
      r.sNo,
      `"${new Date(r.date).toLocaleString('en-IN')}"`,
      `"${r.electrician_name || ''}"`,
      `"${r.particular.replace(/"/g, '""')}"`,
      r.debit_points || 0,
      r.credit_points || 0,
      r.balance
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvLines].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JBS_Electro_Points_Ledger_${selectedElectricianId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-teal-400" />
              Points Ledger Report (Standard Statement)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Accounting ledger format featuring <strong>S.No, Date, Particular, Debit Points, Credit Points, & Balance</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>CSV Export</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row: Electrician Filter, Search & DATE RANGE FILTERS */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-3">
          {/* Electrician Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={selectedElectricianId}
              onChange={(e) => setSelectedElectricianId(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer max-w-[200px]"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Electricians</option>
              {electricians.map(e => (
                <option key={e.id} value={e.id} className="bg-slate-900 text-slate-200">
                  {e.name} ({e.mobile})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Presets */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${datePreset === 'all' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setDatePreset('today')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${datePreset === 'today' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400'}`}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('thisWeek')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${datePreset === 'thisWeek' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDatePreset('thisMonth')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${datePreset === 'thisMonth' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setDatePreset('custom')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${datePreset === 'custom' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400'}`}
            >
              Custom Range
            </button>
          </div>

          {/* Custom Date Range Inputs (From Date & To Date) */}
          {datePreset === 'custom' && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-teal-400 ml-1" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs"
              />
            </div>
          )}

          {/* Search particular */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search particular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Credit Points</p>
            <h3 className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">+{totalCredit} Pts</h3>
          </div>
          <ArrowUpRight className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Debit Points</p>
            <h3 className="text-xl font-extrabold text-rose-400 font-mono mt-0.5">-{totalDebit} Pts</h3>
          </div>
          <ArrowDownLeft className="w-8 h-8 text-rose-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-teal-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Net Active Balance</p>
            <h3 className="text-xl font-extrabold text-teal-300 font-mono mt-0.5">{netBalance} Pts</h3>
          </div>
          <Wallet className="w-8 h-8 text-teal-500/30" />
        </div>
      </div>

      {/* Printable Statement Title */}
      <div className="hidden print-only mb-4">
        <h1 className="text-2xl font-bold">JBS Electro - Points Statement Ledger</h1>
        {currentElectrician && (
          <p className="text-sm">
            Electrician: {currentElectrician.name} | Mobile: {currentElectrician.mobile} | Address: {currentElectrician.address} ({currentElectrician.pincode})
          </p>
        )}
        <p className="text-xs text-gray-500">Statement Generated On: {new Date().toLocaleString()}</p>
      </div>

      {/* Accounting Ledger Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-16 text-center">S.No</th>
                <th className="py-3.5 px-4 w-44">Date & Time</th>
                {selectedElectricianId === 'all' && <th className="py-3.5 px-4">Electrician</th>}
                <th className="py-3.5 px-4">Particular (Description)</th>
                <th className="py-3.5 px-4 text-right text-rose-400">Debit Points (-)</th>
                <th className="py-3.5 px-4 text-right text-emerald-400">Credit Points (+)</th>
                <th className="py-3.5 px-4 text-right text-teal-300">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={selectedElectricianId === 'all' ? 7 : 6} className="py-10 text-center text-slate-500">
                    No ledger transaction entries found for the selected date range and filters.
                  </td>
                </tr>
              ) : (
                ledgerRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {row.sNo}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {new Date(row.date).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    {selectedElectricianId === 'all' && (
                      <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                        {row.electrician_name || 'Electrician'}
                      </td>
                    )}
                    <td className="py-3 px-4 font-sans text-slate-200">
                      {row.particular}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      {row.debit_points > 0 ? `-${row.debit_points}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {row.credit_points > 0 ? `+${row.credit_points}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-teal-300">
                      {row.balance} Pts
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
