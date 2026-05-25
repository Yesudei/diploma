import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { mergeCourses } from './course-list';
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

describe('mergeCourses', () => {
  test('keeps static courses and appends database courses', () => {
    const staticCourses = [makeCourse('static-course')];
    const dbCourses = [makeCourse('db-course')];

    assert.deepEqual(
      mergeCourses(staticCourses, dbCourses).map((course) => course.id),
      ['static-course', 'db-course'],
    );
  });

  test('skips duplicate database courses by id or slug', () => {
    const staticCourses = [makeCourse('static-course', 'same-slug')];
    const dbCourses = [makeCourse('static-course'), makeCourse('other-id', 'same-slug')];

    assert.deepEqual(
      mergeCourses(staticCourses, dbCourses).map((course) => course.id),
      ['static-course'],
    );
  });
});
