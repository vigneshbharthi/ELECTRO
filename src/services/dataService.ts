import { supabase } from '../lib/supabase';
import { Electrician, OrderMan, Product, PointTransaction, Redemption } from '../types';

// Initial fallback mock data
const initialElectricians: Electrician[] = [
  {
    id: 'e101-uuid-001',
    name: 'Karthik Raja',
    father_name: 'Ramasamy',
    mobile: '9876543210',
    email: 'karthik.e@gmail.com',
    dob: '1992-05-15',
    address: '12 Cross Street, Gandhinagar',
    pincode: '636008',
    experience: 7,
    password: '123456',
    points_balance: 450,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'e102-uuid-002',
    name: 'Senthil Kumar',
    father_name: 'Murugan',
    mobile: '9842109876',
    email: 'senthil.spark@yahoo.com',
    dob: '1988-11-20',
    address: '45 MTH Road, Ambattur',
    pincode: '600053',
    experience: 12,
    password: '123456',
    points_balance: 1200,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'e103-uuid-003',
    name: 'Vigneshwaran M',
    father_name: 'Manoharan',
    mobile: '9789012345',
    email: 'vignesh.dev@electro.in',
    dob: '1995-03-08',
    address: '88 Main Bazaar, RS Puram',
    pincode: '641002',
    experience: 5,
    password: '123456',
    points_balance: 800,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialOrderMen: OrderMan[] = [
  {
    id: 'om101-uuid',
    name: 'Rajesh Kumar',
    mobile: '9812345678',
    email: 'rajesh.om@electro.in',
    password: 'order123',
    region: 'Salem & Namakkal Zone',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'om102-uuid',
    name: 'Suresh Babu',
    mobile: '9712345678',
    email: 'suresh.om@electro.in',
    password: 'order123',
    region: 'Chennai Ambattur Region',
    status: 'active',
    created_at: new Date().toISOString()
  }
];

const initialProducts: Product[] = [
  {
    id: 'p101-uuid-001',
    name: '32A Double Pole MCB',
    group_name: 'Switchgear',
    uom: 'Nos',
    price: 480.00,
    updated_at: new Date().toISOString()
  },
  {
    id: 'p102-uuid-002',
    name: '1.5 sqmm FR PVC Copper Wire (90m)',
    group_name: 'Wires & Cables',
    uom: 'Roll',
    price: 1850.00,
    updated_at: new Date().toISOString()
  },
  {
    id: 'p103-uuid-003',
    name: '10-Way Modular Metal Enclosure Box',
    group_name: 'Distribution Boards',
    uom: 'Box',
    price: 1200.00,
    updated_at: new Date().toISOString()
  },
  {
    id: 'p104-uuid-004',
    name: 'Smart Modular Switch 16A 1-Way',
    group_name: 'Switches & Sockets',
    uom: 'Nos',
    price: 195.00,
    updated_at: new Date().toISOString()
  },
  {
    id: 'p105-uuid-005',
    name: 'LED Panel Light 15W Round',
    group_name: 'Lighting Solutions',
    uom: 'Nos',
    price: 320.00,
    updated_at: new Date().toISOString()
  }
];

const initialTransactions: PointTransaction[] = [
  {
    id: 't101',
    electrician_id: 'e101-uuid-001',
    electrician_name: 'Karthik Raja',
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    particular: 'Initial Joining Welcome Bonus',
    debit_points: 0,
    credit_points: 250
  },
  {
    id: 't102',
    electrician_id: 'e101-uuid-001',
    electrician_name: 'Karthik Raja',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    particular: 'Product Scan: 3x Wire Rolls 1.5sqmm',
    debit_points: 0,
    credit_points: 300
  },
  {
    id: 't103',
    electrician_id: 'e101-uuid-001',
    electrician_name: 'Karthik Raja',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    particular: 'Redemption: Rs.100 Fastrack Voucher',
    debit_points: 100,
    credit_points: 0
  },
  {
    id: 't104',
    electrician_id: 'e102-uuid-002',
    electrician_name: 'Senthil Kumar',
    date: new Date(Date.now() - 15 * 86400000).toISOString(),
    particular: 'Initial Joining Welcome Bonus',
    debit_points: 0,
    credit_points: 200
  },
  {
    id: 't105',
    electrician_id: 'e102-uuid-002',
    electrician_name: 'Senthil Kumar',
    date: new Date(Date.now() - 8 * 86400000).toISOString(),
    particular: 'Bulk Wiring Project Scan Reward',
    debit_points: 0,
    credit_points: 1000
  }
];

const initialRedemptions: Redemption[] = [
  {
    id: 'r101',
    electrician_id: 'e101-uuid-001',
    electrician_name: 'Karthik Raja',
    electrician_mobile: '9876543210',
    points: 100,
    gift_name: 'Fastrack Gift Voucher Rs.100',
    status: 'approved',
    requested_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    processed_date: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'r102',
    electrician_id: 'e102-uuid-002',
    electrician_name: 'Senthil Kumar',
    electrician_mobile: '9842109876',
    points: 500,
    gift_name: 'Bosch Power Drill Tool Set',
    status: 'pending',
    requested_date: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

const initialClaims: any[] = [
  {
    id: 'c101',
    electrician_id: 'e101-uuid-001',
    electrician_name: 'Karthik Raja',
    electrician_mobile: '9876543210',
    bill_no: 'INV-889120',
    bill_amount: 15000,
    claimed_points: 150,
    invoice_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
    status: 'pending',
    submitted_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    remarks: 'Commercial building wiring materials invoice copy'
  },
  {
    id: 'c102',
    electrician_id: 'e103-uuid-003',
    electrician_name: 'Vigneshwaran M',
    electrician_mobile: '9789012345',
    bill_no: 'INV-441209',
    bill_amount: 8500,
    claimed_points: 85,
    invoice_image_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=60',
    status: 'pending',
    submitted_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    remarks: 'Modular switches & DB box bill scan'
  }
];

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
    try {
      const { data, error } = await supabase.from('electricians').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocal('electricians', data);
        return data as Electrician[];
      }
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local:', e);
    }
    return getLocal('electricians', initialElectricians);
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

    // Update electrician balance
    const electricians = await this.getElectricians();
    const electrician = electricians.find(e => e.id === tx.electrician_id);
    if (electrician) {
      const pointDiff = (tx.credit_points || 0) - (tx.debit_points || 0);
      const newBalance = Math.max(0, electrician.points_balance + pointDiff);
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
      // Create ledger debit transaction
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
    try {
      const { data, error } = await supabase.from('electrician_claims').select('*').order('submitted_date', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocal('claims', data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase get claims error:', e);
    }
    return getLocal('claims', initialClaims);
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

  // ORDER MAN CRUD SERVICES
  async getOrderMen(): Promise<OrderMan[]> {
    try {
      const { data, error } = await supabase.from('order_men').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocal('order_men', data);
        return data as OrderMan[];
      }
    } catch (e) {
      console.warn('Supabase get order men error:', e);
    }
    return getLocal('order_men', initialOrderMen);
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


