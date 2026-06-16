-- 1. Tambah kolom Alamat dan Contact Person di Master Klien
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS alamat text,
ADD COLUMN IF NOT EXISTS contact_person text;

-- 2. Tambah kolom Consignee dan Komoditas di Rencana Bongkar Muat (PBM)
ALTER TABLE pbm_plans
ADD COLUMN IF NOT EXISTS consignee text,
ADD COLUMN IF NOT EXISTS komoditas text;
