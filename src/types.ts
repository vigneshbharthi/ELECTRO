export interface Electrician {
  id: string;
  name: string;
  father_name: string;
  mobile: string;
  email: string;
  dob: string;
  address: string;
  pincode: string;
  experience: number; // in years
  password?: string; // Login password for Electrician Portal
  points_balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderMan {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  password?: string;
  region: string; // e.g. Salem Zone, Chennai West
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  group_name: string;
  uom: string; // Unit of Measure e.g. Nos, Box, Roll, Meter
  price: number;
  updated_at: string;
  created_at?: string;
}

export interface BillEntry {
  id: string;
  bill_no: string;
  electrician_id: string;
  electrician_name?: string;
  bill_amount: number;
  points_earned: number;
  date: string;
  remarks?: string;
}

export interface ElectricianClaim {
  id: string;
  electrician_id: string;
  electrician_name?: string;
  electrician_mobile?: string;
  bill_no: string;
  bill_amount: number;
  claimed_points: number;
  invoice_image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_date: string;
  processed_date?: string;
  remarks?: string;
}

export interface PointTransaction {
  id: string;
  electrician_id: string;
  electrician_name?: string;
  date: string;
  particular: string; // e.g., "Bill #BILL-1092 Value: ₹15,000", "Redemption: Fastrack Voucher"
  debit_points: number;
  credit_points: number;
  created_at?: string;
}

export interface Redemption {
  id: string;
  electrician_id: string;
  electrician_name?: string;
  electrician_mobile?: string;
  points: number;
  gift_name: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_date: string;
  processed_date?: string;
  remarks?: string;
}

export interface UserAuth {
  isAuthenticated: boolean;
  isDeveloperMode: boolean;
  userRole: 'admin' | 'orderman' | 'electrician' | 'developer' | 'guest';
  username: string;
  userId?: string; // Logged in Electrician ID or OrderMan ID
  userMobile?: string;
}

export interface AppSettings {
  pointsPercent: number; // Percentage of bill value awarded as points, e.g. 1 means 1% (₹100 = 1 pt at 1%)
  minBillAmount: number;
  appName: string;
}

export interface CompanyProfile {
  companyName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  adminUsername: string;
  adminPassword: string;
  devUsername: string;
  devPassword: string;
}
