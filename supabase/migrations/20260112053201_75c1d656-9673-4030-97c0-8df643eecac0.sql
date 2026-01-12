-- Tabla para citas de evaluación presencial en Clínica Miro
CREATE TABLE public.clinic_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Datos del paciente
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_rut TEXT,
  
  -- Datos de la cita
  professional_id INTEGER NOT NULL, -- ID en Dentalink
  professional_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  
  -- Estado y pagos
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'confirmed_dentalink', 'cancelled', 'completed', 'no_show')),
  payment_id UUID REFERENCES public.payments(id),
  
  -- IDs externos
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  dentalink_patient_id INTEGER,
  dentalink_appointment_id INTEGER,
  
  -- Políticas y metadatos
  cancellation_policy_accepted BOOLEAN NOT NULL DEFAULT true,
  amount_clp INTEGER NOT NULL DEFAULT 39200,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinic_appointments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own appointments"
  ON public.clinic_appointments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
  ON public.clinic_appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON public.clinic_appointments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_clinic_appointments_updated_at
  BEFORE UPDATE ON public.clinic_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_clinic_appointments_user_id ON public.clinic_appointments(user_id);
CREATE INDEX idx_clinic_appointments_status ON public.clinic_appointments(status);
CREATE INDEX idx_clinic_appointments_date ON public.clinic_appointments(appointment_date);