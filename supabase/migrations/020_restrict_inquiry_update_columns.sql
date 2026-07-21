-- 020_restrict_inquiry_update_columns.sql
-- "Performers can update inquiry status" and "Clients can update own inquiry
-- status" (002_rls.sql, 017_inquiry_messages.sql) only check row ownership,
-- with no WITH CHECK restricting columns. That lets either side rewrite any
-- column on an inquiry they're party to — including client_id, full_name,
-- email, phone, event_date, location and message — not just the status/reply
-- fields the UI actually needs to change. Same missing-column-guard pattern
-- as 011/019, lower blast radius here since it's confined to a row's own
-- inquiry thread, but still lets either party falsify the inquiry record.
CREATE OR REPLACE FUNCTION public.restrict_inquiry_update_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    NEW.client_id := OLD.client_id;
    NEW.performer_id := OLD.performer_id;
    NEW.full_name := OLD.full_name;
    NEW.email := OLD.email;
    NEW.phone := OLD.phone;
    NEW.event_type := OLD.event_type;
    NEW.event_date := OLD.event_date;
    NEW.location := OLD.location;
    NEW.message := OLD.message;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER restrict_inquiry_update_columns
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_inquiry_update_columns();
