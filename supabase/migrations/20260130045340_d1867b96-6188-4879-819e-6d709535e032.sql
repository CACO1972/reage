-- Add a separate column to store AI smile simulation URL
ALTER TABLE public.analyses
ADD COLUMN IF NOT EXISTS smile_simulation_url TEXT;

-- Backfill: if frontal_smile_url currently points to a generated simulation, copy it into the new column
UPDATE public.analyses
SET smile_simulation_url = frontal_smile_url
WHERE smile_simulation_url IS NULL
  AND frontal_smile_url IS NOT NULL
  AND frontal_smile_url LIKE '%/smile-simulations/%';
