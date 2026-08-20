import { supabase } from '../lib/supabase';
import { Electrician, OrderMan, Product, PointTransaction, Redemption, Order, OrderItem, Customer } from '../types';

// Clean empty initial data arrays for fresh production setup
const initialElectricians: Electrician[] = [];
const initialOrderMen: OrderMan[] = [];
const initialProducts: Product[] = [];
const initialCustomers: Customer[] = [];
const initialTransactions: PointTransaction[] = [];
const initialRedemptions: Redemption[] = [];
const initialClaims: any[] = [];
const initialOrders: Order[] = [];

// Helper functions for LocalStorage
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(`jbs_electro_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`jbs_electro_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

// ELECTRICIAN CRUD SERVICES
export const dataService = {
  // ELECTRICIANS
  async getElectricians(): Promise<Electrician[]> {
    let supabaseElecs: Electrician[] = [];
    try {
      const { data, error } = await supabase.from('electricians').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        supabaseElecs = data as Electrician[];
      }
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local:', e);
    }

    const localElecs = getLocal<Electrician[]>('electricians', initialElectricians);
    const map = new Map<string, Electrician>();
    [...supabaseElecs, ...localElecs].forEach(item => {
      if (item && (item.id || item.mobile)) {
        const key = item.mobile || item.id;
        if (!map.has(key)) {
          map.set(key, item);
        }
      }
    });

    const merged = Array.from(map.values());
    setLocal('electricians', merged);
    return merged;
  },

  async addElectrician(electrician: Omit<Electrician, 'id' | 'points_balance' | 'status' | 'created_at' | 'updated_at'>): Promise<Electrician> {
    const newElectrician: Electrician = {
      ...electrician,
      id: crypto.randomUUID ? crypto.randomUUID() : `elec-${Date.now()}`,
      points_balance: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('electricians').insert([newElectrician]).select().single();
      if (!error && data) {
        const current = getLocal('electricians', initialElectricians);
        setLocal('electricians', [data, ...current]);
        return data as Electrician;
      }
    } catch (e) {
      console.warn('Supabase insert failed, using local storage:', e);
    }

    const current = getLocal('electricians', initialElectricians);
    const updated = [newElectrician, ...current];
    setLocal('electricians', updated);
    return newElectrician;
  },

  async updateElectrician(id: string, updates: Partial<Electrician>): Promise<Electrician | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('electricians').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Electrician[]>('electricians', initialElectricians);
        const list = current.map(item => item.id === id ? { ...item, ...data } : item);
        setLocal('electricians', list);
        return data as Electrician;
      }
    } catch (e) {
      console.warn('Supabase update failed, using local storage:', e);
    }

    const current = getLocal<Electrician[]>('electricians', initialElectricians);
    let updatedItem: Electrician | null = null;
    const list = current.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...updatedObj };
        return updatedItem;
      }
      return item;
    });
    setLocal('electricians', list);
    return updatedItem;
  },

  async deleteElectrician(id: string, clearRecords: boolean = false): Promise<boolean> {
    // When clearRecords is true, also remove the electrician's claims, transactions and redemptions.
    // Otherwise those orphaned records remain (audit trail preserved).
    if (clearRecords) {
      try {
        await supabase.from('electrician_claims').delete().eq('electrician_id', id);
        await supabase.from('point_transactions').delete().eq('electrician_id', id);
        await supabase.from('redemptions').delete().eq('electrician_id', id);
      } catch (e) {
        console.warn('Supabase cascade delete failed:', e);
      }
      const claimsLocal = getLocal<any[]>('claims', initialClaims);
      setLocal('claims', claimsLocal.filter(c => c.electrician_id !== id));
      const txLocal = getLocal<PointTransaction[]>('transactions', initialTransactions);
      setLocal('transactions', txLocal.filter(t => t.electrician_id !== id));
      const redLocal = getLocal<Redemption[]>('redemptions', initialRedemptions);
      setLocal('redemptions', redLocal.filter(r => r.electrician_id !== id));
    }

    try {
      const { error } = await supabase.from('electricians').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Electrician[]>('electricians', initialElectricians);
        setLocal('electricians', current.filter(item => item.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }

    const current = getLocal<Electrician[]>('electricians', initialElectricians);
    setLocal('electricians', current.filter(item => item.id !== id));
    return true;
  },

  // PRODUCTS CRUD SERVICES
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        setLocal('products', data);
        return data as Product[];
      }
    } catch (e) {
      console.warn('Supabase fetch products failed, fallback to local:', e);
    }
    return getLocal('products', initialProducts);
  },

  async addProduct(product: Omit<Product, 'id' | 'updated_at' | 'created_at'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (!error && data) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', [data, ...current]);
        return data as Product;
      }
    } catch (e) {
      console.warn('Supabase product insert failed:', e);
    }

    const current = getLocal<Product[]>('products', initialProducts);
    setLocal('products', [newProduct, ...current]);
    return newProduct;
  },

  async addBulkProducts(productsList: Omit<Product, 'id' | 'updated_at' | 'created_at'>[]): Promise<Product[]> {
    const preparedList: Product[] = productsList.map(p => ({
      ...p,
      id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Math.random().toString(36).substring(2, 9)}`,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }));

    try {
      const { data, error } = await supabase.from('products').insert(preparedList).select();
      if (!error && data) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', [...data, ...current]);
        return data as Product[];
      }
    } catch (e) {
      console.warn('Supabase bulk product insert error:', e);
    }

    const current = getLocal<Product[]>('products', initialProducts);
    const updated = [...preparedList, ...current];
    setLocal('products', updated);
    return preparedList;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('products').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', current.map(p => p.id === id ? (data as Product) : p));
        return data as Product;
      }
    } catch (e) {
      console.warn('Supabase product update failed:', e);
    }

    const current = getLocal<Product[]>('products', initialProducts);
    let result: Product | null = null;
    const list = current.map(p => {
      if (p.id === id) {
        result = { ...p, ...updatedObj };
        return result;
      }
      return p;
    });
    setLocal('products', list);
    return result;
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', current.filter(p => p.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Supabase product delete failed:', e);
    }

    const current = getLocal<Product[]>('products', initialProducts);
    setLocal('products', current.filter(p => p.id !== id));
    return true;
  },

  async deleteProducts(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return false;
    try {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (!error) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', current.filter(p => !ids.includes(p.id)));
        return true;
      }
    } catch (e) {
      console.warn('Supabase bulk product delete failed:', e);
    }

    const current = getLocal<Product[]>('products', initialProducts);
    setLocal('products', current.filter(p => !ids.includes(p.id)));
    return true;
  },

  // CUSTOMERS CRUD SERVICES
  async getCustomers(): Promise<Customer[]> {
    let supabaseCustomers: Customer[] = [];
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        supabaseCustomers = data as Customer[];
      }
    } catch (e) {
      console.warn('Supabase fetch customers failed, fallback to local:', e);
    }

    const localCustomers = getLocal<Customer[]>('customers', initialCustomers);
    const map = new Map<string, Customer>();
    [...supabaseCustomers, ...localCustomers].forEach(item => {
      if (item && item.id) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      }
    });

    const merged = Array.from(map.values());
    setLocal('customers', merged);
    return merged;
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID ? crypto.randomUUID() : `cust-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('customers').insert([newCustomer]).select().single();
      if (!error && data) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', [data, ...current]);
        return data as Customer;
      }
    } catch (e) {
      console.warn('Supabase customer insert failed:', e);
    }

    const current = getLocal<Customer[]>('customers', initialCustomers);
    setLocal('customers', [newCustomer, ...current]);
    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('customers').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', current.map(c => c.id === id ? (data as Customer) : c));
        return data as Customer;
      }
    } catch (e) {
      console.warn('Supabase customer update failed:', e);
    }

    const current = getLocal<Customer[]>('customers', initialCustomers);
    let result: Customer | null = null;
    const list = current.map(c => {
      if (c.id === id) {
        result = { ...c, ...updatedObj };
        return result;
      }
      return c;
    });
    setLocal('customers', list);
    return result;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', current.filter(c => c.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Supabase customer delete failed:', e);
    }

    const current = getLocal<Customer[]>('customers', initialCustomers);
    setLocal('customers', current.filter(c => c.id !== id));
    return true;
  },

  async deleteCustomers(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return false;
    try {
      const { error } = await supabase.from('customers').delete().in('id', ids);
      if (!error) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', current.filter(c => !ids.includes(c.id)));
        return true;
      }
    } catch (e) {
      console.warn('Supabase bulk customer delete failed:', e);
    }

    const current = getLocal<Customer[]>('customers', initialCustomers);
    setLocal('customers', current.filter(c => !ids.includes(c.id)));
    return true;
  },

  // POINT TRANSACTIONS / LEDGER SERVICES
  async getTransactions(): Promise<PointTransaction[]> {
    try {
      const { data, error } = await supabase.from('point_transactions').select('*').order('date', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocal('transactions', data);
        return data as PointTransaction[];
      }
    } catch (e) {
      console.warn('Supabase get transactions failed:', e);
    }
    return getLocal('transactions', initialTransactions);
  },

  async addTransaction(tx: Omit<PointTransaction, 'id' | 'created_at'>): Promise<PointTransaction> {
    const newTx: PointTransaction = {
      ...tx,
      id: crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    // Update electrician balance (no floor - keep ledger & balance in sync honestly)
    const electricians = await this.getElectricians();
    const electrician = electricians.find(e => e.id === tx.electrician_id);
    if (electrician) {
      const pointDiff = (tx.credit_points || 0) - (tx.debit_points || 0);
      const newBalance = electrician.points_balance + pointDiff;
      await this.updateElectrician(electrician.id, { points_balance: newBalance });
      newTx.electrician_name = electrician.name;
    }

    try {
      const { data, error } = await supabase.from('point_transactions').insert([newTx]).select().single();
      if (!error && data) {
        const current = getLocal<PointTransaction[]>('transactions', initialTransactions);
        setLocal('transactions', [data, ...current]);
        return data as PointTransaction;
      }
    } catch (e) {
      console.warn('Supabase insert transaction error:', e);
    }

    const current = getLocal<PointTransaction[]>('transactions', initialTransactions);
    setLocal('transactions', [newTx, ...current]);
    return newTx;
  },

  // REDEMPTIONS SERVICES
  async getRedemptions(): Promise<Redemption[]> {
    try {
      const { data, error } = await supabase.from('redemptions').select('*').order('requested_date', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocal('redemptions', data);
        return data as Redemption[];
      }
    } catch (e) {
      console.warn('Supabase get redemptions error:', e);
    }
    return getLocal('redemptions', initialRedemptions);
  },

  async requestRedemption(redemption: Omit<Redemption, 'id' | 'status' | 'requested_date'>): Promise<Redemption> {
    const newRedemption: Redemption = {
      ...redemption,
      id: crypto.randomUUID ? crypto.randomUUID() : `red-${Date.now()}`,
      status: 'pending',
      requested_date: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('redemptions').insert([newRedemption]).select().single();
      if (!error && data) {
        const current = getLocal<Redemption[]>('redemptions', initialRedemptions);
        setLocal('redemptions', [data, ...current]);
        return data as Redemption;
      }
    } catch (e) {
      console.warn('Supabase redemption request error:', e);
    }

    const current = getLocal<Redemption[]>('redemptions', initialRedemptions);
    setLocal('redemptions', [newRedemption, ...current]);
    return newRedemption;
  },

  async updateRedemptionStatus(id: string, status: 'approved' | 'rejected', remarks?: string): Promise<Redemption | null> {
    const redemptions = await this.getRedemptions();
    const red = redemptions.find(r => r.id === id);

    if (red && red.status === 'pending' && status === 'approved') {
      // Prevent approving redemption that exceeds electrician's current balance
      const electricians = await this.getElectricians();
      const elec = electricians.find(e => e.id === red.electrician_id);
      if (!elec) {
        throw new Error('Linked electrician not found for this redemption.');
      }
      if (elec.points_balance < red.points) {
        throw new Error(`Insufficient balance. ${elec.name} has only ${elec.points_balance} points, but redemption requests ${red.points} points.`);
      }
      // Create ledger debit transaction (this also debits the balance)
      await this.addTransaction({
        electrician_id: red.electrician_id,
        electrician_name: red.electrician_name,
        date: new Date().toISOString(),
        particular: `Redemption Approved: ${red.gift_name}`,
        debit_points: red.points,
        credit_points: 0
      });
    }

    const updateData = {
      status,
      remarks,
      processed_date: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('redemptions').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Redemption[]>('redemptions', initialRedemptions);
        setLocal('redemptions', current.map(r => r.id === id ? (data as Redemption) : r));
        return data as Redemption;
      }
    } catch (e) {
      console.warn('Supabase update redemption error:', e);
    }

    const current = getLocal<Redemption[]>('redemptions', initialRedemptions);
    let result: Redemption | null = null;
    const updated = current.map(r => {
      if (r.id === id) {
        result = { ...r, ...updateData };
        return result;
      }
      return r;
    });
    setLocal('redemptions', updated);
    return result;
  },

  // ELECTRICIAN POINT CLAIMS APPROVAL SERVICES
  async getClaims(): Promise<any[]> {
    let supabaseClaims: any[] = [];
    try {
      const { data, error } = await supabase.from('electrician_claims').select('*').order('submitted_date', { ascending: false });
      if (!error && data) {
        supabaseClaims = data;
      }
    } catch (e) {
      console.warn('Supabase get claims error:', e);
    }

    const localClaims = getLocal('claims', initialClaims);
    const map = new Map();
    [...supabaseClaims, ...localClaims].forEach(item => {
      if (item && (item.id || item.bill_no)) {
        const key = item.id || item.bill_no;
        if (!map.has(key)) {
          map.set(key, item);
        }
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => new Date(b.submitted_date || 0).getTime() - new Date(a.submitted_date || 0).getTime());
    setLocal('claims', merged);
    return merged;
  },

  async submitClaim(claim: Omit<any, 'id' | 'status' | 'submitted_date'>): Promise<any> {
    const newClaim = {
      ...claim,
      id: crypto.randomUUID ? crypto.randomUUID() : `claim-${Date.now()}`,
      status: 'pending',
      submitted_date: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('electrician_claims').insert([newClaim]).select().single();
      if (!error && data) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', [data, ...current]);
        return data;
      }
    } catch (e) {
      console.warn('Supabase submit claim error:', e);
    }

    const current = getLocal('claims', initialClaims);
    setLocal('claims', [newClaim, ...current]);
    return newClaim;
  },

  async updateClaimStatus(id: string, status: 'approved' | 'rejected', remarks?: string): Promise<any> {
    const claims = await this.getClaims();
    const claim = claims.find(c => c.id === id);

    if (claim && claim.status === 'pending' && status === 'approved') {
      // Auto credit points and post to ledger!
      await this.addTransaction({
        electrician_id: claim.electrician_id,
        electrician_name: claim.electrician_name,
        date: new Date().toISOString(),
        particular: `Claim Approved: Bill #${claim.bill_no} (₹${claim.bill_amount.toLocaleString('en-IN')})`,
        debit_points: 0,
        credit_points: claim.claimed_points
      });
    }

    const updateData = {
      status,
      remarks,
      processed_date: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('electrician_claims').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', current.map(c => c.id === id ? data : c));
        return data;
      }
    } catch (e) {
      console.warn('Supabase update claim error:', e);
    }

    const current = getLocal('claims', initialClaims);
    let result = null;
    const updated = current.map(c => {
      if (c.id === id) {
        result = { ...c, ...updateData };
        return result;
      }
      return c;
    });
    setLocal('claims', updated);
    return result;
  },

  async updateClaim(id: string, updates: Partial<any>): Promise<any> {
    // Never allow status mutation through this generic update path (use updateClaimStatus)
    const safeUpdates = { ...updates };
    delete safeUpdates.status;
    delete safeUpdates.processed_date;

    // If this is an already-approved claim and admin edits bill_amount / claimed_points,
    // we must keep the points ledger and the electrician's points_balance in sync.
    const claims = await this.getClaims();
    const existingClaim = claims.find(c => c.id === id);
    const amountChanged = existingClaim && existingClaim.status === 'approved'
      && (safeUpdates.bill_amount !== undefined && Number(safeUpdates.bill_amount) !== Number(existingClaim.bill_amount));

    if (amountChanged && existingClaim) {
      const newBillAmount = Number(safeUpdates.bill_amount);
      const settings = await this.getAppSettings();
      const percent = (settings?.pointsPercent && !Number.isNaN(settings.pointsPercent)) ? settings.pointsPercent : 1;
      const newClaimedPoints = Math.floor(newBillAmount * (percent / 100));
      const oldClaimedPoints = Number(existingClaim.claimed_points) || 0;
      const pointDiff = newClaimedPoints - oldClaimedPoints;

      safeUpdates.bill_amount = newBillAmount;
      safeUpdates.claimed_points = newClaimedPoints;

      // Find the original ledger transaction for this claim
      const transactions = await this.getTransactions();
      const originalTx = transactions.find(t =>
        t.electrician_id === existingClaim.electrician_id &&
        (t.particular || '').includes(`Bill #${existingClaim.bill_no}`)
      );

      if (pointDiff !== 0 && originalTx) {
        // Post an adjustment transaction (debit the over-credited, or credit the under-credited)
        const adjustment: Omit<PointTransaction, 'id' | 'created_at'> = {
          electrician_id: existingClaim.electrician_id,
          electrician_name: existingClaim.electrician_name,
          date: new Date().toISOString(),
          particular: pointDiff > 0
            ? `Bill Amount Revised: Bill #${existingClaim.bill_no} (₹${existingClaim.bill_amount.toLocaleString('en-IN')} → ₹${newBillAmount.toLocaleString('en-IN')})`
            : `Bill Amount Revised: Bill #${existingClaim.bill_no} (₹${existingClaim.bill_amount.toLocaleString('en-IN')} → ₹${newBillAmount.toLocaleString('en-IN')})`,
          debit_points: pointDiff < 0 ? Math.abs(pointDiff) : 0,
          credit_points: pointDiff > 0 ? pointDiff : 0
        };
        await this.addTransaction(adjustment);
      } else if (pointDiff !== 0 && !originalTx) {
        // No original tx found (rare) - just credit/debit fresh
        await this.addTransaction({
          electrician_id: existingClaim.electrician_id,
          electrician_name: existingClaim.electrician_name,
          date: new Date().toISOString(),
          particular: `Bill Amount Revised: Bill #${existingClaim.bill_no}`,
          debit_points: pointDiff < 0 ? Math.abs(pointDiff) : 0,
          credit_points: pointDiff > 0 ? pointDiff : 0
        });
      }
    }
    try {
      const { data, error } = await supabase.from('electrician_claims').update(safeUpdates).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', current.map(c => c.id === id ? data : c));
        return data;
      }
    } catch (e) {
      console.warn('Supabase update claim error:', e);
    }

    const current = getLocal('claims', initialClaims);
    let result = null;
    const updated = current.map(c => {
      if (c.id === id) {
        result = { ...c, ...safeUpdates };
        return result;
      }
      return c;
    });
    setLocal('claims', updated);
    return result;
  },

  async deleteClaim(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('electrician_claims').delete().eq('id', id);
      if (!error) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', current.filter(c => c.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Supabase delete claim error:', e);
    }

    const current = getLocal('claims', initialClaims);
    setLocal('claims', current.filter(c => c.id !== id));
    return true;
  },

  // COMPANY PROFILE & CREDENTIALS SERVICE
  getCompanyProfile(): any {
    const defaultProfile = {
      companyName: 'JBS Electro',
      gstin: '33AAAAA0000A1Z5',
      phone: '+91 9876543210',
      email: 'support@electro.in',
      address: '88 Main Bazaar, RS Puram, Coimbatore, TN - 641002',
      adminUsername: 'admin@electro.in',
      adminPassword: 'admin123',
      devUsername: 'dev@electro.in',
      devPassword: 'dev123'
    };
    return getLocal('company_profile', defaultProfile);
  },

  saveCompanyProfile(profile: any): void {
    setLocal('company_profile', profile);
  },

  // GLOBAL APPLICATION SETTINGS (cross-device sync via Supabase)
  async getAppSettings(): Promise<{ pointsPercent: number; minBillAmount: number; appName: string } | null> {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
      if (!error && data) {
        return {
          pointsPercent: Number(data.points_percent) || 1,
          minBillAmount: Number(data.min_bill_amount) || 100,
          appName: data.app_name || 'JBS Electro'
        };
      }
    } catch (e) {
      console.warn('Supabase get app_settings error:', e);
    }
    return null;
  },

  async saveAppSettings(settings: { pointsPercent: number; minBillAmount: number; appName: string }): Promise<void> {
    try {
      await supabase.from('app_settings').upsert({
        id: 1,
        points_percent: settings.pointsPercent,
        min_bill_amount: settings.minBillAmount,
        app_name: settings.appName,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save app_settings error:', e);
    }
  },

  // ORDER MAN CRUD SERVICES
  async getOrderMen(): Promise<OrderMan[]> {
    let supabaseOMs: OrderMan[] = [];
    try {
      const { data, error } = await supabase.from('order_men').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        supabaseOMs = data as OrderMan[];
      }
    } catch (e) {
      console.warn('Supabase get order men error:', e);
    }

    const localOMs = getLocal<OrderMan[]>('order_men', initialOrderMen);
    const map = new Map<string, OrderMan>();
    [...supabaseOMs, ...localOMs].forEach(item => {
      if (item && (item.id || item.mobile)) {
        const key = item.mobile || item.id;
        if (!map.has(key)) {
          map.set(key, item);
        }
      }
    });

    const merged = Array.from(map.values());
    setLocal('order_men', merged);
    return merged;
  },

  async addOrderMan(om: Omit<OrderMan, 'id' | 'created_at' | 'updated_at'>): Promise<OrderMan> {
    const newOM: OrderMan = {
      ...om,
      id: crypto.randomUUID ? crypto.randomUUID() : `om-${Date.now()}`,
      status: om.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('order_men').insert([newOM]).select().single();
      if (!error && data) {
        const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
        setLocal('order_men', [data, ...current]);
        return data as OrderMan;
      }
    } catch (e) {
      console.warn('Supabase order man insert error:', e);
    }

    const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
    setLocal('order_men', [newOM, ...current]);
    return newOM;
  },

  async updateOrderMan(id: string, updates: Partial<OrderMan>): Promise<OrderMan | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('order_men').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
        setLocal('order_men', current.map(om => om.id === id ? (data as OrderMan) : om));
        return data as OrderMan;
      }
    } catch (e) {
      console.warn('Supabase order man update error:', e);
    }

    const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
    let result: OrderMan | null = null;
    const updated = current.map(om => {
      if (om.id === id) {
        result = { ...om, ...updatedObj };
        return result;
      }
      return om;
    });
    setLocal('order_men', updated);
    return result;
  },

  async deleteOrderMan(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('order_men').delete().eq('id', id);
      if (!error) {
        const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
        setLocal('order_men', current.filter(om => om.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Supabase order man delete error:', e);
    }

    const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
    setLocal('order_men', current.filter(om => om.id !== id));
    return true;
  },

  // ORDERS / ORDER BOOK SERVICES
  async getOrders(orderManId?: string): Promise<Order[]> {
    let supabaseOrders: Order[] = [];
    try {
      const { data, error } = await supabase.from('orders').select('*').order('order_date', { ascending: false });
      if (!error && data) {
        supabaseOrders = data as Order[];
      }
    } catch (e) {
      console.warn('Supabase get orders error, fallback to local:', e);
    }

    const localOrders = getLocal<Order[]>('orders', initialOrders);
    const map = new Map<string, Order>();
    [...supabaseOrders, ...localOrders].forEach(item => {
      if (item && item.id) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      }
    });

    const merged = Array.from(map.values());
    setLocal('orders', merged);
    if (orderManId) {
      return merged.filter(o => o.order_man_id === orderManId);
    }
    return merged;
  },

  async addOrder(order: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID ? crypto.randomUUID() : `ord-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
      order_no: `ORD-${Date.now()}-${(crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)).slice(0, 6)}`,
      status: order.status || 'pending',
      total_amount: order.total_amount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from('orders').insert([newOrder]).select().single();
      if (!error && data) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', [data, ...current]);
        return data as Order;
      }
    } catch (e) {
      console.warn('Supabase insert order error:', e);
    }
    const current = getLocal<Order[]>('orders', initialOrders);
    setLocal('orders', [newOrder, ...current]);
    return newOrder;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    // Only pending orders may be edited - guard like claims
    const existing = (await this.getOrders()).find(o => o.id === id);
    if (existing && existing.status !== 'pending') {
      throw new Error(`Cannot edit an order that is already ${existing.status}.`);
    }
    const safeUpdates = { ...updates };
    // Never allow status / identity mutation through this generic update path (use updateOrderStatus)
    delete (safeUpdates as any).status;
    delete (safeUpdates as any).order_no;
    delete (safeUpdates as any).order_man_id;
    delete (safeUpdates as any).billed_at;
    delete (safeUpdates as any).created_at;
    delete (safeUpdates as any).id;
    const updatedObj = { ...safeUpdates, updated_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from('orders').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', current.map(o => o.id === id ? (data as Order) : o));
        return data as Order;
      }
    } catch (e) {
      console.warn('Supabase update order error:', e);
    }
    const current = getLocal<Order[]>('orders', initialOrders);
    let result: Order | null = null;
    const list = current.map(o => {
      if (o.id === id) {
        result = { ...o, ...updatedObj } as Order;
        return result;
      }
      return o;
    });
    setLocal('orders', list);
    return result;
  },

  async updateOrderStatus(id: string, status: 'pending' | 'billed', remarks?: string): Promise<Order | null> {
    const existing = (await this.getOrders()).find(o => o.id === id);
    // Prevent downgrading an already-billed order back to pending
    if (existing && existing.status === 'billed' && status === 'pending') {
      throw new Error('An already-billed order cannot be changed back to pending.');
    }
    const updateData: Partial<Order> = { status, updated_at: new Date().toISOString() };
    if (status === 'billed') {
      // Preserve original billed_at timestamp
      (updateData as any).billed_at = existing?.billed_at || new Date().toISOString();
    }
    if (remarks !== undefined) (updateData as any).remarks = remarks;
    try {
      const { data, error } = await supabase.from('orders').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', current.map(o => o.id === id ? (data as Order) : o));
        return data as Order;
      }
    } catch (e) {
      console.warn('Supabase update order status error:', e);
    }
    const current = getLocal<Order[]>('orders', initialOrders);
    let result: Order | null = null;
    const list = current.map(o => {
      if (o.id === id) {
        result = { ...o, ...updateData } as Order;
        return result;
      }
      return o;
    });
    setLocal('orders', list);
    return result;
  },

  async deleteOrder(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', current.filter(o => o.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Supabase delete order error:', e);
    }
    const current = getLocal<Order[]>('orders', initialOrders);
    setLocal('orders', current.filter(o => o.id !== id));
    return true;
  },

  // ONE-TIME LOCAL -> SUPABASE MIGRATION (call from Settings page)
  // Pushes any local-only records to Supabase so other devices can see them.
  async syncLocalToCloud(): Promise<{ electricians: number; orderMen: number; products: number; customers: number; claims: number; transactions: number; redemptions: number; orders: number; errors: string[] }> {
    const result = { electricians: 0, orderMen: 0, products: 0, customers: 0, claims: 0, transactions: 0, redemptions: 0, orders: 0, errors: [] as string[] };

    const push = async (table: string, records: any[], matchKey: string) => {
      if (!records || records.length === 0) return;
      try {
        // Fetch existing keys from Supabase to avoid duplicate inserts
        const { data: existing } = await supabase.from(table).select(matchKey);
        const existingKeys = new Set((existing || []).map((r: any) => r[matchKey]));
        const toInsert = records.filter(r => r && r[matchKey] && !existingKeys.has(r[matchKey]));
        if (toInsert.length === 0) return;
        const { error } = await supabase.from(table).insert(toInsert);
        if (error) {
          result.errors.push(`${table}: ${error.message}`);
        } else {
          if (table === 'electricians') result.electricians += toInsert.length;
          if (table === 'order_men') result.orderMen += toInsert.length;
          if (table === 'products') result.products += toInsert.length;
          if (table === 'customers') result.customers += toInsert.length;
          if (table === 'electrician_claims') result.claims += toInsert.length;
          if (table === 'point_transactions') result.transactions += toInsert.length;
          if (table === 'redemptions') result.redemptions += toInsert.length;
          if (table === 'orders') result.orders += toInsert.length;
        }
      } catch (e: any) {
        result.errors.push(`${table}: ${e?.message || 'unknown error'}`);
      }
    };

    await push('electricians', getLocal<Electrician[]>('electricians', []), 'mobile');
    await push('order_men', getLocal<OrderMan[]>('order_men', []), 'mobile');
    await push('products', getLocal<Product[]>('products', []), 'id');
    await push('customers', getLocal<Customer[]>('customers', []), 'id');
    await push('electrician_claims', getLocal<any[]>('claims', []), 'id');
    await push('point_transactions', getLocal<PointTransaction[]>('transactions', []), 'id');
    await push('redemptions', getLocal<Redemption[]>('redemptions', []), 'id');
    await push('orders', getLocal<Order[]>('orders', []), 'id');

    return result;
  }
};


