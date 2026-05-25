import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildCourseRealtimeChannelName, courseRealtimeTables, mergeCourses } from './course-list';
import type { Course } from './types';

const makeCourse = (id: string, slug = id): Course => ({
  id,
  title: id,
  description: '',
  thumbnail: '',
  price: 0,
  teacherId: '',
  category: 'music-production',
  level: 'beginner',
  duration: '~0 min',
  lessonsCount: 0,
  slug,
  curriculum: [],
});

describe('course realtime helpers', () => {
  test('subscribes to course and lesson table changes', () => {
    assert.deepEqual(courseRealtimeTables, ['courses', 'lessons']);
  });

  test('builds a stable channel name for a page source', () => {
    assert.equal(buildCourseRealtimeChannelName('dashboard'), 'melodex-courses-dashboard');
  });
});

describe('mergeCourses', () => {
  test('returns static courses when database courses are not loaded', () => {
    const staticCourses = [makeCourse('static-course')];

    assert.deepEqual(
      mergeCourses(staticCourses, []).map((course) => course.id),
      ['static-course']
    );
  });

  test('shows database courses before static fallback courses', () => {
    const staticCourses = [makeCourse('static-course')];
    const dbCourses = [makeCourse('db-course')];

    assert.deepEqual(
      mergeCourses(staticCourses, dbCourses).map((course) => course.id),
      ['db-course', 'static-course']
    );
  });

  test('keeps database duplicate courses instead of static courses by id or slug', () => {
    const staticCourses = [makeCourse('static-course', 'same-slug')];
    const dbCourses = [makeCourse('static-course'), makeCourse('other-id', 'same-slug')];

    assert.deepEqual(
      mergeCourses(staticCourses, dbCourses).map((course) => course.id),
      ['static-course', 'other-id']
    );
  });
});
