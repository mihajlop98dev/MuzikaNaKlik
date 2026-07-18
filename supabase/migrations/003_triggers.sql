-- Auto-create profile on user signup
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

  -- If performer, create performer record
  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'performer' THEN
    INSERT INTO public.performers (id, stage_name, type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'stage_name', 'Unnamed'),
      COALESCE(NEW.raw_user_meta_data->>'type', 'singer')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
