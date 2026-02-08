-- 1. Tabla de sujetos
CREATE TABLE IF NOT EXISTS armonia_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    filename TEXT UNIQUE NOT NULL,
    gender TEXT,
    ethnicity TEXT,
    dataset_category TEXT,
    dataset_source TEXT DEFAULT 'SCUT-FBP5500'
);

-- 2. Tabla de proporciones faciales
CREATE TABLE IF NOT EXISTS armonia_proportions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES armonia_subjects(id) ON DELETE CASCADE,
    face_ratio FLOAT,
    interocular_ratio FLOAT,
    nose_ratio FLOAT,
    mouth_ratio FLOAT,
    symmetry_score FLOAT,
    middle_to_lower FLOAT,
    phi_approximation FLOAT,
    UNIQUE(subject_id)
);

-- 3. Tabla de beauty scores
CREATE TABLE IF NOT EXISTS armonia_beauty_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES armonia_subjects(id) ON DELETE CASCADE,
    mean_score FLOAT NOT NULL,
    std_score FLOAT,
    min_score FLOAT,
    max_score FLOAT,
    score_range FLOAT,
    num_raters INT DEFAULT 60,
    UNIQUE(subject_id)
);

-- 4. Tabla de correlaciones
CREATE TABLE IF NOT EXISTS armonia_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metric_name TEXT NOT NULL,
    correlation_r FLOAT NOT NULL,
    sample_size INT,
    is_significant BOOLEAN,
    context_filter JSONB DEFAULT '{}'::jsonb
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_subjects_ethnicity ON armonia_subjects(ethnicity);
CREATE INDEX IF NOT EXISTS idx_subjects_gender ON armonia_subjects(gender);
CREATE INDEX IF NOT EXISTS idx_beauty_mean ON armonia_beauty_scores(mean_score);

-- 6. Vista completa
CREATE OR REPLACE VIEW armonia_complete_view AS
SELECT 
    s.id,
    s.filename,
    s.gender,
    s.ethnicity,
    s.dataset_category,
    b.mean_score,
    b.std_score,
    b.score_range,
    p.face_ratio,
    p.symmetry_score,
    p.phi_approximation
FROM armonia_subjects s
LEFT JOIN armonia_beauty_scores b ON s.id = b.subject_id
LEFT JOIN armonia_proportions p ON s.id = p.subject_id;

-- 7. RLS - Habilitar en todas las tablas
ALTER TABLE armonia_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE armonia_proportions ENABLE ROW LEVEL SECURITY;
ALTER TABLE armonia_beauty_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE armonia_correlations ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de lectura pública (datos de investigación)
CREATE POLICY "Public read access for research data" ON armonia_subjects FOR SELECT USING (true);
CREATE POLICY "Public read access for proportions" ON armonia_proportions FOR SELECT USING (true);
CREATE POLICY "Public read access for beauty scores" ON armonia_beauty_scores FOR SELECT USING (true);
CREATE POLICY "Public read access for correlations" ON armonia_correlations FOR SELECT USING (true);

-- 9. Políticas de escritura solo para admins
CREATE POLICY "Admin insert subjects" ON armonia_subjects FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update subjects" ON armonia_subjects FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete subjects" ON armonia_subjects FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert proportions" ON armonia_proportions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update proportions" ON armonia_proportions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete proportions" ON armonia_proportions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert beauty_scores" ON armonia_beauty_scores FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update beauty_scores" ON armonia_beauty_scores FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete beauty_scores" ON armonia_beauty_scores FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert correlations" ON armonia_correlations FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update correlations" ON armonia_correlations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete correlations" ON armonia_correlations FOR DELETE USING (public.has_role(auth.uid(), 'admin'));