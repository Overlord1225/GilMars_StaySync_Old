-- Deactivating an account now needs a reason, and the account holder can read it.
-- The reason is shown on the sign-in screen when a deactivated person tries to log in.
-- Rules enforced here, not in the app:
--   * active -> inactive: a reason of at least 3 characters must be set in the same update
--   * inactive -> active: the reason and timestamp are cleared
--   * any other update: the reason cannot be edited (stops people rewriting it)
-- Who may change is_active is still decided by prevent_profile_privilege_escalation
-- (migration 0008) and the profiles update policies.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deactivation_reason text,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE OR REPLACE FUNCTION public.apply_profile_deactivation_reason()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF OLD.is_active AND NOT NEW.is_active THEN
    NEW.deactivation_reason := NULLIF(BTRIM(NEW.deactivation_reason), '');
    IF NEW.deactivation_reason IS NULL OR char_length(NEW.deactivation_reason) < 3 THEN
      RAISE EXCEPTION 'A reason of at least 3 characters is required to deactivate an account'
        USING ERRCODE = '22023';
    END IF;
    NEW.deactivation_reason := LEFT(NEW.deactivation_reason, 500);
    NEW.deactivated_at := now();
  ELSIF NOT OLD.is_active AND NEW.is_active THEN
    NEW.deactivation_reason := NULL;
    NEW.deactivated_at := NULL;
  ELSE
    NEW.deactivation_reason := OLD.deactivation_reason;
    NEW.deactivated_at := OLD.deactivated_at;
  END IF;
  RETURN NEW;
END;
$function$;

-- Named so it fires before profiles_prevent_privilege_escalation (alphabetical order);
-- an unauthorised status change is still rejected by that trigger and rolled back.
DROP TRIGGER IF EXISTS profiles_apply_deactivation_reason ON public.profiles;
CREATE TRIGGER profiles_apply_deactivation_reason
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_profile_deactivation_reason();
