-- Website login sessions table
CREATE TABLE IF NOT EXISTS website_login_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    login_token TEXT NOT NULL UNIQUE,
    telegram_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id TEXT DEFAULT 'jamolstroy_web',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT unique_active_session UNIQUE (telegram_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_token ON website_login_sessions(login_token);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_telegram_id ON website_login_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_status ON website_login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_expires_at ON website_login_sessions(expires_at);

-- Add email column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add index for email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_login_sessions()
RETURNS void AS $$
BEGIN
    UPDATE website_login_sessions 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS trigger AS $$
BEGIN
    PERFORM cleanup_expired_login_sessions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS cleanup_expired_sessions_trigger ON website_login_sessions;

-- Create trigger that runs on insert
CREATE TRIGGER cleanup_expired_sessions_trigger
    AFTER INSERT ON website_login_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- Add RLS policies
ALTER TABLE website_login_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own sessions
CREATE POLICY "Users can access their own login sessions" ON website_login_sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Policy for service role to manage all sessions
CREATE POLICY "Service role can manage all login sessions" ON website_login_sessions
    FOR ALL USING (auth.role() = 'service_role');
