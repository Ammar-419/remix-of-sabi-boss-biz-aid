-- Add new fields to profiles table for enhanced signup
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS business_location text,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.business_type IS 'Type of business: Trader, Shop Owner, Service Provider, Farmer, Other';
COMMENT ON COLUMN public.profiles.business_location IS 'City or Market name where business operates';
COMMENT ON COLUMN public.profiles.preferred_language IS 'Preferred language: en, pidgin, ha, yo, ig';