import React, { useState, useEffect, useRef } from 'react';
import { Zap, Database, FileInput, BarChart3, Settings, ShieldAlert, LogOut, CheckCircle2, ChevronDown, Users, Package, Receipt, Award, FileSpreadsheet, Sliders, UserCheck, Menu, X, Building2, Contact } from 'lucide-react';
import { APP_NAME } from '../lib/appConfig';
import { UserAuth, CompanyProfile } from '../types';

interface NavbarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  auth: UserAuth;
  setAuth: React.Dispatch<React.SetStateAction<UserAuth>>;
  onOpenAuthModal: () => void;
  companyProfile?: CompanyProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  setActiveModule,
  auth,
  setAuth,
  onOpenAuthModal,
  companyProfile
}) => {
  const displayName = companyProfile?.companyName?.trim() || APP_NAME;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navCategories = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Zap,
      items: null
    },
    {
      id: 'masters',
      label: 'Masters',
      icon: Database,
      items: [
        { id: 'electricians', label: 'Electrician Master', icon: Users, desc: 'Electrician Profiles & Passwords' },
        { id: 'ordermen', label: 'Order Man Master', icon: UserCheck, desc: 'Sales Credentials & Regions' },
        { id: 'customers', label: 'Customer Master', icon: Contact, desc: 'Customer Profiles for Order Book' },
        { id: 'products', label: 'Product Master (Order Man)', icon: Package, desc: 'Product Prices & CSV Upload' }
      ]
    },
    {
      id: 'entries',
      label: 'Entries',
      icon: FileInput,
      items: [
        { id: 'claims_approval', label: 'Electrician Claims Approval', icon: ShieldAlert, desc: 'Invoice Photos & Approve Points' },
        { id: 'bill_entry', label: 'Bill Value & Points Credit', icon: Receipt, desc: 'Bill Value to Points Entry' },
        { id: 'redemption_entry', label: 'Points Redemption Entry', icon: Award, desc: 'Admin Points Debit & Redemptions' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      items: [
        { id: 'ledger_report', label: 'Points Ledger Report', icon: FileSpreadsheet, desc: 'S.No, Date, Particular, Debit, Credit, Balance' },
        { id: 'order_book_report', label: 'Order Book Report', icon: FileSpreadsheet, desc: 'All Order Man Sales Orders' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      items: [
        { id: 'company_profile', label: 'Company Profile & Credentials', icon: Building2, desc: 'Company Info & Change Admin/Dev Passwords' },
        { id: 'app_settings', label: 'System & Points Config', icon: Sliders, desc: 'Bill-to-Points Ratio & System Config' }
      ]
    }
  ];

  const orderManNav = [
    { id: 'dashboard', label: 'Dashboard', icon: Zap, items: null },
    { id: 'order_man', label: 'Order Man', icon: UserCheck, items: [
      { id: 'order_book', label: 'Order Book', icon: FileSpreadsheet, desc: 'Create & View Sales Orders' },
      { id: 'order_catalog', label: 'Product Catalog', icon: Package, desc: 'Product Price & Stock Catalog' }
    ] },
  ];

  const displayCategories = auth.userRole === 'orderman' ? orderManNav : (auth.userRole === 'electrician' ? [] : navCategories);

  const handleSelectSubModule = (subId: string) => {
    setActiveModule(subId);
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const toggleDropdown = (catId: string) => {
    if (catId === 'dashboard') {
      setActiveModule('dashboard');
      setOpenDropdown(null);
      setIsMobileMenuOpen(false);
    } else {
      setOpenDropdown(prev => (prev === catId ? null : catId));
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 shadow-2xl" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo — dynamic per deployment via VITE_APP_NAME */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveModule('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Zap className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                {displayName}
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                ERP System
              </span>
            </div>
          </div>

          {/* Classic Dropdown Navigation Bar (Desktop) */}
          {auth.userRole !== 'electrician' && (
            <nav className="hidden md:flex items-center space-x-1">
              {displayCategories.map((cat) => {
                const Icon = cat.icon;
                const isCategoryActive = cat.id === 'dashboard'
                  ? activeModule === 'dashboard'
                  : cat.items?.some(i => i.id === activeModule);
                const isOpen = openDropdown === cat.id;

                if (!cat.items) {
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleDropdown('dashboard')}
                      className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeModule === 'dashboard'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-teal-400" />
                      <span>{cat.label}</span>
                    </button>
                  );
                }

                return (
                  <div key={cat.id} className="relative">
                    <button
                      onClick={() => toggleDropdown(cat.id)}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isCategoryActive || isOpen
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-teal-400" />
                      <span>{cat.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-400' : ''}`} />
                    </button>

                    {/* Classic Reliable Dropdown Menu */}
                    {isOpen && (
                      <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                        <div className="px-3 py-1 text-[10px] uppercase font-extrabold text-slate-400 border-b border-slate-800 mb-1">
                          {cat.label} Options
                        </div>
                        {cat.items.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeModule === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => handleSelectSubModule(sub.id)}
                              className={`w-full flex items-start space-x-3 px-3 py-2.5 text-left transition-colors ${
                                isSubActive
                                  ? 'bg-teal-500/20 text-teal-300 font-bold border-l-2 border-teal-400'
                                  : 'text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <SubIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isSubActive ? 'text-teal-400' : 'text-slate-400'}`} />
                              <div>
                                <span className="text-xs block font-bold">{sub.label}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{sub.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {/* User Auth & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Auth Login Status */}
            {auth.isAuthenticated ? (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[180px]">
                  {auth.username} <span className="text-[10px] text-teal-400 font-mono">({auth.userRole})</span>
                </span>
                <button
                  onClick={() => { localStorage.removeItem('jbs_electro_auth'); setAuth({ isAuthenticated: false, isDeveloperMode: false, userRole: 'guest', username: 'Guest' }); }}
                  className="text-slate-400 hover:text-red-400 p-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 p-4 space-y-2 animate-fadeIn">
          {displayCategories.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <button
                onClick={() => toggleDropdown(cat.id)}
                className="w-full text-left flex items-center justify-between p-2.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-bold border border-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <cat.icon className="w-4 h-4 text-teal-400" />
                  <span>{cat.label}</span>
                </div>
                {cat.items && <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {cat.items && openDropdown === cat.id && (
                <div className="pl-4 space-y-1 pt-1">
                  {cat.items.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubModule(sub.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center space-x-2 ${
                        activeModule === sub.id ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <sub.icon className="w-3.5 h-3.5 text-teal-400" />
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
