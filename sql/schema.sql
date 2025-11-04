CREATE TABLE products (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          sku TEXT UNIQUE NOT NULL,
                          name TEXT NOT NULL,
                          total_stock INT NOT NULL CHECK (total_stock >= 0),
                          created_at timestamptz DEFAULT now(),
                          updated_at timestamptz DEFAULT now()
);

CREATE TABLE orders (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id TEXT NOT NULL,
                        created_at timestamptz DEFAULT now()
);

CREATE TABLE order_items (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                             product_id UUID REFERENCES products(id),
                             sku TEXT NOT NULL,
                             qty INT NOT NULL CHECK (qty > 0),
                             unit_price NUMERIC(10,2) NOT NULL
);
