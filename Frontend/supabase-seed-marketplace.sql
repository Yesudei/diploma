-- Marketplace Seed Data
-- Run this in: Supabase Dashboard → SQL Editor

-- Insert sample marketplace items (delete or modify as needed)

-- Sample Packs (free)
insert into public.marketplace_items (seller_id, title, description, price, category, thumbnail_url, is_active, download_count) values
((select id from public.profiles limit 1), 'Free Drum Kit 2024', 'High quality drum samples for FL Studio, Ableton, and more. 50+ kicks, snares, hats, and percussion.', 0, 'sample_pack', 'https://images.unsplash.com/photo-1571974599782-87624638275e?w=400', true, 1234),
((select id from public.profiles limit 1), 'Lo-Fi Piano Loops', 'Chill piano loops perfect for lo-fi hip hop beats. Royalty free.', 0, 'sample_pack', 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400', true, 856),
((select id from public.profiles limit 1), '808 Bass Collection', 'Hard-hitting 808 bass samples. Perfect for trap and hip hop production.', 0, 'sample_pack', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400', true, 2341);

-- Presets (paid)
insert into public.marketplace_items (seller_id, title, description, price, category, thumbnail_url, is_active, download_count) values
((select id from public.profiles limit 1), 'Serum Ultimate Bass Presets', '50+ professional bass presets for Xfer Records Serum. Includes wobs, subs, plucks, and more.', 15000, 'preset', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400', true, 456),
((select id from public.profiles limit 1), 'Sylenth1 EDM Leads', 'Classic EDM lead sounds. Perfect for big room, progressive house, and electro.', 12000, 'preset', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400', true, 234),
((select id from public.profiles limit 1), 'Massive X Future Bass', 'Future bass presets for Native Instruments Massive X. Includes plucks, supersaws, and more.', 18000, 'preset', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400', true, 189);

-- Templates (paid)
insert into public.marketplace_items (seller_id, title, description, price, category, thumbnail_url, is_active, download_count) values
((select id from public.profiles limit 1), 'FL Studio Trap Template', 'Complete trap beat template in FL Studio. Includes mixer routing, effects, and automation.', 25000, 'template', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', true, 567),
((select id from public.profiles limit 1), 'Ableton Live House Template', 'Progressive house template with built-in mixing and mastering chain.', 35000, 'template', 'https://images.unsplash.com/photo-1598643229901-157534790038?w=400', true, 123),
((select id from public.profiles limit 1), 'Logic Pro Hip Hop Template', 'Boom bap hip hop template with vintage drums and analog warmth.', 20000, 'template', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400', true, 89);

-- VST Plugins (paid)
insert into public.marketplace_items (seller_id, title, description, price, category, thumbnail_url, is_active, download_count) values
((select id from public.profiles limit 1), 'Auto-Tune Pro License', 'Professional pitch correction software. 1-year license key.', 150000, 'vst', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400', true, 45),
((select id from public.profiles limit 1), 'Waves Diamond Bundle', 'Complete mixing and mastering plugin bundle. Lifetime license.', 250000, 'vst', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400', true, 23);

-- More free samples
insert into public.marketplace_items (seller_id, title, description, price, category, thumbnail_url, is_active, download_count) values
((select id from public.profiles limit 1), 'Cinematic FX Pack', 'Movie-quality sound effects for film scoring and game audio. 200+ sounds.', 0, 'sample_pack', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400', true, 567),
((select id from public.profiles limit 1), 'Vocal Chops Samples', 'Processed vocal samples for electronic music production.', 0, 'sample_pack', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400', true, 432);
