CREATE USER convertr WITH PASSWORD 'U3R5bGV6ZWUwOTg3';

----------------------------------------------------------

GRANT CONNECT ON DATABASE styintermed TO convertr;

GRANT USAGE ON SCHEMA public TO convertr;

-- Permissão de SELECT e INSERT em todas as tabelas já existentes
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO convertr;

----------------------------------------------------------

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE ON TABLES TO convertr;

----------------------------------------------------------

REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM convertr;

----------------------------------------------------------

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE DELETE ON TABLES FROM convertr;

-- Permissão total nas tabelas
GRANT SELECT, INSERT, UPDATE ON TABLE orders TO convertr;
GRANT SELECT, INSERT, UPDATE ON TABLE order_itens TO convertr;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE order_itens TO convertr;

REVOKE DELETE ON TABLE orders FROM convertr;
REVOKE DELETE ON TABLE order_itens FROM convertr;

