-- 1. Tambah kolom di Master Kapal
ALTER TABLE ships 
ADD COLUMN IF NOT EXISTS bendera text DEFAULT 'INDONESIA',
ADD COLUMN IF NOT EXISTS nakhoda text,
ADD COLUMN IF NOT EXISTS abk numeric,
ADD COLUMN IF NOT EXISTS asal_pelabuhan text;

-- 2. Tambah kolom di Manifest (JPT) agar tertaut dengan kapal
ALTER TABLE manifests 
ADD COLUMN IF NOT EXISTS ship_name text,
ADD COLUMN IF NOT EXISTS tiba_tanggal date;
