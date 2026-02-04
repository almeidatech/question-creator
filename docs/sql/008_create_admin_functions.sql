-- ============================================================================
-- Admin Dashboard Helper Functions
-- ============================================================================
-- PostgreSQL functions for admin dashboard statistics
-- ============================================================================

-- ============================================================================
-- Function: Get database size in MB
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_database_size_mb()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size_mb NUMERIC;
BEGIN
  SELECT
    ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0, 2)
  INTO db_size_mb;

  RETURN db_size_mb;
END;
$$;

COMMENT ON FUNCTION public.get_database_size_mb() IS 'Returns the current database size in megabytes';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_database_size_mb() TO authenticated;

-- ============================================================================
-- Function: Get database uptime in hours
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_database_uptime_hours()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uptime_hours NUMERIC;
BEGIN
  SELECT
    ROUND(EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) / 3600.0, 2)
  INTO uptime_hours;

  RETURN uptime_hours;
END;
$$;

COMMENT ON FUNCTION public.get_database_uptime_hours() IS 'Returns database uptime in hours since last restart';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_database_uptime_hours() TO authenticated;

-- ============================================================================
-- Function: Get active database connections
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_active_connections()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO connection_count
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND state = 'active'
    AND pid != pg_backend_pid(); -- Exclude current connection

  RETURN connection_count;
END;
$$;

COMMENT ON FUNCTION public.get_active_connections() IS 'Returns the number of active database connections (excluding current)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_active_connections() TO authenticated;

-- ============================================================================
-- Test the functions (optional)
-- ============================================================================

-- SELECT public.get_database_size_mb() as db_size_mb;
-- SELECT public.get_database_uptime_hours() as uptime_hours;
-- SELECT public.get_active_connections() as active_connections;

