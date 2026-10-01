-- Raise profile avatar upload limit to 4 MB (matches app validation)

UPDATE storage.buckets
SET file_size_limit = 4194304
WHERE id = 'avatars';
