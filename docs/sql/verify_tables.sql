-- Verify tables exist
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'user_interests', 'user_goals', 'astrological_profiles', 'lifestyle_preferences')
ORDER BY table_name;

-- Test basic query on profiles table
SELECT COUNT(*) as profile_count FROM profiles;