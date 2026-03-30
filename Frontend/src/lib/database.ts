import { supabase } from "./supabase";

export async function getPurchasedCourses(userId: string) {
  const { data, error } = await supabase
    .from("purchased_courses")
    .select("course_id")
    .eq("user_id", userId);
  
  if (error) throw error;
  return { data };
}

export async function markLessonComplete(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from("lesson_progress")
    .insert({ user_id: userId, lesson_id: lessonId, completed: true });
  
  if (error) throw error;
  return data;
}

export async function updateCourseProgress(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from("course_progress")
    .upsert({ user_id: userId, course_id: courseId, updated_at: new Date().toISOString() });
  
  if (error) throw error;
  return data;
}

export async function purchaseCourse(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from("purchased_courses")
    .insert({ user_id: userId, course_id: courseId });
  
  if (error) throw error;
  return data;
}

export async function createPayment(courseId: string, amount: number) {
  return { paymentId: `pay_${Date.now()}`, courseId, amount };
}

export async function confirmPayment(paymentId: string) {
  return { success: true, paymentId };
}

export async function getCompletedLessons(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("course_id", courseId);
  
  if (error) throw error;
  return { data };
}
