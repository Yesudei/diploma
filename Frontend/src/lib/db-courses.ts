import { supabase } from '@/lib/supabase';
import { teachers } from '@/lib/data';
import type { Course, Lesson, Teacher } from '@/lib/types';
import { isMissingTableError } from '@/lib/supabase-errors';

type CourseRow = {
  course_id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  price: number | null;
  teacher_id: string | null;
  teacher_name: string | null;
  category: Course['category'];
  level: Course['level'];
  slug: string;
};

type LessonRow = {
  course_id: string;
  lesson_id: string;
  title: string;
  youtube_id: string | null;
  duration_minutes: number | null;
  summary: string | null;
  exercise: string | null;
  takeaway: string | null;
  content_type: Lesson['contentType'] | null;
  free: boolean | null;
  sort_order: number | null;
};

export type DbCourseBundle = {
  course: Course;
  teacher: Teacher;
};

const categorySpecialtyMap: Record<Course['category'], string> = {
  'music-production': 'Music Production',
  'mixing-mastering': 'Mixing & Mastering',
  'sound-design': 'Sound Design',
  'melody-voice': 'Melody & Voice',
  'audio-engineering': 'Audio Engineering',
};

const categoryToolsMap: Record<Course['category'], string[]> = {
  'music-production': ['FL Studio', 'Piano Roll', 'Mixer'],
  'mixing-mastering': ['EQ', 'Compression', 'Limiter'],
  'sound-design': ['Serum', 'Synths', 'Sampling'],
  'melody-voice': ['MIDI', 'Keys', 'Hooks'],
  'audio-engineering': ['Routing', 'Gain staging', 'Monitoring'],
};

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return '~0 мин';
  }

  if (totalMinutes < 60) {
    return `~${totalMinutes} мин`;
  }

  const hours = totalMinutes / 60;
  return `~${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} цаг`;
}

function mapLessonRow(row: LessonRow): Lesson {
  return {
    id: row.lesson_id,
    title: row.title,
    youtubeId: row.youtube_id || undefined,
    durationMinutes: Math.max(0, row.duration_minutes || 0),
    free: Boolean(row.free),
    contentType: row.content_type || (row.youtube_id ? 'video' : 'brief'),
    summary: row.summary || '',
    exercise: row.exercise || '',
    takeaway: row.takeaway || '',
  };
}

function buildFallbackTeacher(courseRow: CourseRow): Teacher {
  const teacherName = courseRow.teacher_name?.trim() || 'Melodex Mentor';

  return {
    id: courseRow.teacher_id?.trim() || `db-teacher-${courseRow.course_id}`,
    name: teacherName,
    image: teachers[0]?.image || '/images/teachers/alex.jpg',
    specialty: categorySpecialtyMap[courseRow.category] || 'Music Production',
    bio: `${teacherName} нь энэ сургалтыг Melodex дээр хөтөлж буй ментор.`,
    role: 'Mentor',
    instruments: categoryToolsMap[courseRow.category] || ['FL Studio'],
    stats: {
      studentCount: 0,
      rating: 4.8,
    },
  };
}

function resolveTeacher(courseRow: CourseRow): Teacher {
  const matchedTeacher = teachers.find((teacher) => teacher.id === courseRow.teacher_id);
  return matchedTeacher || buildFallbackTeacher(courseRow);
}

function mapCourseRow(courseRow: CourseRow, lessonRows: LessonRow[]): Course {
  const curriculum = lessonRows
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(mapLessonRow);
  const totalMinutes = curriculum.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);

  return {
    id: courseRow.course_id,
    title: courseRow.title,
    description: courseRow.description || '',
    thumbnail: courseRow.thumbnail || '/images/courses/electronic.jpg',
    price: courseRow.price || 0,
    teacherId: courseRow.teacher_id || '',
    category: courseRow.category,
    level: courseRow.level,
    duration: formatDuration(totalMinutes),
    lessonsCount: curriculum.length,
    slug: courseRow.slug,
    curriculum,
  };
}

export async function fetchDbCourses(): Promise<Course[]> {
  const { data: courseRows, error: coursesError } = await supabase
    .from('courses')
    .select('course_id, title, description, thumbnail, price, teacher_id, teacher_name, category, level, slug')
    .order('created_at', { ascending: false });

  if (coursesError) {
    if (isMissingTableError(coursesError, 'courses')) {
      return [];
    }

    throw coursesError;
  }

  if (!courseRows?.length) {
    return [];
  }

  const { data: lessonRows, error: lessonsError } = await supabase
    .from('lessons')
    .select(
      'course_id, lesson_id, title, youtube_id, duration_minutes, summary, exercise, takeaway, content_type, free, sort_order'
    )
    .order('sort_order', { ascending: true });

  if (lessonsError) {
    if (isMissingTableError(lessonsError, 'lessons')) {
      return courseRows.map((courseRow) => mapCourseRow(courseRow as CourseRow, []));
    }

    throw lessonsError;
  }

  const lessonsByCourseId = new Map<string, LessonRow[]>();

  for (const lessonRow of (lessonRows || []) as LessonRow[]) {
    const current = lessonsByCourseId.get(lessonRow.course_id) || [];
    current.push(lessonRow);
    lessonsByCourseId.set(lessonRow.course_id, current);
  }

  return (courseRows as CourseRow[]).map((courseRow) =>
    mapCourseRow(courseRow, lessonsByCourseId.get(courseRow.course_id) || [])
  );
}

export async function fetchDbCourseBundleBySlug(slug: string): Promise<DbCourseBundle | null> {
  const { data: courseRow, error: courseError } = await supabase
    .from('courses')
    .select('course_id, title, description, thumbnail, price, teacher_id, teacher_name, category, level, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (courseError) {
    if (isMissingTableError(courseError, 'courses')) {
      return null;
    }

    throw courseError;
  }

  if (!courseRow) {
    return null;
  }

  const { data: lessonRows, error: lessonsError } = await supabase
    .from('lessons')
    .select(
      'course_id, lesson_id, title, youtube_id, duration_minutes, summary, exercise, takeaway, content_type, free, sort_order'
    )
    .eq('course_id', courseRow.course_id)
    .order('sort_order', { ascending: true });

  if (lessonsError) {
    if (isMissingTableError(lessonsError, 'lessons')) {
      return {
        course: mapCourseRow(courseRow as CourseRow, []),
        teacher: resolveTeacher(courseRow as CourseRow),
      };
    }

    throw lessonsError;
  }

  return {
    course: mapCourseRow(courseRow as CourseRow, (lessonRows || []) as LessonRow[]),
    teacher: resolveTeacher(courseRow as CourseRow),
  };
}
