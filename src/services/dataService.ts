import { supabase } from '../lib/supabase';
import { Electrician, OrderMan, Product, PointTransaction, Redemption } from '../types';

// Clean empty initial data arrays for fresh production setup
const initialElectricians: Electrician[] = [];
const initialOrderMen: OrderMan[] = [];
const initialProducts: Product[] = [];
const initialTransactions: PointTransaction[] = [];
const initialRedemptions: Redemption[] = [];
const initialClaims: any[] = [];

// Helper functions for LocalStorage
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(`electro_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`electro_${key}`, JSON.stringify(value));
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

  async addElectrician(electrician: Omit<Electrician, 'id' | 'points_balance' | 'created_at' | 'updated_at'>): Promise<Electrician> {
    const newElectrician: Electrician = {
      ...electrician,
      id: crypto.randomUUID ? crypto.randomUUID() : `elec-${Date.now()}`,
      points_balance: 0,
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

  async deleteElectrician(id: string): Promise<boolean> {
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
    // Only pending claims may be edited - guard against tampering with already-reviewed claims
    const existing = (await this.getClaims()).find(c => c.id === id);
    if (existing && existing.status !== 'pending') {
      throw new Error(`Cannot edit a claim that is already ${existing.status}.`);
    }
    // Never allow status mutation through this generic update path (use updateClaimStatus)
    const safeUpdates = { ...updates };
    delete safeUpdates.status;
    delete safeUpdates.processed_date;
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
      companyName: 'ELECTRO Electricals & Enterprise',
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
          appName: data.app_name || 'ELECTRO'
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
  }
};


