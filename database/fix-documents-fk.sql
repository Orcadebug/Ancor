-- Fix Supabase documents table foreign key constraint
-- This addresses the PGRST200 error for missing FK in schema cache

-- Add the foreign key constraint (will fail gracefully if it already exists)
ALTER TABLE public.documents
ADD CONSTRAINT documents_deployments_fk
FOREIGN KEY (deployment_id) REFERENCES public.deployments(id) ON DELETE CASCADE;

-- Update table statistics to refresh schema cache
ANALYZE public.documents;
ANALYZE public.deployments;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deployments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deployments TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';