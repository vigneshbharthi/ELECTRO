import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ElectricianCrud } from './components/ElectricianCrud';
import { OrderManCrud } from './components/OrderManCrud';
import { ProductCrud } from './components/ProductCrud';
import { BillEntryModule } from './components/BillEntryModule';
import { PointsRedemption } from './components/PointsRedemption';
import { ElectricianClaimsApproval } from './components/ElectricianClaimsApproval';
import { PointsLedgerReport } from './components/PointsLedgerReport';
import { SettingsModule } from './components/SettingsModule';
import { CompanyProfileSettings } from './components/CompanyProfileSettings';
import { ElectricianPortal } from './components/ElectricianPortal';
import { OrderManProductView } from './components/OrderManProductView';
import { AuthModal } from './components/AuthModal';
import { dataService } from './services/dataService';
import { Electrician, OrderMan, Product, PointTransaction, Redemption, ElectricianClaim, UserAuth, AppSettings, CompanyProfile } from './types';

export function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // App Settings & Company Profile
  const getInitialSettings = (): AppSettings => {
    const defaults: AppSettings = { pointsPercent: 1, minBillAmount: 100, appName: 'JBS Electro' };
    try {
      const stored = localStorage.getItem('jbs_electro_app_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate legacy pointsPerRupee -> pointsPercent and guard against NaN
        const pointsPercent = (typeof parsed.pointsPercent === 'number' && !Number.isNaN(parsed.pointsPercent))
          ? parsed.pointsPercent
          : (typeof parsed.pointsPerRupee === 'number' && parsed.pointsPerRupee > 0)
            ? parsed.pointsPerRupee * 100  // 0.01 -> 1%
            : defaults.pointsPercent;
        const minBillAmount = (typeof parsed.minBillAmount === 'number') ? parsed.minBillAmount : defaults.minBillAmount;
        const appName = parsed.appName || defaults.appName;
        return { pointsPercent, minBillAmount, appName };
      }
    } catch {}
    return defaults;
  };
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

  // Persist settings to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('jbs_electro_app_settings', JSON.stringify(settings));
    } catch {}
    // Push to Supabase if current user is admin/developer (so electrician devices sync)
    if (auth.userRole === 'admin' || auth.userRole === 'developer') {
      persistAppSettingsToSupabase();
    }
  }, [settings]);

  // Fetch global app_settings from Supabase (cross-device sync — overrides local defaults)
  const syncAppSettingsFromSupabase = async () => {
    try {
      const supabaseSettings = await dataService.getAppSettings();
      if (supabaseSettings) {
        setSettings(supabaseSettings);
        localStorage.setItem('jbs_electro_app_settings', JSON.stringify(supabaseSettings));
      }
    } catch (e) {
      console.warn('App settings Supabase sync skipped:', e);
    }
  };

  // Push admin's current settings to Supabase so electricians see the same rate
  const persistAppSettingsToSupabase = async () => {
    try {
      await dataService.saveAppSettings(settings);
    } catch (e) {
      console.warn('App settings save to Supabase failed:', e);
    }
  };

  // On mount: try to load shared settings from Supabase
  useEffect(() => {
    syncAppSettingsFromSupabase();
  }, []);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => dataService.getCompanyProfile());

  // User Auth State - Persisted in localStorage so login survives page refresh
  const getInitialAuth = (): UserAuth => {
    try {
      const stored = localStorage.getItem('jbs_electro_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isAuthenticated) return parsed;
      }
    } catch {}
    return { isAuthenticated: false, isDeveloperMode: false, userRole: 'guest', username: 'Guest' };
  };
  const [auth, setAuth] = useState<UserAuth>(getInitialAuth);

  // Persist auth to localStorage on every change
  useEffect(() => {
    try {
      if (auth.isAuthenticated) {
        localStorage.setItem('jbs_electro_auth', JSON.stringify(auth));
      } else {
        localStorage.removeItem('jbs_electro_auth');
      }
    } catch {}
  }, [auth]);

  // Clear persisted auth on explicit logout
  const handleLogout = () => {
    localStorage.removeItem('jbs_electro_auth');
    setAuth({ isAuthenticated: false, isDeveloperMode: false, userRole: 'guest', username: 'Guest' });
  };

  // Application Data States
  const [electricians, setElectricians] = useState<Electrician[]>([]);
  const [orderMen, setOrderMen] = useState<OrderMan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [claims, setClaims] = useState<ElectricianClaim[]>([]);
  const [selectedLedgerElectricianId, setSelectedLedgerElectricianId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [elecs, oms, prods, txs, reds, clms] = await Promise.all([
        dataService.getElectricians(),
        dataService.getOrderMen(),
        dataService.getProducts(),
        dataService.getTransactions(),
        dataService.getRedemptions(),
        dataService.getClaims()
      ]);
      setElectricians(elecs);
      setOrderMen(oms);
      setProducts(prods);
      setTransactions(txs);
      setRedemptions(reds);
      setClaims(clms);
    } catch (e) {
      console.error('Data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    dataService.saveCompanyProfile(profile);
  };

  // ELECTRICIANS HANDLERS
  const handleAddElectrician = async (data: Omit<Electrician, 'id' | 'points_balance' | 'created_at' | 'updated_at'>) => {
    await dataService.addElectrician(data);
    await loadData();
  };

  const handleUpdateElectrician = async (id: string, updates: Partial<Electrician>) => {
    await dataService.updateElectrician(id, updates);
    await loadData();
  };

  const handleDeleteElectrician = async (id: string) => {
    await dataService.deleteElectrician(id);
    await loadData();
  };

  // ORDER MAN HANDLERS
  const handleAddOrderMan = async (data: Omit<OrderMan, 'id' | 'created_at' | 'updated_at'>) => {
    await dataService.addOrderMan(data);
    await loadData();
  };

  const handleUpdateOrderMan = async (id: string, updates: Partial<OrderMan>) => {
    await dataService.updateOrderMan(id, updates);
    await loadData();
  };

  const handleDeleteOrderMan = async (id: string) => {
    await dataService.deleteOrderMan(id);
    await loadData();
  };

  // PRODUCTS HANDLERS
  const handleAddProduct = async (data: Omit<Product, 'id' | 'updated_at' | 'created_at'>) => {
    await dataService.addProduct(data);
    await loadData();
  };

  const handleBulkAddProducts = async (productsList: Omit<Product, 'id' | 'updated_at' | 'created_at'>[]) => {
    await dataService.addBulkProducts(productsList);
    await loadData();
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    await dataService.updateProduct(id, updates);
    await loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    await dataService.deleteProduct(id);
    await loadData();
  };

  // TRANSACTIONS & CLAIMS HANDLERS
  const handleAddTransaction = async (tx: Omit<PointTransaction, 'id' | 'created_at'>) => {
    await dataService.addTransaction(tx);
    await loadData();
  };

  const handleRequestRedemption = async (redemption: Omit<Redemption, 'id' | 'status' | 'requested_date'>) => {
    await dataService.requestRedemption(redemption);
    await loadData();
  };

  const handleUpdateRedemptionStatus = async (id: string, status: 'approved' | 'rejected', remarks?: string) => {
    try {
      await dataService.updateRedemptionStatus(id, status, remarks);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update redemption status.');
    }
  };

  const handleUpdateClaimStatus = async (id: string, status: 'approved' | 'rejected', remarks?: string) => {
    try {
      await dataService.updateClaimStatus(id, status, remarks);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update claim status.');
    }
  };

  const handleSubmitClaim = async (claim: Omit<ElectricianClaim, 'id' | 'status' | 'submitted_date'>) => {
    await dataService.submitClaim(claim);
    await loadData();
  };

  const handleUpdateClaim = async (id: string, updates: Partial<ElectricianClaim>) => {
    try {
      await dataService.updateClaim(id, updates);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update claim.');
    }
  };

  const handleDeleteClaim = async (id: string) => {
    await dataService.deleteClaim(id);
    await loadData();
  };

  const handleViewLedgerForElectrician = (electricianId: string) => {
    setSelectedLedgerElectricianId(electricianId);
    setActiveModule('ledger_report');
  };

  // Find active profile for role-based view
  const currentElectrician = electricians.find(e => e.id === auth.userId || e.mobile === auth.userMobile) || electricians[0];
  const currentOrderMan = orderMen.find(o => o.id === auth.userId || o.mobile === auth.userMobile) || orderMen[0];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Navbar with dropdown navigation */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        auth={auth}
        setAuth={setAuth}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !auth.isAuthenticated ? (
          /* LOGIN SCREEN MANDATORY FIRST */
          <div className="py-10">
            <AuthModal
              isOpen={true}
              onClose={() => {}}
              auth={auth}
              setAuth={setAuth}
              electricians={electricians}
              orderMen={orderMen}
              companyProfile={companyProfile}
            />
          </div>
        ) : (
          <>
            {/* ROLE BASED VIEW SECURITY */}
            {auth.userRole === 'electrician' ? (
              <ElectricianPortal
                electrician={currentElectrician}
                transactions={transactions}
                claims={claims}
                settings={settings}
                onSubmitClaim={handleSubmitClaim}
                onUpdateClaim={handleUpdateClaim}
                onDeleteClaim={handleDeleteClaim}
              />
            ) : auth.userRole === 'orderman' ? (
              <OrderManProductView
                orderMan={currentOrderMan}
                products={products}
              />
            ) : (
              <>
                {/* ADMIN & DEVELOPER FULL ACCESS VIEWS */}
                {activeModule === 'dashboard' && (
                  <Dashboard
                    electricians={electricians}
                    products={products}
                    transactions={transactions}
                    onNavigate={setActiveModule}
                  />
                )}

                {/* MASTERS */}
                {activeModule === 'electricians' && (
                  <ElectricianCrud
                    electricians={electricians}
                    onAdd={handleAddElectrician}
                    onUpdate={handleUpdateElectrician}
                    onDelete={handleDeleteElectrician}
                    onViewLedger={handleViewLedgerForElectrician}
                  />
                )}

                {activeModule === 'ordermen' && (
                  <OrderManCrud
                    orderMen={orderMen}
                    onAdd={handleAddOrderMan}
                    onUpdate={handleUpdateOrderMan}
                    onDelete={handleDeleteOrderMan}
                  />
                )}

                {activeModule === 'products' && (
                  <ProductCrud
                    products={products}
                    onAdd={handleAddProduct}
                    onUpdate={handleUpdateProduct}
                    onDelete={handleDeleteProduct}
                    onBulkAdd={handleBulkAddProducts}
                  />
                )}

                {/* ENTRIES */}
                {activeModule === 'claims_approval' && (
                  <ElectricianClaimsApproval
                    electricians={electricians}
                    claims={claims}
                    settings={settings}
                    onUpdateClaimStatus={handleUpdateClaimStatus}
                    onSubmitClaim={handleSubmitClaim}
                  />
                )}

                {activeModule === 'bill_entry' && (
                  <BillEntryModule
                    electricians={electricians}
                    products={products}
                    settings={settings}
                    onAddTransaction={handleAddTransaction}
                  />
                )}

                {activeModule === 'redemption_entry' && (
                  <PointsRedemption
                    electricians={electricians}
                    redemptions={redemptions}
                    onAddTransaction={handleAddTransaction}
                    onRequestRedemption={handleRequestRedemption}
                    onUpdateRedemptionStatus={handleUpdateRedemptionStatus}
                  />
                )}

                {/* REPORTS */}
                {activeModule === 'ledger_report' && (
                  <PointsLedgerReport
                    electricians={electricians}
                    transactions={transactions}
                    selectedElectricianId={selectedLedgerElectricianId}
                  />
                )}

                {/* SETTINGS */}
                {activeModule === 'company_profile' && (
                  <CompanyProfileSettings
                    companyProfile={companyProfile}
                    onSaveProfile={handleSaveCompanyProfile}
                  />
                )}

                {activeModule === 'app_settings' && (
                  <SettingsModule
                    settings={settings}
                    setSettings={setSettings}
                    auth={auth}
                    setAuth={setAuth}
                    companyProfile={companyProfile}
                    onSaveCompanyProfile={handleSaveCompanyProfile}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <strong>JBS Electro Enterprise ERP Portal</strong> • Role-based Access System
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <a
              href="https://github.com/vigneshbharthi/ELECTRO"
              target="_blank"
              rel="noreferrer"
              className="text-teal-400 hover:underline font-medium"
            >
              GitHub Repository
            </a>
            <span>•</span>
            <span className="text-slate-400">Supabase Connected</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal when requested manually */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          auth={auth}
          setAuth={setAuth}
          electricians={electricians}
          orderMen={orderMen}
          companyProfile={companyProfile}
        />
      )}
    </div>
  );
}

export default App;
