-- =====================================================================
-- ETAPA 1 - MODULO EDUCATIVO
-- Creacion de la tabla contenido_educativo (NO elimina ni altera tablas
-- ni columnas existentes). Idempotente: seguro de re-ejecutar.
-- =====================================================================

CREATE TABLE IF NOT EXISTS contenido_educativo (
  id_contenido INT NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  categoria ENUM('cuidado','normas','proceso','general') NOT NULL DEFAULT 'general',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden INT NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_contenido),
  KEY idx_contenido_categoria (categoria),
  KEY idx_contenido_activo_orden (activo, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
