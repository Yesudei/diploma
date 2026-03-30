export interface Teacher {
  id: string;
  name: string;
  image: string;
  specialty: string;
  bio: string;
  role?: string;
  instruments?: string[];
  stats?: {
    studentCount: number;
    rating: number;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  teacherId: string;
  category: Category;
  level: Level;
  duration: string;
  lessonsCount: number;
  slug: string;
  curriculum: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  youtubeId: string;
  durationMinutes: number;
  free: boolean;
}

export type Category = 
  | "music-production"
  | "mixing-mastering"
  | "sound-design"
  | "melody-voice"
  | "audio-engineering";

export type Level = "beginner" | "intermediate" | "advanced";
