type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
};

export function isMissingTableError(
  error: SupabaseLikeError | null | undefined,
  tableName?: string
): boolean {
  const message = error?.message || '';

  if (error?.code === 'PGRST205') {
    if (!tableName) {
      return true;
    }

    return message.includes(`public.${tableName}`) || message.includes(`'${tableName}'`);
  }

  if (!tableName) {
    return message.includes('Could not find the table');
  }

  return message.includes(`Could not find the table 'public.${tableName}'`);
}

export function getSupabaseSetupMessage(resourceLabel: string): string {
  return `${resourceLabel} ажиллуулахын тулд эхлээд Supabase SQL Editor дээр Frontend/supabase-schema.sql болон Frontend/supabase-admin-setup.sql файлуудыг ажиллуулаарай.`;
}
