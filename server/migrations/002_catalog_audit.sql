ALTER TABLE products ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Mercearia' CHECK(category IN ('Bebidas','Mercearia','Doces','Higiene'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS listing_changes (
 id text NOT NULL,
 request_id text NOT NULL,
 network_id text NOT NULL,
 store_id text NOT NULL,
 product_id integer NOT NULL,
 actor_id text NOT NULL REFERENCES "user"(id),
 before_values jsonb NOT NULL,
 after_values jsonb NOT NULL,
 reason text NOT NULL,
 request_json text NOT NULL,
 at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(network_id,id),
 UNIQUE(network_id,store_id,request_id),
 FOREIGN KEY(network_id,store_id) REFERENCES stores(network_id,id),
 FOREIGN KEY(network_id,product_id) REFERENCES products(network_id,id)
);
CREATE INDEX IF NOT EXISTS listing_changes_store ON listing_changes(network_id,store_id,at DESC);
