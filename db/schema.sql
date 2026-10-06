-- ============================================================
-- BRChain — Schema MySQL (8.0+)
-- Porte do schema Supabase/Postgres para MySQL.
-- Execute uma vez no banco de destino:
--   mysql -h HOST -u USER -p BANCO < db/schema.sql
-- ============================================================

SET NAMES utf8mb4;

-- ---- Tabela: moderators --------------------------------------------
-- Substitui o `auth.users` do Supabase. O login do painel de curadoria
-- é validado contra esta tabela (senha com hash bcrypt).
CREATE TABLE IF NOT EXISTS moderators (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- Tabela: news --------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  external_id    VARCHAR(512) NOT NULL,               -- evita duplicata (dedupe)
  title          TEXT         NOT NULL,
  source         VARCHAR(255) NULL,
  url            TEXT         NOT NULL,
  image_url      TEXT         NULL,
  published_at   DATETIME     NULL,
  summary        TEXT         NULL,
  summary_edited TEXT         NULL,                    -- resumo editado pelo moderador
  category       VARCHAR(120) NULL,                    -- tema de saúde (definido na ingestão)
  status         ENUM('pending','approved','archived') NOT NULL DEFAULT 'pending',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY news_external_id_uq (external_id),
  KEY news_status_idx (status),
  KEY news_published_at_idx (published_at),
  KEY news_category_idx (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- Tabela: audit_log (imutável) ----------------------------------
-- Nunca é atualizada nem apagada pela aplicação (registro de auditoria).
CREATE TABLE IF NOT EXISTS audit_log (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  news_id      CHAR(36) NOT NULL,
  moderator_id CHAR(36) NOT NULL,
  action       ENUM('approved','rejected') NOT NULL,
  snapshot     JSON     NOT NULL,                       -- o que foi editado/decidido
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY audit_log_news_id_idx (news_id),
  CONSTRAINT audit_log_news_fk
    FOREIGN KEY (news_id) REFERENCES news (id) ON DELETE CASCADE,
  CONSTRAINT audit_log_moderator_fk
    FOREIGN KEY (moderator_id) REFERENCES moderators (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Observações (equivalência com o modelo Supabase anterior)
-- ------------------------------------------------------------
-- • RLS (Row Level Security): o MySQL não tem RLS. A autorização passou
--   a ser feita na APLICAÇÃO:
--     - anônimo lê SOMENTE status='approved' (getApprovedNews / /api/news);
--     - o moderador autenticado (cookie de sessão assinado) lê tudo e
--       altera status/resumo em src/app/admin/actions.ts.
-- • updated_at é mantido automaticamente por ON UPDATE CURRENT_TIMESTAMP
--   (a aplicação também o seta explicitamente nos updates).
-- • O moderador é criado fora do produto (sem tela de cadastro):
--     node scripts/create-moderator.mjs email@dominio.com "SenhaForte"
-- ============================================================
