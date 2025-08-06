-- ClosetAssistant Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create clothing_items table
CREATE TABLE clothing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory')),
  color TEXT NOT NULL CHECK (color IN ('black', 'white', 'gray', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'orange')),
  seasons TEXT[] NOT NULL DEFAULT '{}', -- ['spring', 'summer', 'fall', 'winter']
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_outfits table
CREATE TABLE saved_outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_ids UUID[] NOT NULL DEFAULT '{}', -- Array of clothing_items IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wear_logs table
CREATE TABLE wear_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES saved_outfits(id) ON DELETE SET NULL,
  item_ids UUID[] NOT NULL DEFAULT '{}', -- Array of clothing_items IDs
  worn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_type ON clothing_items(type);
CREATE INDEX idx_clothing_items_color ON clothing_items(color);
CREATE INDEX idx_saved_outfits_user_id ON saved_outfits(user_id);
CREATE INDEX idx_wear_logs_user_id ON wear_logs(user_id);
CREATE INDEX idx_wear_logs_worn_date ON wear_logs(worn_date);

-- Row Level Security (RLS) Policies
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wear_logs ENABLE ROW LEVEL SECURITY;

-- Policies for clothing_items
CREATE POLICY "Users can view their own clothing items" ON clothing_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clothing items" ON clothing_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clothing items" ON clothing_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clothing items" ON clothing_items
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for saved_outfits
CREATE POLICY "Users can view their own saved outfits" ON saved_outfits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved outfits" ON saved_outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved outfits" ON saved_outfits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved outfits" ON saved_outfits
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for wear_logs
CREATE POLICY "Users can view their own wear logs" ON wear_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wear logs" ON wear_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wear logs" ON wear_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wear logs" ON wear_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public) VALUES ('clothing-images', 'clothing-images', true);

-- Create storage policy for clothing images
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);