-- SIPAT Photo Drive — schema inicial
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  date          date,
  location      text,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  is_listed     boolean NOT NULL DEFAULT true,
  qr_code_token text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS albums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS albums_event_id_idx ON albums(event_id);

CREATE TABLE IF NOT EXISTS photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id    uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_name   text NOT NULL,
  file_path   text NOT NULL UNIQUE,
  thumb_path  text,
  file_size   integer NOT NULL CHECK (file_size > 0),
  mime_type   text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photos_event_uploaded_idx ON photos(event_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS photos_album_uploaded_idx ON photos(album_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS uploads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id      uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  upload_status text NOT NULL DEFAULT 'completed' CHECK (upload_status IN ('completed', 'failed')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS uploads_photo_id_idx ON uploads(photo_id);

CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
  ('org_name',         'SIPAT'),
  ('contact_email',    ''),
  ('contact_phone',    ''),
  ('contact_address',  ''),
  ('social_instagram', ''),
  ('social_facebook',  ''),
  ('social_linkedin',  ''),
  ('social_youtube',   ''),
  ('retention_days',   '0'),
  ('privacy_notice',   'As fotografias enviadas nesta plataforma serão utilizadas exclusivamente para registro e divulgação interna da SIPAT (Semana Interna de Prevenção de Acidentes do Trabalho), conforme a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018). Ao enviar uma foto, você declara ter autorização das pessoas nela retratadas. Você pode solicitar a remoção de qualquer imagem entrando em contato com a organização do evento. As imagens são mantidas pelo período definido pela organização e depois excluídas.')
ON CONFLICT (key) DO NOTHING;
