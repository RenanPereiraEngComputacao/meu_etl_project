CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (username, password_hash)
VALUES (
  'usuarioaqui',
  crypt('senhaaqui', gen_salt('bf'))
);