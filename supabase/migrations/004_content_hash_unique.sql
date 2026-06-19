-- Fix: ON CONFLICT (content_hash) requires a UNIQUE constraint, not just an index.
-- The plain index from 001 is dropped; the constraint creates its own unique index.

drop index if exists idx_reviews_content_hash;

alter table reviews
  add constraint reviews_content_hash_key unique (content_hash);
