/*
  # Configuração de autenticação e usuários administrativos

  1. Configuração
    - Habilita autenticação por email/senha
    - Desabilita confirmação de email para facilitar desenvolvimento
    - Cria usuário administrativo padrão

  2. Segurança
    - Configura políticas RLS para tabelas administrativas
    - Garante que apenas usuários autenticados possam gerenciar dados
*/

-- Inserir usuário administrativo padrão (se não existir)
DO $$
BEGIN
  -- Verificar se o usuário admin já existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@clinica.com'
  ) THEN
    -- Inserir usuário admin
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@clinica.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- Atualizar políticas RLS para usar auth.uid()
DROP POLICY IF EXISTS "Authenticated users full access medicos" ON medicos;
CREATE POLICY "Authenticated users full access medicos"
  ON medicos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Insert medicos by owner" ON medicos;
CREATE POLICY "Insert medicos by owner"
  ON medicos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

DROP POLICY IF EXISTS "Update own medico" ON medicos;
CREATE POLICY "Update own medico"
  ON medicos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = criado_por)
  WITH CHECK (auth.uid() = criado_por);

DROP POLICY IF EXISTS "Delete own medico" ON medicos;
CREATE POLICY "Delete own medico"
  ON medicos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = criado_por);

-- Políticas similares para especialidades
DROP POLICY IF EXISTS "Insert especialidades by owner" ON especialidades;
CREATE POLICY "Insert especialidades by owner"
  ON especialidades
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

-- Políticas similares para convenios
DROP POLICY IF EXISTS "Insert convenios by owner" ON convenios;
CREATE POLICY "Insert convenios by owner"
  ON convenios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

-- Política para agenda
DROP POLICY IF EXISTS "Insert agenda by owner" ON agenda;
CREATE POLICY "Insert agenda by owner"
  ON agenda
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medicos 
      WHERE medicos.id = agenda.medico_id 
      AND medicos.criado_por = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Read agenda" ON agenda;
CREATE POLICY "Read agenda"
  ON agenda
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medicos 
      WHERE medicos.id = agenda.medico_id 
      AND medicos.criado_por = auth.uid()
    )
  );

-- Política para agendamentos
DROP POLICY IF EXISTS "Read own agendamentos" ON agendamentos;
CREATE POLICY "Read own agendamentos"
  ON agendamentos
  FOR SELECT
  TO authenticated
  USING (true); -- Permitir leitura de todos os agendamentos para administradores