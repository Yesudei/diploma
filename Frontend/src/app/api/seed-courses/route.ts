import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { courses, teachers } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseClient(authToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    },
  );
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Authorization header required.' }, { status: 401 });
  }

  const supabase = getSupabaseClient(token);

  // ── Admin check ───────────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Could not verify user profile.' }, { status: 403 });
  }

  if (!profile.is_admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  // ── Seed ──────────────────────────────────────────────────────────────────
  let coursesSeeded = 0;
  let lessonsSeeded = 0;
  const errors: string[] = [];

  for (const course of courses) {
    // Look up teacher name from the teachers array; fall back to 'Melodex'
    const teacher = teachers.find((t) => t.id === course.teacherId);
    const teacherName = teacher?.name ?? 'Melodex';

    // Upsert course row
    const { error: courseError } = await supabase
      .from('courses')
      .upsert(
        {
          course_id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          category: course.category,
          level: course.level,
          slug: course.slug,
          teacher_id: course.teacherId,
          teacher_name: teacherName,
        },
        { onConflict: 'course_id' },
      );

    if (courseError) {
      errors.push(`Course "${course.id}": ${courseError.message}`);
      continue; // skip lessons for this course if the course upsert failed
    }

    coursesSeeded += 1;

    // Upsert each lesson
    for (let i = 0; i < course.curriculum.length; i++) {
      const lesson = course.curriculum[i];

      const { error: lessonError } = await supabase
        .from('lessons')
        .upsert(
          {
            lesson_id: lesson.id,
            course_id: course.id,
            title: lesson.title,
            duration_minutes: lesson.durationMinutes,
            summary: lesson.summary ?? null,
            exercise: lesson.exercise ?? null,
            takeaway: lesson.takeaway ?? null,
            youtube_id: lesson.youtubeId ?? null,
            content_type: lesson.contentType ?? (lesson.youtubeId ? 'video' : 'brief'),
            free: lesson.free,
            sort_order: i,
          },
          { onConflict: 'lesson_id' },
        );

      if (lessonError) {
        errors.push(`Lesson "${lesson.id}" (course "${course.id}"): ${lessonError.message}`);
      } else {
        lessonsSeeded += 1;
      }
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    coursesSeeded,
    lessonsSeeded,
    errors,
  });
}
