-- Website login sessions table for Telegram bot authentication
CREATE TABLE IF NOT EXISTS website_login_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    login_token TEXT NOT NULL UNIQUE,
    telegram_id TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL DEFAULT 'jamolstroy_web',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Indexes
    CONSTRAINT unique_active_session_per_token UNIQUE (login_token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_token ON website_login_sessions(login_token);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_telegram_id ON website_login_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_status ON website_login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_expires_at ON website_login_sessions(expires_at);

-- Add RLS policies
ALTER TABLE website_login_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for reading login sessions (for checking status)
CREATE POLICY "Anyone can read login sessions" ON website_login_sessions
    FOR SELECT USING (true);

-- Policy for inserting login sessions (for creating new sessions)
CREATE POLICY "Anyone can create login sessions" ON website_login_sessions
    FOR INSERT WITH CHECK (true);

-- Policy for updating login sessions (for approving/rejecting)
CREATE POLICY "Anyone can update login sessions" ON website_login_sessions
    FOR UPDATE USING (true);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_login_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM website_login_sessions 
    WHERE expires_at < NOW() 
    OR (status = 'pending' AND created_at < NOW() - INTERVAL '10 minutes');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions (if pg_cron is available)
-- This will run every 5 minutes to clean up expired sessions
-- SELECT cron.schedule('cleanup-login-sessions', '*/5 * * * *', 'SELECT cleanup_expired_login_sessions();');

-- Add email column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    END IF;
END $$;

-- Update users table to allow multiple login methods
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_login_method_check 
    CHECK (
        telegram_id IS NOT NULL OR 
        phone_number IS NOT NULL OR 
        email IS NOT NULL
    );

-- Add comment to table
COMMENT ON TABLE website_login_sessions IS 'Stores temporary login sessions for website authentication via Telegram bot';
COMMENT ON COLUMN website_login_sessions.login_token IS 'Unique token for identifying the login session';
COMMENT ON COLUMN website_login_sessions.telegram_id IS 'Telegram user ID who is trying to login';
COMMENT ON COLUMN website_login_sessions.user_id IS 'Reference to the user account after successful authentication';
COMMENT ON COLUMN website_login_sessions.client_id IS 'Client identifier (e.g., jamolstroy_web)';
COMMENT ON COLUMN website_login_sessions.status IS 'Current status of the login session';
COMMENT ON COLUMN website_login_sessions.expires_at IS 'When this login session expires';
