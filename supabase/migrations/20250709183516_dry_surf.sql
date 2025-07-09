/*
  # Create medical system tables

  1. New Tables
    - `especialidades` (specialties)
      - `id` (uuid, primary key)
      - `nome` (text, unique)
    - `convenios` (insurances)
      - `id` (uuid, primary key) 
      - `nome` (text, unique)
    - `medicos` (doctors)
      - `id` (uuid, primary key)
      - `nome` (text)
      - `crm` (text, unique)
      - `especialidade_id` (uuid, foreign key)
      - `criado_por` (uuid, foreign key to users)
    - `medico_convenios` (doctor_insurances junction)
      - `id` (uuid, primary key)
      - `medico_id` (uuid, foreign key)
      - `convenio_id` (uuid, foreign key)
    - `agenda` (working_hours)
      - `id` (uuid, primary key)
      - `medico_id` (uuid, foreign key)
      - `dia_semana` (text, check constraint)
      - `horario_inicio` (time)
      - `horario_fim` (time)
    - `usuarios` (patients)
      - `id` (uuid, primary key)
      - `nome` (text)
      - `data_nascimento` (date)
      - `cidade` (text)
      - `contato` (text)
    - `agendamentos` (appointments)
      - `id` (uuid, primary key)
      - `usuario_id` (uuid, foreign key)
      - `medico_id` (uuid, foreign key)
      - `data` (date)
      - `horario` (time)
      - `convenio_id` (uuid, foreign key)
      - `criado_em` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (for booking system)
    - Add policies for authenticated users (admin functions)
*/

-- Create tables (already exist based on schema provided)
-- Just ensure RLS is enabled and add policies

ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medico_convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Public read access for booking system
CREATE POLICY "Public can read especialidades" ON especialidades FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read convenios" ON convenios FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read medicos" ON medicos FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read medico_convenios" ON medico_convenios FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read agenda" ON agenda FOR SELECT TO anon USING (true);

-- Public can insert appointments and users (for booking)
CREATE POLICY "Public can insert usuarios" ON usuarios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can insert agendamentos" ON agendamentos FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users (admin) have full access
CREATE POLICY "Authenticated users full access especialidades" ON especialidades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access convenios" ON convenios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access medicos" ON medicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access medico_convenios" ON medico_convenios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access agenda" ON agenda FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access usuarios" ON usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access agendamentos" ON agendamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);