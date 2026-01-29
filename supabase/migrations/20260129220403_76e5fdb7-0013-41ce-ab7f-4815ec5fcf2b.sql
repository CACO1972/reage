-- Create promo_codes table for campaign codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  benefit_type TEXT NOT NULL DEFAULT 'premium_report',
  max_uses INTEGER NOT NULL DEFAULT 1,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create redemptions table to track who used what code
CREATE TABLE public.promo_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_id UUID REFERENCES public.analyses(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id) -- Each user can only use each code once
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Promo codes: anyone can read active codes (to validate), only admins can manage
CREATE POLICY "Anyone can check promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true);

-- Redemptions: users can see their own redemptions
CREATE POLICY "Users can view own redemptions" 
ON public.promo_code_redemptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions" 
ON public.promo_code_redemptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for fast code lookup
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_redemptions_user ON public.promo_code_redemptions(user_id);