-- 022_auto_approve_on_email_confirm.sql
-- Performers landed on status 'pending' and stayed invisible until an admin
-- flipped them to 'approved'. Now that registration requires a confirmed email
-- address, that manual step goes away: confirming the address approves the
-- profile.
--
-- What this does NOT do is remove moderation. Admins keep the ability to set
-- 'rejected' — the trigger only ever promotes 'pending', so a profile an admin
-- has taken down stays down, and email confirmation happens once per account
-- so there is no path back to 'approved' through this trigger.

CREATE OR REPLACE FUNCTION public.approve_performer_on_email_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.performers
      SET status = 'approved'
      WHERE id = NEW.id
        AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_email_confirmed_approve_performer
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.approve_performer_on_email_confirm();

-- Google sign-ups arrive already confirmed, so they are an INSERT with
-- email_confirmed_at already set and the UPDATE trigger above never fires for
-- them. handle_new_user (003_triggers.sql) is therefore extended to decide the
-- starting status instead of always defaulting to 'pending'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'performer' THEN
    INSERT INTO public.performers (id, stage_name, type, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'stage_name', 'Unnamed'),
      COALESCE(NEW.raw_user_meta_data->>'type', 'singer'),
      CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'approved' ELSE 'pending' END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Existing performers who are already confirmed but still sitting on 'pending'
-- would otherwise wait forever, since nobody is doing approvals any more and
-- their confirmation already happened. Deliberately skips 'rejected'.
UPDATE public.performers p
SET status = 'approved'
FROM auth.users u
WHERE u.id = p.id
  AND p.status = 'pending'
  AND u.email_confirmed_at IS NOT NULL;
