-- Central catalog photo: one persistent image reused by every store in the network.
CREATE TABLE IF NOT EXISTS product_photos (
  network_id text NOT NULL,
  product_id integer NOT NULL,
  content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 3145728),
  mime text NOT NULL DEFAULT 'image/jpeg' CHECK (mime = 'image/jpeg'),
  actor_id text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (network_id, product_id),
  FOREIGN KEY (network_id, product_id) REFERENCES products(network_id, id)
);
