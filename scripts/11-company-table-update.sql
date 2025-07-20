-- Update company table structure
ALTER TABLE company ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE company ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE company ADD COLUMN IF NOT EXISTS time TEXT;

-- Insert default company data
INSERT INTO company (name, version, logo_url, phone_number, location, time, social_telegram, social_x, social_youtube, social_instagram, is_active)
VALUES (
  'JamolStroy',
  '1.0.0',
  '/placeholder-logo.svg',
  '+998 90 123 45 67',
  'Toshkent, O''zbekiston',
  'Dush-Juma: 9:00-18:00',
  '@jamolstroy',
  '@jamolstroy',
  '@jamolstroy',
  '@jamolstroy',
  true
) ON CONFLICT (version) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  phone_number = EXCLUDED.phone_number,
  location = EXCLUDED.location,
  time = EXCLUDED.time,
  social_telegram = EXCLUDED.social_telegram,
  social_x = EXCLUDED.social_x,
  social_youtube = EXCLUDED.social_youtube,
  social_instagram = EXCLUDED.social_instagram,
  is_active = EXCLUDED.is_active;
