-- AdminPanel V2: Enterprise-Grade Control System
-- Adds: Moderation, Audit Logs, System Settings

-- ============================================================================
-- STEP 1: REPORTS TABLE (Moderation System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'room')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_target CHECK (
    (target_type = 'user' AND target_id IN (SELECT id FROM auth.users)) OR
    (target_type = 'room' AND target_id IN (SELECT id FROM rooms))
  )
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- RLS for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "admins_can_view_all_reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "users_can_create_reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "admins_can_update_reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 2: AUDIT_LOGS TABLE (Accountability)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id UUID,
  target_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- RLS for audit_logs (admin-only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_view_audit_logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "system_can_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- STEP 3: SYSTEM_SETTINGS TABLE (Real Configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);

-- RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_can_read_settings" ON system_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "admins_can_update_settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default system settings
INSERT INTO system_settings (key, value, type, description) VALUES
  ('max_room_size', '50', 'number', 'Maximum users per study room'),
  ('timer_min_duration', '60', 'number', 'Minimum timer duration in seconds'),
  ('timer_max_duration', '14400', 'number', 'Maximum timer duration in seconds'),
  ('allowed_domains', '[]', 'json', 'List of allowed email domains (empty = all allowed)'),
  ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
  ('require_email_verification', 'false', 'boolean', 'Require email verification before joining'),
  ('max_rooms_per_user', '10', 'number', 'Maximum rooms a user can create'),
  ('session_inactivity_timeout', '1800', 'number', 'Session timeout in seconds')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 4: HELPER FUNCTIONS
-- ============================================================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_audit_action(
  p_action TEXT,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    action,
    actor_id,
    target_id,
    target_type,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_action,
    auth.uid(),
    p_target_id,
    p_target_type,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system setting
CREATE OR REPLACE FUNCTION get_system_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value FROM system_settings WHERE key = setting_key;
  RETURN COALESCE(v_value, NULL);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if setting is enabled
CREATE OR REPLACE FUNCTION is_setting_enabled(setting_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(get_system_setting(setting_key)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 5: TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================================================

-- Trigger: Log user role changes
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM log_audit_action(
      'user_role_changed',
      NEW.id,
      'user',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  END IF;
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_audit_action(
      'user_status_changed',
      NEW.id,
      'user',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profile_audit_trigger ON profiles;
CREATE TRIGGER profile_audit_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_changes();

-- Trigger: Log room deletions
CREATE OR REPLACE FUNCTION audit_room_deletion()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_action(
    'room_deleted',
    OLD.id,
    'room',
    jsonb_build_object(
      'room_name', OLD.name,
      'room_code', OLD.code
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS room_delete_audit_trigger ON rooms;
CREATE TRIGGER room_delete_audit_trigger
  BEFORE DELETE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION audit_room_deletion();

-- ============================================================================
-- STEP 6: REALTIME SUBSCRIPTIONS SETUP
-- ============================================================================

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS reports;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS system_settings;

-- ============================================================================
-- DONE
-- ============================================================================
GRANT EXECUTE ON FUNCTION log_audit_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_setting TO authenticated;
GRANT EXECUTE ON FUNCTION is_setting_enabled TO authenticated;
