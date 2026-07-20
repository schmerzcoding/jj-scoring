-- Country of origin (profiles) and country + banner (competitions)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country_code CHAR(2);

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS country_code CHAR(2),
  ADD COLUMN IF NOT EXISTS banner_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'competition-banners',
  'competition-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Competition banners are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload competition banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins update competition banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete competition banners" ON storage.objects;

CREATE POLICY "Competition banners are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'competition-banners');

CREATE POLICY "Admins upload competition banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'competition-banners' AND is_admin());

CREATE POLICY "Admins update competition banners"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'competition-banners' AND is_admin());

CREATE POLICY "Admins delete competition banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'competition-banners' AND is_admin());
