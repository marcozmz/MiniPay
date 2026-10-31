ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp;
ALTER TABLE session ADD COLUMN IF NOT EXISTS "impersonatedBy" text;

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS password_setup_required boolean NOT NULL DEFAULT false;
UPDATE "user" u SET role='admin' FROM memberships m WHERE m.user_id=u.id AND m.role='admin';

CREATE TABLE IF NOT EXISTS access_history (
 id text PRIMARY KEY,
 network_id text NOT NULL REFERENCES networks(id),
 actor_id text NOT NULL REFERENCES "user"(id),
 target_user_id text NOT NULL REFERENCES "user"(id),
 action text NOT NULL CHECK(action IN ('operator_created','stores_changed','operator_deactivated')),
 before_state jsonb NOT NULL,
 after_state jsonb NOT NULL,
 at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS access_history_network_at ON access_history(network_id,at DESC);
