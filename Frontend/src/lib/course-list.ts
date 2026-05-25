import type { Course } from './types';

export function mergeCourses(staticCourses: Course[], dbCourses: Course[]): Course[] {
  const seenIds = new Set(staticCourses.map((course) => course.id));
  const seenSlugs = new Set(staticCourses.map((course) => course.slug));
  const uniqueDbCourses = dbCourses.filter((course) => {
    if (seenIds.has(course.id) || seenSlugs.has(course.slug)) {
      return false;
    }

    seenIds.add(course.id);
    seenSlugs.add(course.slug);
    return true;
  });

  return [...staticCourses, ...uniqueDbCourses];
}
