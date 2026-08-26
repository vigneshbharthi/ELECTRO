import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ElectricianCrud } from './components/ElectricianCrud';
import { OrderManCrud } from './components/OrderManCrud';
import { ProductCrud } from './components/ProductCrud';
import { CustomerCrud } from './components/CustomerCrud';
import { BillEntryModule } from './components/BillEntryModule';
import { PointsRedemption } from './components/PointsRedemption';
import { ElectricianClaimsApproval } from './components/ElectricianClaimsApproval';
import { PointsLedgerReport } from './components/PointsLedgerReport';
import { SettingsModule } from './components/SettingsModule';
import { CompanyProfileSettings } from './components/CompanyProfileSettings';
import { ElectricianPortal } from './components/ElectricianPortal';
import { OrderManProductView } from './components/OrderManProductView';
import { OrderBookModule } from './components/OrderBookModule';
import { OrderBookReport } from './components/OrderBookReport';
import { AuthModal } from './components/AuthModal';
import { dataService } from './services/dataService';
import { APP_NAME as ENV_APP_NAME } from './lib/appConfig';
import { Electrician, OrderMan, Product, Customer, PointTransaction, Redemption, ElectricianClaim, UserAuth, AppSettings, CompanyProfile, Order, OrderItem } from './types';

export function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

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

  // App Settings & Company Profile
  const getInitialSettings = (): AppSettings => {
    const defaults: AppSettings = { pointsPercent: 1, minBillAmount: 100, appName: ENV_APP_NAME };
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
        const minBillAmount = (typeof parsed.minBillAmount === 'number' && !Number.isNaN(parsed.minBillAmount) && parsed.minBillAmount >= 0) ? parsed.minBillAmount : defaults.minBillAmount;
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
  }, [settings, auth.userRole]);

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

  // Keep document title in sync with Settings company name (so JBS Electro vs ELECTRO reflects per-deployment Settings)
  useEffect(() => {
    const name = companyProfile?.companyName?.trim() || ENV_APP_NAME;
    document.title = `${name} - Electrician & Points Ledger Portal`;
  }, [companyProfile?.companyName]);

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [claims, setClaims] = useState<ElectricianClaim[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedLedgerElectricianId, setSelectedLedgerElectricianId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [elecs, oms, prods, custs, txs, reds, clms, ords] = await Promise.all([
        dataService.getElectricians(),
        dataService.getOrderMen(),
        dataService.getProducts(),
        dataService.getCustomers(),
        dataService.getTransactions(),
        dataService.getRedemptions(),
        dataService.getClaims(),
        dataService.getOrders()
      ]);
      setElectricians(elecs);
      setOrderMen(oms);
      setProducts(prods);
      setCustomers(custs);
      setTransactions(txs);
      setRedemptions(reds);
      setClaims(clms);
      setOrders(ords);
    } catch (e) {
      console.error('Data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const [elecs, oms, prods, custs, txs, reds, clms, ords] = await Promise.all([
          dataService.getElectricians(),
          dataService.getOrderMen(),
          dataService.getProducts(),
          dataService.getCustomers(),
          dataService.getTransactions(),
          dataService.getRedemptions(),
          dataService.getClaims(),
          dataService.getOrders()
        ]);
        if (!mounted) return;
        setElectricians(elecs);
        setOrderMen(oms);
        setProducts(prods);
        setCustomers(custs);
        setTransactions(txs);
        setRedemptions(reds);
        setClaims(clms);
        setOrders(ords);
      } catch (e) {
        console.error('Data load error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    dataService.saveCompanyProfile(profile);
  };

  // ELECTRICIANS HANDLERS
  const handleAddElectrician = async (data: Omit<Electrician, 'id' | 'points_balance' | 'status' | 'created_at' | 'updated_at'>) => {
    try { await dataService.addElectrician(data); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to add electrician.'); }
  };

  const handleUpdateElectrician = async (id: string, updates: Partial<Electrician>) => {
    try { await dataService.updateElectrician(id, updates); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to update electrician.'); }
  };

  const handleGetElectricianRelatedCounts = (id: string) => ({
    claims: claims.filter(c => c.electrician_id === id).length,
    transactions: transactions.filter(t => t.electrician_id === id).length,
    redemptions: redemptions.filter(r => r.electrician_id === id).length
  });

  const handleDeleteElectrician = async (id: string, clearRecords?: boolean) => {
    try { await dataService.deleteElectrician(id, clearRecords); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to delete electrician.'); }
  };

  // ORDER MAN HANDLERS
  const handleAddOrderMan = async (data: Omit<OrderMan, 'id' | 'created_at' | 'updated_at'>) => {
    try { await dataService.addOrderMan(data); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to add order man.'); }
  };

  const handleUpdateOrderMan = async (id: string, updates: Partial<OrderMan>) => {
    try { await dataService.updateOrderMan(id, updates); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to update order man.'); }
  };

  const handleDeleteOrderMan = async (id: string) => {
    try { await dataService.deleteOrderMan(id); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to delete order man.'); }
  };

  // ORDERS HANDLERS
  const handleAddOrder = async (order: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>) => {
    try { await dataService.addOrder(order); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to add order.'); throw e; }
  };

  const handleUpdateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      await dataService.updateOrder(id, updates);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update order.');
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: 'pending' | 'billed', remarks?: string) => {
    try {
      await dataService.updateOrderStatus(id, status, remarks);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Failed to update order status.');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try { await dataService.deleteOrder(id); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to delete order.'); }
  };

  // PRODUCTS HANDLERS
  const handleAddProduct = async (data: Omit<Product, 'id' | 'updated_at' | 'created_at'>) => {
    try { await dataService.addProduct(data); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to add product.'); }
  };

  const handleBulkAddProducts = async (productsList: Omit<Product, 'id' | 'updated_at' | 'created_at'>[]) => {
    try { await dataService.addBulkProducts(productsList); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to import products.'); }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try { await dataService.updateProduct(id, updates); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to update product.'); }
  };

  const handleDeleteProduct = async (id: string) => {
    try { await dataService.deleteProduct(id); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to delete product.'); }
  };

  const handleBulkDeleteProducts = async (ids: string[]) => {
    try { await dataService.deleteProducts(ids); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to delete products.'); }
  };

  // CUSTOMERS HANDLERS
  const handleAddCustomer = async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> => {
    try { const created = await dataService.addCustomer(data); await loadData(); return created; } catch (e: any) { alert(e?.message || 'Failed to add customer.'); throw e; }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try { await dataService.updateCustomer(id, updates); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to update customer.'); }
  };

  const handleDeleteCustomer = async (id: string) => {
    try { await dataService.deleteCustomer(id); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to delete customer.'); }
  };

  // TRANSACTIONS & CLAIMS HANDLERS
  const handleAddTransaction = async (tx: Omit<PointTransaction, 'id' | 'created_at'>) => {
    try { await dataService.addTransaction(tx); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to add transaction.'); }
  };

  const handleRequestRedemption = async (redemption: Omit<Redemption, 'id' | 'status' | 'requested_date'>) => {
    try { await dataService.requestRedemption(redemption); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to request redemption.'); }
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
    try { await dataService.submitClaim(claim); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to submit claim.'); throw e; }
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
    try { await dataService.deleteClaim(id); await loadData(); } catch (e: any) { alert(e?.message || 'Failed to delete claim.'); }
  };

  const handleViewLedgerForElectrician = (electricianId: string) => {
    setSelectedLedgerElectricianId(electricianId);
    setActiveModule('ledger_report');
  };

  // Find active profile for role-based view — id match takes priority, mobile as fallback
  const currentElectrician = electricians.find(e => e.id === auth.userId) || electricians.find(e => e.mobile === auth.userMobile);
  const currentOrderMan = orderMen.find(o => o.id === auth.userId) || orderMen.find(o => o.mobile === auth.userMobile);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Navbar with dropdown navigation */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        auth={auth}
        setAuth={setAuth}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        companyProfile={companyProfile}
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
              currentElectrician ? (
                <ElectricianPortal
                  electrician={currentElectrician}
                  transactions={transactions}
                  claims={claims}
                  settings={settings}
                  onSubmitClaim={handleSubmitClaim}
                  onUpdateClaim={handleUpdateClaim}
                  onDeleteClaim={handleDeleteClaim}
                />
              ) : (
                <div className="glass-panel p-8 rounded-2xl text-center">
                  <p className="text-sm text-rose-400 font-bold">Your profile could not be loaded. Please contact the admin.</p>
                </div>
              )
            ) : auth.userRole === 'orderman' ? (
              currentOrderMan ? (
                <>
                  {activeModule === 'dashboard' ? (
                    <Dashboard
                      electricians={[]}
                      products={products}
                      transactions={[]}
                      onNavigate={setActiveModule}
                    />
                  ) : activeModule === 'order_catalog' ? (
                    <OrderManProductView
                      orderMan={currentOrderMan}
                      products={products}
                    />
                  ) : (
                    <OrderBookModule
                      orderMan={currentOrderMan}
                      products={products}
                      customers={customers}
                      orders={orders}
                      settings={settings}
                      onAddOrder={handleAddOrder}
                      onUpdateOrder={handleUpdateOrder}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onDeleteOrder={handleDeleteOrder}
                      onAddCustomer={handleAddCustomer}
                    />
                  )}
                </>
              ) : (
                <div className="glass-panel p-8 rounded-2xl text-center">
                  <p className="text-sm text-rose-400 font-bold">Your profile could not be loaded. Please contact the admin.</p>
                </div>
              )
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
                    onGetRelatedCounts={handleGetElectricianRelatedCounts}
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
                    onBulkDelete={handleBulkDeleteProducts}
                    onBulkAdd={handleBulkAddProducts}
                  />
                )}

                {activeModule === 'customers' && (
                  <CustomerCrud
                    customers={customers}
                    onAdd={handleAddCustomer}
                    onUpdate={handleUpdateCustomer}
                    onDelete={handleDeleteCustomer}
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
                    onUpdateClaim={handleUpdateClaim}
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

                {/* ORDER BOOK REPORT */}
                {activeModule === 'order_book_report' && (
                  <OrderBookReport
                    orders={orders}
                    orderMen={orderMen}
                    products={products}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onUpdateOrder={handleUpdateOrder}
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
        <div className="max-w-7xl mx-auto px-4">
          Developed by VIVEKAINFO @ 2026
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
