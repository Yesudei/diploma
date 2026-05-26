import { BANK_TRANSFER_ACCOUNT, buildBankTransferReference } from './bank-payment';
import { supabase } from './supabase';

export type CourseLearningState = {
  completedLessonIds: string[];
  passedLessonQuizIds: string[];
  courseQuizPassed: boolean;
  selfCheckMode: 'per-lesson' | 'final-only';
};

export async function getPurchasedCourses(userId: string) {
  const { data, error } = await supabase
    .from('purchased_courses')
    .select('course_id')
    .eq('user_id', userId);
  
  if (error) throw error;
  return { data };
}

export async function markLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string,
  completedLessonIds: string[],
  totalLessons: number,
) {
  const { error } = await supabase.from('completed_lessons').upsert(
    { user_id: userId, course_id: courseId, lesson_id: lessonId },
    { onConflict: 'user_id,lesson_id' },
  );

  if (error) throw error;
  const nextCompleted = Array.from(new Set([...completedLessonIds, lessonId]));
  await updateCourseProgress(userId, courseId, {
    progressPercent: totalLessons > 0 ? Math.round((nextCompleted.length / totalLessons) * 100) : 0,
    lastLessonId: lessonId,
  });
}

export async function updateCourseProgress(
  userId: string,
  courseId: string,
  updates: {
    progressPercent?: number;
    lastLessonId?: string;
    passedLessonQuizIds?: string[];
    courseQuizPassed?: boolean;
    selfCheckMode?: 'per-lesson' | 'final-only';
  },
) {
  const { data, error } = await supabase
    .from('course_progress')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        ...(updates.progressPercent !== undefined ? { progress_percent: updates.progressPercent } : {}),
        ...(updates.lastLessonId ? { last_lesson_id: updates.lastLessonId } : {}),
        ...(updates.passedLessonQuizIds ? { passed_lesson_quiz_ids: updates.passedLessonQuizIds } : {}),
        ...(updates.courseQuizPassed !== undefined ? { course_quiz_passed: updates.courseQuizPassed } : {}),
        ...(updates.selfCheckMode ? { self_check_mode: updates.selfCheckMode } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' },
    );
  
  if (error) throw error;
  return data;
}

export async function purchaseCourse(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('purchased_courses')
    .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id' });
  
  if (error) throw error;
  return data;
}

export async function createBankTransferPayment(userId: string, courseId: string, amount: number) {
  const paymentReference = buildBankTransferReference(courseId, userId);
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      course_id: courseId,
      amount,
      currency: 'MNT',
      status: 'pending',
      payment_method: 'bank_transfer',
      payment_reference: paymentReference,
    })
    .select('id, payment_reference')
    .single();

  if (error) throw error;
  return {
    paymentId: data.id as string,
    paymentReference: (data.payment_reference as string | null) || paymentReference,
    bankAccount: BANK_TRANSFER_ACCOUNT,
  };
}

export async function confirmPayment(paymentId: string) {
  return { success: true, paymentId };
}

export async function getCourseLearningState(
  userId: string,
  courseId: string,
): Promise<CourseLearningState> {
  const [completedResult, progressResult] = await Promise.all([
    supabase
      .from('completed_lessons')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId),
    supabase
      .from('course_progress')
      .select('passed_lesson_quiz_ids, course_quiz_passed, self_check_mode')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle(),
  ]);

  if (completedResult.error) throw completedResult.error;
  if (progressResult.error) throw progressResult.error;

  const progress = progressResult.data as {
    passed_lesson_quiz_ids?: string[] | null;
    course_quiz_passed?: boolean | null;
    self_check_mode?: string | null;
  } | null;

  return {
    completedLessonIds:
      completedResult.data?.map((item: { lesson_id: string }) => item.lesson_id) ?? [],
    passedLessonQuizIds: progress?.passed_lesson_quiz_ids ?? [],
    courseQuizPassed: Boolean(progress?.course_quiz_passed),
    selfCheckMode: progress?.self_check_mode === 'final-only' ? 'final-only' : 'per-lesson',
  };
}

export async function getCompletedLessons(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('completed_lessons')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('course_id', courseId);
  
  if (error) throw error;
  return { data };
}
