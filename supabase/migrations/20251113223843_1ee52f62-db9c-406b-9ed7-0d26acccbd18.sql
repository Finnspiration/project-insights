-- Fix missing user profiles for existing users
INSERT INTO user_profiles (id, preferred_language, subscription_tier, ai_messages_used_this_month)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'preferred_language', 'en'),
  'free',
  0
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Ensure the trigger exists for future users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();