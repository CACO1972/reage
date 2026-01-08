-- Create function to increment credits atomically
CREATE OR REPLACE FUNCTION public.increment_credits(
  p_user_id UUID,
  p_premium INTEGER DEFAULT 0,
  p_basic INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    premium_credits = premium_credits + p_premium,
    basic_credits = basic_credits + p_basic,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;