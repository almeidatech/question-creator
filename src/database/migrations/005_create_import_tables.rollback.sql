-- Rollback: 005_create_import_tables
-- ============================================================================

-- Drop functions
DROP FUNCTION IF EXISTS get_import_progress(UUID);
DROP FUNCTION IF EXISTS rollback_import(UUID);
DROP FUNCTION IF EXISTS get_import_history(UUID, INT);

-- Drop tables
DROP TABLE IF EXISTS import_question_mapping;
DROP TABLE IF EXISTS question_imports;

-- Drop ENUM type
DROP TYPE IF EXISTS import_status_enum;
