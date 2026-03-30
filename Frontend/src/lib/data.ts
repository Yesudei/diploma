import { Course, Teacher } from "./types";

export const teachers: Teacher[] = [
  {
    id: "1",
    name: "Alex Rivera",
    image: "/images/teachers/alex.jpg",
    specialty: "Electronic Music Production",
    bio: "Grammy-nominated producer with 15+ years of experience in electronic music.",
    role: "Producer",
    instruments: ["Ableton Live", "Logic Pro", "FL Studio"],
    stats: { studentCount: 2500, rating: 4.9 },
  },
  {
    id: "2",
    name: "Sarah Chen",
    image: "/images/teachers/sarah.jpg",
    specialty: "Mixing & Mastering",
    bio: "Senior engineer at top LA studios, worked with major label artists.",
    role: "Engineer",
    instruments: ["Pro Tools", "Logic Pro", "Waves"],
    stats: { studentCount: 1800, rating: 4.8 },
  },
  {
    id: "3",
    name: "Marcus Johnson",
    image: "/images/teachers/marcus.jpg",
    specialty: "Sound Design",
    bio: "Sound designer for film and games, specialized in synthesis and sampling.",
    role: "Sound Designer",
    instruments: ["Serum", "Massive", "Kontakt"],
    stats: { studentCount: 1200, rating: 4.7 },
  },
];

export interface Lesson {
  id: string;
  title: string;
  youtubeId: string;
  durationMinutes: number;
  free: boolean;
}

export const courses: Course[] = [
  {
    id: "1",
    title: "FL Studio Үндэс",
    description: "FL Studio програм дээр электроник хөгжим үйлдвэрлэх үндэсний зүйлсийг сурах",
    thumbnail: "/images/courses/electronic.jpg",
    price: 0,
    teacherId: "1",
    category: "music-production",
    level: "beginner",
    duration: "8 цаг",
    lessonsCount: 5,
    slug: "fl-studio-undes",
    curriculum: [
      { id: "1-1", title: "FL Studio танилцуулга, суулгалт", youtubeId: "6YwWKn6k0Mg", durationMinutes: 12, free: true },
      { id: "1-2", title: "Playlist, Pattern-тай ажиллах", youtubeId: "8gJ5-Y7jbkU", durationMinutes: 15, free: true },
      { id: "1-3", title: "Piano Roll-ийн үндэс", youtubeId: "4VnQFGyZmwI", durationMinutes: 18, free: false },
      { id: "1-4", title: "Миди контроллер холбох", youtubeId: "pK1W6j9xQw", durationMinutes: 10, free: false },
      { id: "1-5", title: "Эхний биетэйгаа хийх", youtubeId: "XqA4Y-GqhTs", durationMinutes: 20, free: false },
    ],
  },
  {
    id: "2",
    title: "Professional Mixing Techniques",
    description: "Master the art of mixing with industry-standard techniques.",
    thumbnail: "/images/courses/mixing.jpg",
    price: 79000,
    teacherId: "2",
    category: "mixing-mastering",
    level: "intermediate",
    duration: "12 цаг",
    lessonsCount: 5,
    slug: "professional-mixing",
    curriculum: [
      { id: "2-1", title: "Mixing-ийн үндэс, зорилго", youtubeId: "r2RzN5ZjYvM", durationMinutes: 15, free: true },
      { id: "2-2", title: "EQ ашиглах арга", youtubeId: "M4S4XfdN_Nw", durationMinutes: 20, free: false },
      { id: "2-3", title: "Компрессор тохируулах", youtubeId: "sWS-wlV7fD4", durationMinutes: 18, free: false },
      { id: "2-4", title: "Spacer, Reverb ашиглах", youtubeId: "q6fF5_7YdTs", durationMinutes: 22, free: false },
      { id: "2-5", title: "Master bus компрессор", youtubeId: "L0rN5ZjYvM", durationMinutes: 16, free: false },
    ],
  },
  {
    id: "3",
    title: "Sound Design with Serum",
    description: "Create professional sounds from scratch using Xfer Records Serum.",
    thumbnail: "/images/courses/sound-design.jpg",
    price: 59000,
    teacherId: "3",
    category: "sound-design",
    level: "intermediate",
    duration: "10 цаг",
    lessonsCount: 4,
    slug: "serum-sound-design",
    curriculum: [
      { id: "3-1", title: "Serum интерфэйс танилцуулга", youtubeId: "3xH4Y7XkWQE", durationMinutes: 14, free: true },
      { id: "3-2", title: "Oscillator-ийн төрлүүд", youtubeId: "9W5K4LmC8sE", durationMinutes: 18, free: false },
      { id: "3-3", title: "Filter, Envelope ашиглах", youtubeId: "vF4N6XmKQ9s", durationMinutes: 20, free: false },
      { id: "3-4", title: "Бас, лед, пад звук хийх", youtubeId: "nR5YmKQ8jTs", durationMinutes: 25, free: false },
    ],
  },
];
