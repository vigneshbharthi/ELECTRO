# Implementation Plan - E-POINT (Electric Shop Loyalty & Order Management Web/Mobile App)

Building a complete Web & Mobile application for an Electric Shop with Role-Based Access Control (RBAC), Supabase direct backend (Database, Storage, Auth), points calculation system for Electricians, price lookup for Order Men, and POS-style keyboard navigation.

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Decisions & Confirmation Requested:**
> 1. **Supabase Direct Connection**: We will use Supabase JS SDK directly from the frontend for Auth, Database (PostgreSQL with RLS), and Storage (Bill images). Please confirm if you have a Supabase project created or if you want step-by-step instructions to set up the Supabase project credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
> 2. **Authentication Method**: Admin will create credentials for Electricians and Order Men (Username/Email + Password). They will log in using these credentials.
> 3. **Points Calculation Logic**: Default rate will be set to **₹100 = 10 Points** (configurable in Admin Settings). Example: Bill of ₹1,500 = 150 Points.

---

## Open Questions

> [!QUESTION]
> 1. **Points Redemption**: Should Electricians be able to request redemption of their accumulated points for cash/rewards within the app, or is point tracking for shop reference only?
> 2. **Product Categories**: Do you have specific electric shop product categories in mind (e.g., Wires, Switches, Lighting, MCBs, Fans)?

---

## Proposed System Architecture & Database Schema

### Database Schema (Supabase PostgreSQL)

```sql
-- 1. Profiles Table (RBAC)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'electrician', 'order_man')) NOT NULL,
  points_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settings Table
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  rupees_per_point_unit NUMERIC DEFAULT 100, -- Default ₹100
  points_per_unit NUMERIC DEFAULT 10,       -- Default 10 Points
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table (Product CRUD for Order Man price check & Admin)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku_code TEXT UNIQUE,
  category TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bills / Claims Table
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  electrician_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  invoice_amount NUMERIC NOT NULL,
  bill_image_url TEXT NOT NULL,
  points_earned NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Proposed Changes & Application Modules

We will create a Vite + React application in `d:\EPOINT` with modern aesthetic styling (dark/light clean theme, micro-animations, glassmorphism card layouts) responsive for both Web desktops and Mobile smartphones.

```
d:\EPOINT\
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MobileNav.jsx
│   │   ├── UI/ (Button, Input, Card, Modal, Badge, Table)
│   │   └── KeyboardFocusHandler.jsx (Enter key to next field utility)
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── SettingsContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ElectricianCRUD.jsx
│   │   │   ├── OrderManCRUD.jsx
│   │   │   ├── BillApprovals.jsx
│   │   │   ├── ProductCRUD.jsx
│   │   │   └── SystemSettings.jsx
│   │   ├── electrician/
│   │   │   ├── ElectricianDashboard.jsx
│   │   │   ├── UploadBill.jsx
│   │   │   └── BillHistory.jsx
│   │   └── orderman/
│   │       └── ProductPriceCheck.jsx
│   ├── services/
│   │   └── supabaseClient.js
│   ├── utils/
│   │   ├── enterKeyNavigation.js
│   │   └── formatters.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase_setup.sql
├── render.yaml
├── package.json
└── README.md
```

---

## Detailed Feature Implementation Plan

### 1. Key Navigation Utility (`enterKeyNavigation.js`)
- Automatic focus listener attached to form containers (`data-enter-navigate="true"`).
- Pressing `Enter` in input/select controls automatically moves focus to the next `[tabindex]` or form field instead of submitting prematurely.
- `Ctrl + Enter` triggers the primary submit action.

### 2. Admin Portal Features (RBAC: `admin`)
- **Electrician Management (CRUD)**: Add electrician with Name, Phone, Email, Password. Automatically provisions Supabase Auth user & Profile entry.
- **Order Man Management (CRUD)**: Add order man user with Name, Phone, Email, Password.
- **Bill Approval Workflow**:
  - View image proof of bill upload.
  - Check Invoice Date, Customer Name, and Amount.
  - Approve button: Calculates points using `(Invoice Amount / Rupees_Per_Unit) * Points_Per_Unit` and credits `points_balance` in electrician profile.
  - Reject button with optional remark.
- **Product Catalog (CRUD)**: Add/Edit/Delete products with Name, SKU, Category, and Price.
- **Settings**: Dynamic point ratio input (e.g. Set how many points per ₹100).

### 3. Electrician Portal Features (RBAC: `electrician`)
- **Points Card**: Display total lifetime points and approved claims.
- **Upload Bill**: Form with file input (Image upload directly to Supabase Bucket `bill-invoices`), Customer Name, Date, Amount.
- **Keyboard Navigation**: Pressing `Enter` scrolls focus seamlessly from Customer Name -> Date -> Amount -> Submit.
- **Claim Status**: View status badge (`Pending`, `Approved`, `Rejected`).

### 4. Order Man Portal Features (RBAC: `order_man`)
- **Fast Price Lookup**: Quick instant search bar by product name or code.
- Display category, rate, availability status without exposing point calculations or administrative controls.

---

## Verification Plan

### Automated & Static Verification
1. `npm run build`: Verify TypeScript / Vite React build succeeds with zero errors.
2. `npm run lint`: Ensure clean code standards.

### Functional Verification
1. **Auth & RBAC**: Test login as Admin, Electrician, and Order Man. Verify protected routes restrict unauthorized access.
2. **Keyboard Navigation**: Verify `Enter` key navigates across form fields in Upload Bill and Product CRUD forms.
3. **Bill Approval & Points Flow**:
   - Electrician uploads bill of ₹1,000.
   - Admin approves bill.
   - Verify Electrician points update by 100 points (at 10pts / ₹100).
4. **Order Man View**: Verify search filters products instantly by rate.
5. **Mobile Responsiveness**: Test viewports (375px mobile, 768px tablet, 1440px desktop).
