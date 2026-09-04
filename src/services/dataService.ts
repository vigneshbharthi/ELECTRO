import { supabase } from '../lib/supabase';
import { APP_NAME } from '../lib/appConfig';
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

const genId = (prefix = ''): string => {
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return prefix ? `${prefix}-${uuid}` : uuid;
};

// ---------- ONLINE-FIRST OUTBOX (nothing stays local-only) ----------
// Every cloud write failure is enqueued here and retried automatically until
// it lands in Supabase. Local storage is only a read cache + queue backing.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const newUuid = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') return (crypto as any).randomUUID();
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const isUuid = (v: any): boolean => typeof v === 'string' && UUID_RE.test(v);

type OutboxTable = 'electricians' | 'order_men' | 'products' | 'customers' | 'electrician_claims' | 'point_transactions' | 'redemptions' | 'orders' | 'app_settings';
export interface OutboxOp {
  key: string;
  table: OutboxTable;
  op: 'insert' | 'update' | 'delete';
  id: string;
  record?: any;
  attempts: number;
  lastError?: string;
  createdAt: string;
}
const OUTBOX_KEY = 'jbs_electro_outbox';
const TABLE_LOCAL_KEY: Record<OutboxTable, string> = {
  electricians: 'electricians',
  order_men: 'order_men',
  products: 'products',
  customers: 'customers',
  electrician_claims: 'claims',
  point_transactions: 'transactions',
  redemptions: 'redemptions',
  orders: 'orders',
  app_settings: 'app_settings'
};

const getOutbox = (): OutboxOp[] => {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const setOutbox = (ops: OutboxOp[]): void => {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(ops));
  } catch (e) {
    console.error('Outbox write error:', e);
  }
};
const enqueueOp = (table: OutboxTable, op: 'insert' | 'update' | 'delete', id: string, record?: any): void => {
  if (!id) return;
  const key = `${table}:${op}:${id}`;
  const ops = getOutbox();
  const now = new Date().toISOString();
  const existing = ops.find(o => o.key === key);
  if (existing) {
    existing.record = record !== undefined ? record : existing.record;
    existing.attempts = 0;
    setOutbox(ops);
    return;
  }
  ops.push({ key, table, op, id, record, attempts: 0, createdAt: now });
  setOutbox(ops);
};
const removeOp = (key: string): void => {
  setOutbox(getOutbox().filter(o => o.key !== key));
};
// Fail-loud: called when a cloud write fails. Queues the op for auto-retry and throws.
const cloudFailed = (table: OutboxTable, op: 'insert' | 'update' | 'delete', id: string, record: any, label: string, detail?: string): never => {
  enqueueOp(table, op, id, record);
  throw new Error(`${label} could not be saved online — queued, will sync automatically. (${detail || 'network/cloud error'})`);
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
      id: newUuid(),
      points_balance: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('electricians').insert([newElectrician]).select().single();
      if (!error && data) {
        const current = getLocal('electricians', initialElectricians);
        setLocal('electricians', [data, ...current]);
        return data as Electrician;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    // Cloud failed: keep a local cache copy AND queue for auto-retry, then fail loud.
    const current = getLocal('electricians', initialElectricians);
    const updated = [newElectrician, ...current];
    setLocal('electricians', updated);
    return cloudFailed('electricians', 'insert', newElectrician.id, newElectrician, 'Electrician', cloudError);
  },

  async updateElectrician(id: string, updates: Partial<Electrician>): Promise<Electrician | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('electricians').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Electrician[]>('electricians', initialElectricians);
        const list = current.map(item => item.id === id ? { ...item, ...data } : item);
        setLocal('electricians', list);
        return data as Electrician;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!updatedItem) {
      throw new Error(`Electrician could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('electricians', 'update', id, updatedItem, 'Electrician update', cloudError);
  },

  async deleteElectrician(id: string, clearRecords: boolean = false): Promise<boolean> {
    // When clearRecords is true, also remove the electrician's claims, transactions and redemptions.
    // Otherwise those orphaned records remain (audit trail preserved).
    if (clearRecords) {
      const claimsLocal = getLocal<any[]>('claims', initialClaims);
      const txLocal = getLocal<PointTransaction[]>('transactions', initialTransactions);
      const redLocal = getLocal<Redemption[]>('redemptions', initialRedemptions);
      const childClaims = claimsLocal.filter(c => c.electrician_id === id);
      const childTx = txLocal.filter(t => t.electrician_id === id);
      const childRed = redLocal.filter(r => r.electrician_id === id);
      try {
        await supabase.from('electrician_claims').delete().eq('electrician_id', id);
        await supabase.from('point_transactions').delete().eq('electrician_id', id);
        await supabase.from('redemptions').delete().eq('electrician_id', id);
      } catch (e) {
        console.warn('Supabase cascade delete failed:', e);
      }
      // Queue every child-row delete so nothing stays online that should be gone
      childClaims.forEach(c => c?.id && enqueueOp('electrician_claims', 'delete', c.id));
      childTx.forEach(t => t?.id && enqueueOp('point_transactions', 'delete', t.id));
      childRed.forEach(r => r?.id && enqueueOp('redemptions', 'delete', r.id));
      setLocal('claims', claimsLocal.filter(c => c.electrician_id !== id));
      setLocal('transactions', txLocal.filter(t => t.electrician_id !== id));
      setLocal('redemptions', redLocal.filter(r => r.electrician_id !== id));
    }

    let cloudError = '';
    try {
      const { error } = await supabase.from('electricians').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Electrician[]>('electricians', initialElectricians);
        setLocal('electricians', current.filter(item => item.id !== id));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Electrician[]>('electricians', initialElectricians);
    setLocal('electricians', current.filter(item => item.id !== id));
    return cloudFailed('electricians', 'delete', id, undefined, 'Electrician delete', cloudError);
  },

  // PRODUCTS CRUD SERVICES
  async getProducts(): Promise<Product[]> {
    let supabaseProducts: Product[] = [];
    try {
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (!error && data) {
        supabaseProducts = data as Product[];
      }
    } catch (e) {
      console.warn('Supabase fetch products failed, fallback to local:', e);
    }
    // Merge (never overwrite) so queued local-only rows are never lost from cache
    const localProducts = getLocal<Product[]>('products', initialProducts);
    const map = new Map<string, Product>();
    [...supabaseProducts, ...localProducts].forEach(item => {
      if (item && item.id && !map.has(item.id)) map.set(item.id, item);
    });
    const merged = Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setLocal('products', merged);
    return merged;
  },

  async addProduct(product: Omit<Product, 'id' | 'updated_at' | 'created_at'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: newUuid(),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (!error && data) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', [data, ...current]);
        return data as Product;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Product[]>('products', initialProducts);
    setLocal('products', [newProduct, ...current]);
    return cloudFailed('products', 'insert', newProduct.id, newProduct, 'Product', cloudError);
  },

  async addBulkProducts(productsList: Omit<Product, 'id' | 'updated_at' | 'created_at'>[]): Promise<Product[]> {
    const preparedList: Product[] = productsList.map(p => ({
      ...p,
      id: newUuid(),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }));

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('products').insert(preparedList).select();
      if (!error && data) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', [...data, ...current]);
        return data as Product[];
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Product[]>('products', initialProducts);
    const updated = [...preparedList, ...current];
    setLocal('products', updated);
    preparedList.forEach(p => p?.id && enqueueOp('products', 'insert', p.id, p));
    throw new Error(`Products could not be saved online — queued, will sync automatically. (${cloudError || 'network/cloud error'})`);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('products').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', current.map(p => p.id === id ? (data as Product) : p));
        return data as Product;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Product update could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('products', 'update', id, result, 'Product update', cloudError);
  },

  async deleteProduct(id: string): Promise<boolean> {
    let cloudError = '';
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', current.filter(p => p.id !== id));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Product[]>('products', initialProducts);
    setLocal('products', current.filter(p => p.id !== id));
    return cloudFailed('products', 'delete', id, undefined, 'Product delete', cloudError);
  },

  async deleteProducts(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return false;
    let cloudError = '';
    try {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (!error) {
        const current = getLocal<Product[]>('products', initialProducts);
        setLocal('products', current.filter(p => !ids.includes(p.id)));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Product[]>('products', initialProducts);
    setLocal('products', current.filter(p => !ids.includes(p.id)));
    ids.forEach(pid => pid && enqueueOp('products', 'delete', pid));
    throw new Error(`Products could not be deleted online — queued, will sync automatically. (${cloudError || 'network/cloud error'})`);
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
      id: newUuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('customers').insert([newCustomer]).select().single();
      if (!error && data) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', [data, ...current]);
        return data as Customer;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Customer[]>('customers', initialCustomers);
    setLocal('customers', [newCustomer, ...current]);
    return cloudFailed('customers', 'insert', newCustomer.id, newCustomer, 'Customer', cloudError);
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('customers').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', current.map(c => c.id === id ? (data as Customer) : c));
        return data as Customer;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Customer update could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('customers', 'update', id, result, 'Customer update', cloudError);
  },

  async deleteCustomer(id: string): Promise<boolean> {
    let cloudError = '';
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', current.filter(c => c.id !== id));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Customer[]>('customers', initialCustomers);
    setLocal('customers', current.filter(c => c.id !== id));
    return cloudFailed('customers', 'delete', id, undefined, 'Customer delete', cloudError);
  },

  async deleteCustomers(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return false;
    let cloudError = '';
    try {
      const { error } = await supabase.from('customers').delete().in('id', ids);
      if (!error) {
        const current = getLocal<Customer[]>('customers', initialCustomers);
        setLocal('customers', current.filter(c => !ids.includes(c.id)));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Customer[]>('customers', initialCustomers);
    setLocal('customers', current.filter(c => !ids.includes(c.id)));
    ids.forEach(cid => cid && enqueueOp('customers', 'delete', cid));
    throw new Error(`Customers could not be deleted online — queued, will sync automatically. (${cloudError || 'network/cloud error'})`);
  },

  // POINT TRANSACTIONS / LEDGER SERVICES
  async getTransactions(): Promise<PointTransaction[]> {
    let supabaseTx: PointTransaction[] = [];
    try {
      const { data, error } = await supabase.from('point_transactions').select('*').order('date', { ascending: false });
      if (!error && data) {
        supabaseTx = data as PointTransaction[];
      }
    } catch (e) {
      console.warn('Supabase get transactions failed:', e);
    }
    // Merge (never overwrite) so queued local-only rows are never lost from cache
    const localTx = getLocal<PointTransaction[]>('transactions', initialTransactions);
    const map = new Map<string, PointTransaction>();
    [...supabaseTx, ...localTx].forEach(item => {
      if (item && item.id && !map.has(item.id)) map.set(item.id, item);
    });
    const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    setLocal('transactions', merged);
    return merged;
  },

  async addTransaction(tx: Omit<PointTransaction, 'id' | 'created_at'>): Promise<PointTransaction> {
    const newTx: PointTransaction = {
      ...tx,
      id: newUuid(),
      created_at: new Date().toISOString()
    };

    // Update electrician balance (no floor - keep ledger & balance in sync honestly).
    // If the balance update fails online it is already queued — continue so the
    // ledger row itself is also queued (outbox order preserves causality).
    const electricians = await this.getElectricians();
    const electrician = electricians.find(e => e.id === tx.electrician_id);
    if (electrician) {
      const pointDiff = (tx.credit_points || 0) - (tx.debit_points || 0);
      const newBalance = electrician.points_balance + pointDiff;
      try {
        await this.updateElectrician(electrician.id, { points_balance: newBalance });
      } catch (e) {
        console.warn('Balance update queued, continuing with ledger row:', e);
      }
      newTx.electrician_name = electrician.name;
    }

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('point_transactions').insert([newTx]).select().single();
      if (!error && data) {
        const current = getLocal<PointTransaction[]>('transactions', initialTransactions);
        setLocal('transactions', [data, ...current]);
        return data as PointTransaction;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<PointTransaction[]>('transactions', initialTransactions);
    setLocal('transactions', [newTx, ...current]);
    return cloudFailed('point_transactions', 'insert', newTx.id, newTx, 'Points transaction', cloudError);
  },

  // REDEMPTIONS SERVICES
  async getRedemptions(): Promise<Redemption[]> {
    let supabaseRed: Redemption[] = [];
    try {
      const { data, error } = await supabase.from('redemptions').select('*').order('requested_date', { ascending: false });
      if (!error && data) {
        supabaseRed = data as Redemption[];
      }
    } catch (e) {
      console.warn('Supabase get redemptions error:', e);
    }
    // Merge (never overwrite) so queued local-only rows are never lost from cache
    const localRed = getLocal<Redemption[]>('redemptions', initialRedemptions);
    const map = new Map<string, Redemption>();
    [...supabaseRed, ...localRed].forEach(item => {
      if (item && item.id && !map.has(item.id)) map.set(item.id, item);
    });
    const merged = Array.from(map.values()).sort((a, b) => new Date(b.requested_date || 0).getTime() - new Date(a.requested_date || 0).getTime());
    setLocal('redemptions', merged);
    return merged;
  },

  async requestRedemption(redemption: Omit<Redemption, 'id' | 'status' | 'requested_date'>): Promise<Redemption> {
    const newRedemption: Redemption = {
      ...redemption,
      id: newUuid(),
      status: 'pending',
      requested_date: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('redemptions').insert([newRedemption]).select().single();
      if (!error && data) {
        const current = getLocal<Redemption[]>('redemptions', initialRedemptions);
        setLocal('redemptions', [data, ...current]);
        return data as Redemption;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<Redemption[]>('redemptions', initialRedemptions);
    setLocal('redemptions', [newRedemption, ...current]);
    return cloudFailed('redemptions', 'insert', newRedemption.id, newRedemption, 'Redemption request', cloudError);
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
      // Create ledger debit transaction (this also debits the balance).
      // If it fails online it is already queued — continue so the status change is queued too.
      try {
        await this.addTransaction({
          electrician_id: red.electrician_id,
          electrician_name: red.electrician_name,
          date: new Date().toISOString(),
          particular: `Redemption Approved: ${red.gift_name}`,
          debit_points: red.points,
          credit_points: 0
        });
      } catch (e) {
        console.warn('Redemption ledger row queued, continuing with status change:', e);
      }
    }

    const updateData = {
      status,
      remarks,
      processed_date: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('redemptions').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Redemption[]>('redemptions', initialRedemptions);
        setLocal('redemptions', current.map(r => r.id === id ? (data as Redemption) : r));
        return data as Redemption;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Redemption status could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('redemptions', 'update', id, result, 'Redemption status', cloudError);
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
      id: newUuid(),
      status: 'pending',
      submitted_date: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('electrician_claims').insert([newClaim]).select().single();
      if (!error && data) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', [data, ...current]);
        return data;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal('claims', initialClaims);
    setLocal('claims', [newClaim, ...current]);
    return cloudFailed('electrician_claims', 'insert', newClaim.id, newClaim, 'Claim', cloudError);
  },

  async updateClaimStatus(id: string, status: 'approved' | 'rejected', remarks?: string): Promise<any> {
    const claims = await this.getClaims();
    const claim = claims.find(c => c.id === id);

    if (claim && claim.status === 'pending' && status === 'approved') {
      // Auto credit points and post to ledger!
      // If it fails online it is already queued — continue so the status change is queued too.
      try {
        await this.addTransaction({
          electrician_id: claim.electrician_id,
          electrician_name: claim.electrician_name,
          date: new Date().toISOString(),
          particular: `Claim Approved: Bill #${claim.bill_no} (₹${claim.bill_amount.toLocaleString('en-IN')})`,
          debit_points: 0,
          credit_points: claim.claimed_points
        });
      } catch (e) {
        console.warn('Claim ledger row queued, continuing with status change:', e);
      }
    }

    const updateData = {
      status,
      remarks,
      processed_date: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('electrician_claims').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', current.map(c => c.id === id ? data : c));
        return data;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Claim status could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('electrician_claims', 'update', id, result, 'Claim status', cloudError);
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
        // Post an adjustment transaction (debit the over-credited, or credit the under-credited).
        // If it fails online it is already queued — continue so the claim edit is queued too.
        try {
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
        } catch (e) {
          console.warn('Claim adjustment row queued, continuing with claim edit:', e);
        }
      } else if (pointDiff !== 0 && !originalTx) {
        // No original tx found (rare) - just credit/debit fresh
        try {
          await this.addTransaction({
            electrician_id: existingClaim.electrician_id,
            electrician_name: existingClaim.electrician_name,
            date: new Date().toISOString(),
            particular: `Bill Amount Revised: Bill #${existingClaim.bill_no}`,
            debit_points: pointDiff < 0 ? Math.abs(pointDiff) : 0,
            credit_points: pointDiff > 0 ? pointDiff : 0
          });
        } catch (e) {
          console.warn('Claim adjustment row queued, continuing with claim edit:', e);
        }
      }
    }
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('electrician_claims').update(safeUpdates).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', current.map(c => c.id === id ? data : c));
        return data;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Claim edit could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('electrician_claims', 'update', id, result, 'Claim edit', cloudError);
  },

  async deleteClaim(id: string): Promise<boolean> {
    let cloudError = '';
    try {
      const { error } = await supabase.from('electrician_claims').delete().eq('id', id);
      if (!error) {
        const current = getLocal('claims', initialClaims);
        setLocal('claims', current.filter(c => c.id !== id));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal('claims', initialClaims);
    setLocal('claims', current.filter(c => c.id !== id));
    return cloudFailed('electrician_claims', 'delete', id, undefined, 'Claim delete', cloudError);
  },

  // COMPANY PROFILE & CREDENTIALS SERVICE
  getCompanyProfile(): any {
    const defaultProfile = {
      companyName: APP_NAME,
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
          appName: data.app_name || APP_NAME
        };
      }
    } catch (e) {
      console.warn('Supabase get app_settings error:', e);
    }
    return null;
  },

  async saveAppSettings(settings: { pointsPercent: number; minBillAmount: number; appName: string }): Promise<void> {
    const payload = {
      id: 1,
      points_percent: settings.pointsPercent,
      min_bill_amount: settings.minBillAmount,
      app_name: settings.appName,
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('app_settings').upsert(payload, { onConflict: 'id' });
      if (!error) return;
      enqueueOp('app_settings', 'update', '1', payload);
      throw new Error(`Settings could not be saved online — queued, will sync automatically. (${error.message})`);
    } catch (e: any) {
      if (e?.message?.startsWith('Settings could not be saved online')) throw e;
      enqueueOp('app_settings', 'update', '1', payload);
      throw new Error(`Settings could not be saved online — queued, will sync automatically. (${e?.message || 'network error'})`);
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
      id: newUuid(),
      status: om.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let cloudError = '';
    try {
      const { data, error } = await supabase.from('order_men').insert([newOM]).select().single();
      if (!error && data) {
        const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
        setLocal('order_men', [data, ...current]);
        return data as OrderMan;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
    setLocal('order_men', [newOM, ...current]);
    return cloudFailed('order_men', 'insert', newOM.id, newOM, 'Order man', cloudError);
  },

  async updateOrderMan(id: string, updates: Partial<OrderMan>): Promise<OrderMan | null> {
    const updatedObj = { ...updates, updated_at: new Date().toISOString() };
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('order_men').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
        setLocal('order_men', current.map(om => om.id === id ? (data as OrderMan) : om));
        return data as OrderMan;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Order man update could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('order_men', 'update', id, result, 'Order man update', cloudError);
  },

  async deleteOrderMan(id: string): Promise<boolean> {
    let cloudError = '';
    try {
      const { error } = await supabase.from('order_men').delete().eq('id', id);
      if (!error) {
        const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
        setLocal('order_men', current.filter(om => om.id !== id));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }

    const current = getLocal<OrderMan[]>('order_men', initialOrderMen);
    setLocal('order_men', current.filter(om => om.id !== id));
    return cloudFailed('order_men', 'delete', id, undefined, 'Order man delete', cloudError);
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
      // Must be a valid UUID — orders.id is a UUID primary key in Supabase.
      id: newUuid(),
      order_no: `ORD-${Date.now()}-${newUuid().slice(0, 6)}`,
      status: order.status || 'pending',
      total_amount: order.total_amount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('orders').insert([newOrder]).select().single();
      if (!error && data) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', [data, ...current]);
        return data as Order;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }
    const current = getLocal<Order[]>('orders', initialOrders);
    setLocal('orders', [newOrder, ...current]);
    return cloudFailed('orders', 'insert', newOrder.id, newOrder, 'Order', cloudError);
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
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('orders').update(updatedObj).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', current.map(o => o.id === id ? (data as Order) : o));
        return data as Order;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Order edit could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('orders', 'update', id, result, 'Order edit', cloudError);
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
    let cloudError = '';
    try {
      const { data, error } = await supabase.from('orders').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', current.map(o => o.id === id ? (data as Order) : o));
        return data as Order;
      }
      if (error) cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
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
    if (!result) {
      throw new Error(`Order status could not be saved online — queued, will sync automatically. (${cloudError || 'record not found locally'})`);
    }
    return cloudFailed('orders', 'update', id, result, 'Order status', cloudError);
  },

  async deleteOrder(id: string): Promise<boolean> {
    let cloudError = '';
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) {
        const current = getLocal<Order[]>('orders', initialOrders);
        setLocal('orders', current.filter(o => o.id !== id));
        return true;
      }
      cloudError = error.message;
    } catch (e: any) {
      cloudError = e?.message || 'network error';
    }
    const current = getLocal<Order[]>('orders', initialOrders);
    setLocal('orders', current.filter(o => o.id !== id));
    return cloudFailed('orders', 'delete', id, undefined, 'Order delete', cloudError);
  },

  // OUTBOX: retry every queued cloud write until it lands online.
  getOutboxSummary(): { pending: number; lastError?: string } {
    const ops = getOutbox();
    const failed = ops.filter(o => o.attempts > 0).sort((a, b) => b.attempts - a.attempts)[0];
    return { pending: ops.length, lastError: failed?.lastError };
  },

  // Fix stranded local rows whose ids are not valid UUIDs (they can never insert
  // into UUID primary-key columns). References are rewritten so nothing breaks.
  normalizeLocalIds(): { fixed: number } {
    let fixed = 0;
    const idMap: Record<string, Record<string, string>> = {};
    const tables: OutboxTable[] = ['electricians', 'order_men', 'products', 'customers', 'orders', 'electrician_claims', 'point_transactions', 'redemptions'];
    tables.forEach(table => {
      const key = TABLE_LOCAL_KEY[table];
      const rows = getLocal<any[]>(key, []);
      let changed = false;
      const map: Record<string, string> = {};
      const next = rows.map(r => {
        if (r && typeof r.id === 'string' && r.id && !isUuid(r.id)) {
          const nid = newUuid();
          map[r.id] = nid;
          fixed++;
          changed = true;
          return { ...r, id: nid };
        }
        return r;
      });
      if (changed) {
        setLocal(key, next);
        idMap[table] = map;
      }
    });
    // Rewrite dangling references to regenerated ids
    const rewrite = (localKey: string, field: string, map: Record<string, string> | undefined) => {
      if (!map || Object.keys(map).length === 0) return;
      const rows = getLocal<any[]>(localKey, []);
      let changed = false;
      const next = rows.map(r => {
        if (r && typeof r[field] === 'string' && map[r[field]]) {
          changed = true;
          return { ...r, [field]: map[r[field]] };
        }
        return r;
      });
      if (changed) setLocal(localKey, next);
    };
    rewrite('claims', 'electrician_id', idMap['electricians']);
    rewrite('transactions', 'electrician_id', idMap['electricians']);
    rewrite('redemptions', 'electrician_id', idMap['electricians']);
    rewrite('orders', 'order_man_id', idMap['order_men']);
    const prodMap = idMap['products'];
    if (prodMap && Object.keys(prodMap).length > 0) {
      const orders = getLocal<any[]>('orders', []);
      let changed = false;
      const next = orders.map(o => {
        if (o && Array.isArray(o.items)) {
          const items = o.items.map((it: any) => (it && prodMap[it.product_id] ? (changed = true, { ...it, product_id: prodMap[it.product_id] }) : it));
          return { ...o, items };
        }
        return o;
      });
      if (changed) setLocal('orders', next);
    }
    return { fixed };
  },

  async flushOutbox(): Promise<{ done: number; failed: number; errors: string[] }> {
    const ops = getOutbox().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let done = 0;
    const errors: string[] = [];
    for (const op of ops) {
      try {
        if (op.table === 'app_settings') {
          const payload = { ...(op.record || {}), id: 1, updated_at: new Date().toISOString() };
          const { error } = await supabase.from('app_settings').upsert(payload, { onConflict: 'id' });
          if (error) throw error;
        } else if (op.op === 'insert') {
          const { data: existing, error: selErr } = await supabase.from(op.table).select('id').eq('id', op.id).maybeSingle();
          if (selErr) throw selErr;
          if (!existing && op.record) {
            const { error } = await supabase.from(op.table).insert([op.record]);
            if (error) throw error;
          }
        } else if (op.op === 'update') {
          const payload = { ...(op.record || {}) };
          delete (payload as any).id;
          delete (payload as any).created_at;
          const { data, error } = await supabase.from(op.table).update(payload).eq('id', op.id).select('id').maybeSingle();
          if (error) throw error;
          if (!data && op.record) {
            // Row missing in cloud (was never inserted) — insert the full snapshot
            const { error: insErr } = await supabase.from(op.table).insert([op.record]);
            if (insErr) throw insErr;
          }
        } else {
          const { error } = await supabase.from(op.table).delete().eq('id', op.id);
          if (error) throw error;
        }
        removeOp(op.key);
        done++;
      } catch (e: any) {
        const msg = e?.message || 'unknown error';
        const all = getOutbox();
        const target = all.find(o => o.key === op.key);
        if (target) {
          target.attempts += 1;
          target.lastError = msg;
          setOutbox(all);
        }
        errors.push(`${op.table}:${op.op}:${op.id} — ${msg}`);
      }
    }
    return { done, failed: errors.length, errors };
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


