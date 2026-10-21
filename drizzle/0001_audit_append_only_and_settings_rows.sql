-- Audit log is append-only: reject UPDATE and DELETE (docs/standards.md SEC-10).
CREATE OR REPLACE FUNCTION audit_log_reject_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (% not allowed)', TG_OP;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_reject_change();
--> statement-breakpoint
CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_reject_change();
--> statement-breakpoint
-- The single settings rows. Only facts already known are filled in; the rest is edited in admin.
INSERT INTO organization_settings (id, legal_name, display_name, alternate_names, email)
VALUES (1, 'Munira Shoaib Welfare Trust', 'MS Welfare Trust', '{"en": ["MS Welfare Trust", "MSWT"]}'::jsonb, 'info@mswelfaretrust.org')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO seo_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
INSERT INTO appearance_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
