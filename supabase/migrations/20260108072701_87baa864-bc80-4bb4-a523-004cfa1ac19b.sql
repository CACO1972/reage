-- Create payments table for Flow transactions
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    flow_order TEXT,
    flow_token TEXT,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CLP',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_type TEXT NOT NULL DEFAULT 'premium_analysis',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add premium_credits column to profiles for tracking purchased analyses
ALTER TABLE public.profiles 
ADD COLUMN premium_credits INTEGER NOT NULL DEFAULT 0;

-- Add basic_credits column for the bonus basic analysis
ALTER TABLE public.profiles 
ADD COLUMN basic_credits INTEGER NOT NULL DEFAULT 1;

-- Add coupon tracking
CREATE TABLE public.user_coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    coupon_code TEXT NOT NULL,
    coupon_type TEXT NOT NULL DEFAULT 'clinica_miro_25',
    discount_percent INTEGER NOT NULL DEFAULT 25,
    original_value INTEGER NOT NULL DEFAULT 49000,
    expires_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for coupons
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupons" 
ON public.user_coupons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert coupons" 
ON public.user_coupons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);