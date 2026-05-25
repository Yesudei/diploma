import type { Course } from './types';

export const courseRealtimeTables = ['courses', 'lessons'] as const;

export const adminRealtimeTables = [
  'profiles',
  'audio_files',
  'mixing_analysis',
  'chat_messages',
  'purchased_courses',
  'completed_lessons',
  'course_progress',
  'knowledge_base',
  'marketplace_items',
  'payments',
  ...courseRealtimeTables,
] as const;

export const dashboardRealtimeTables = [
  'audio_files',
  'mixing_analysis',
  ...courseRealtimeTables,
] as const;

export function buildCourseRealtimeChannelName(source: string): string {
  const safeSource = source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `melodex-courses-${safeSource || 'app'}`;
}

export function mergeCourses(staticCourses: Course[], dbCourses: Course[]): Course[] {
  if (dbCourses.length === 0) {
    return staticCourses;
  }

  const dbIds = new Set(dbCourses.map((c) => c.id));
  const dbSlugs = new Set(dbCourses.map((c) => c.slug));

  // DB courses are authoritative; supplement with any static courses not yet seeded
  const fallbackStatic = staticCourses.filter((c) => !dbIds.has(c.id) && !dbSlugs.has(c.slug));

  return [...dbCourses, ...fallbackStatic];
}
