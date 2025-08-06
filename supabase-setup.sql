-- ClosetAssistant Database Schema
-- Run this SQL in your Supabase SQL Editor (Fixed Version)

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

-- ===============================================
-- OUTFIT TABLES (for outfit suggestions & saves)
-- ===============================================

-- Create outfits table
CREATE TABLE outfits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create outfit_items junction table
CREATE TABLE outfit_items (
    outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
    item_id UUID REFERENCES clothing_items(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('top', 'bottom', 'shoes', 'accessory')),
    PRIMARY KEY (outfit_id, item_id)
);

-- Create wear_logs table
CREATE TABLE wear_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE NOT NULL,
    worn_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX idx_wear_logs_user_id_date ON wear_logs(user_id, worn_date);

-- Enable RLS for outfit tables
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wear_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for outfits
CREATE POLICY "Users can only see their own outfits" ON outfits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own outfits" ON outfits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own outfits" ON outfits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own outfits" ON outfits
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for outfit_items
CREATE POLICY "Users can only see outfit_items for their outfits" ON outfit_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM outfits 
            WHERE outfits.id = outfit_items.outfit_id 
            AND outfits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only insert outfit_items for their outfits" ON outfit_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM outfits 
            WHERE outfits.id = outfit_items.outfit_id 
            AND outfits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only delete outfit_items for their outfits" ON outfit_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM outfits 
            WHERE outfits.id = outfit_items.outfit_id 
            AND outfits.user_id = auth.uid()
        )
    );

-- RLS policies for wear_logs
CREATE POLICY "Users can only see their own wear logs" ON wear_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own wear logs" ON wear_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own wear logs" ON wear_logs
    FOR DELETE USING (auth.uid() = user_id);