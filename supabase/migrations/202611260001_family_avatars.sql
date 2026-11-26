-- Personalización persistente por perfil y por integrante familiar.
-- ADD COLUMN con default no reescribe los datos existentes y no cambia RLS:
-- profiles conserva el acceso de cada usuario a su perfil; family_members
-- conserva las políticas de hogar/rol ya instaladas.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS avatar jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_object_check CHECK (jsonb_typeof(avatar) = 'object');

ALTER TABLE public.family_members
  ADD CONSTRAINT family_members_avatar_object_check CHECK (jsonb_typeof(avatar) = 'object');
