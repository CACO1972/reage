-- Create app_role enum for future role management
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create plan and user_type enums
CREATE TYPE public.user_plan AS ENUM ('free', 'premium', 'pro');
CREATE TYPE public.user_type AS ENUM ('patient', 'pro');
CREATE TYPE public.analysis_mode AS ENUM ('freemium', 'premium');
CREATE TYPE public.status_3d AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_type NOT NULL DEFAULT 'patient',
    plan public.user_plan NOT NULL DEFAULT 'free',
    age_range TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analyses table (core dental-facial analysis)
CREATE TABLE public.analyses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    mode public.analysis_mode NOT NULL DEFAULT 'freemium',
    
    -- Images
    frontal_rest_url TEXT,
    frontal_smile_url TEXT,
    
    -- Facial metrics (Perfect Corp)
    facial_symmetry_score NUMERIC,
    facial_midline_deviation_mm NUMERIC,
    facial_thirds_ratio JSONB,
    
    -- Smile/dental metrics
    smile_score NUMERIC,
    midline_deviation_mm NUMERIC,
    gingival_display_mm NUMERIC,
    buccal_corridor_left NUMERIC,
    buccal_corridor_right NUMERIC,
    
    -- Raw AI payload storage
    raw_ai_payload JSONB DEFAULT '{}'::jsonb
);

-- Create analysis_3d table
CREATE TABLE public.analysis_3d (
    analysis_id uuid PRIMARY KEY REFERENCES public.analyses(id) ON DELETE CASCADE,
    wavespeed_task_id TEXT,
    status_3d public.status_3d NOT NULL DEFAULT 'pending',
    model_glb_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('simetria-images', 'simetria-images', false);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_3d ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Analyses RLS policies
CREATE POLICY "Users can view own analyses" ON public.analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses" ON public.analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Analysis 3D RLS policies (via analyses ownership)
CREATE POLICY "Users can view own 3D analyses" ON public.analysis_3d
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_3d.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own 3D analyses" ON public.analysis_3d
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_3d.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own 3D analyses" ON public.analysis_3d
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_3d.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

-- Storage policies for simetria-images bucket
CREATE POLICY "Users can upload own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'simetria-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'simetria-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'simetria-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, role, plan)
    VALUES (new.id, 'patient', 'free');
    RETURN new;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_3d_updated_at
    BEFORE UPDATE ON public.analysis_3d
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();