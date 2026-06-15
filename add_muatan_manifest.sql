-- Jalankan kode ini di SQL Editor Supabase untuk menambahkan kolom total muatan
ALTER TABLE manifests ADD COLUMN IF NOT EXISTS total_muatan numeric DEFAULT 0;
