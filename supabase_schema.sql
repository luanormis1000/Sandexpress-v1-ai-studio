-- SandExpress Database Schema (Multi-Tenant SaaS)

-- 1. Vendors (Quiosques)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  beach_name TEXT,
  location_city TEXT,
  primary_color TEXT DEFAULT '#FF6B00',
  secondary_color TEXT DEFAULT '#3D1A0A',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff & Identity Management
-- Note: 'role' can be 'admin_geral', 'kiosk_master', 'kiosk_seller'
CREATE TABLE users_metadata (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin_geral', 'kiosk_master', 'kiosk_seller')),
  vendor_id UUID REFERENCES vendors(id), -- NULL if admin_geral
  password_needs_change BOOLEAN DEFAULT TRUE,
  password_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Menu Items (Per Vendor)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders (Table/Umbrella based)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  client_name TEXT,
  items JSONB NOT NULL, -- Array of {id, name, price, quantity}
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparando', 'entregue', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Umbrella Map Configuration (Per Vendor)
CREATE TABLE umbrellas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  umbrella_number TEXT NOT NULL,
  pos_x INTEGER NOT NULL,
  pos_y INTEGER NOT NULL,
  UNIQUE(vendor_id, umbrella_number)
);

-- Security RLS (Row Level Security) Examples:
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see their vendor's orders" ON orders
--   FOR ALL USING (vendor_id = (SELECT vendor_id FROM users_metadata WHERE id = auth.uid()) OR (SELECT role FROM users_metadata WHERE id = auth.uid()) = 'admin_geral');
