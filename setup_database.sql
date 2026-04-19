-- 1. Profiles table (Doctors & Patients)
-- UPDATE: Added phone_number and assigned_doctor_id
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('patient', 'doctor')),
  phone_number TEXT,
  assigned_doctor_id UUID REFERENCES profiles(id),
  affiliation TEXT, -- For doctors
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Logs table (Sugar levels, diet, etc.)
CREATE TABLE logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sugar_level DECIMAL,
  notes TEXT,
  status TEXT, -- 'Высокий', 'Норма', 'Низкий'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Reminders table
CREATE TABLE reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  time TEXT, -- Stores ISO string or specific format
  type TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Chat Messages
-- UPDATE: Added is_sos and is_system for special alerts
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT,
  is_sos BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MIGRATION SCRIPT (For existing users, run this if profiles already exists)
/*
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID REFERENCES profiles(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_sos BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
*/

-- TRIGGER FOR NEW USER PROFILE
-- UPDATE: Handle phone_number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone_number, affiliation, description)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'affiliation',
    new.raw_user_meta_data->>'description'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile for every new user created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
