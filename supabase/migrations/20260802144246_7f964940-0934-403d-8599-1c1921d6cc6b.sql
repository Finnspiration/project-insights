-- 1. Internal trigger functions must never be callable through the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Admin role helpers are only needed for signed-in users evaluating RLS policies.
--    Restrict the admin policies that referenced them to the authenticated role first.
DROP POLICY IF EXISTS "Admins can view all blind spots" ON public.blind_spots;
CREATE POLICY "Admins can view all blind spots"
  ON public.blind_spots FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all favorite quotes" ON public.favorite_quotes;
CREATE POLICY "Admins can view all favorite quotes"
  ON public.favorite_quotes FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- 3. favorite_quotes: explicit owner-scoped UPDATE policy, and no write access for anon.
DROP POLICY IF EXISTS "Users can update own favorite quotes" ON public.favorite_quotes;
CREATE POLICY "Users can update own favorite quotes"
  ON public.favorite_quotes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.favorite_quotes FROM anon;

-- 4. storage.objects: owner-scoped UPDATE policy mirroring the INSERT policy.
DROP POLICY IF EXISTS "Users can update own project files" ON storage.objects;
CREATE POLICY "Users can update own project files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT projects.id::text FROM public.projects WHERE projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'project-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT projects.id::text FROM public.projects WHERE projects.user_id = auth.uid()
    )
  );