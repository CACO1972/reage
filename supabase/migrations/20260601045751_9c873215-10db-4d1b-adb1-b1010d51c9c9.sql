DROP POLICY IF EXISTS "Service can insert coupons" ON public.user_coupons;

ALTER TABLE public.user_coupons
  DROP CONSTRAINT IF EXISTS valid_discount,
  ADD CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100);

ALTER TABLE public.user_coupons
  DROP CONSTRAINT IF EXISTS valid_value,
  ADD CONSTRAINT valid_value CHECK (original_value >= 0);