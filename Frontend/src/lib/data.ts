import { Course, Lesson, Teacher } from './types';

export const teachers: Teacher[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    image: '/images/teachers/alex.jpg',
    specialty: 'Electronic Music Production',
    bio: 'Grammy-nominated producer with 15+ years of experience in electronic music.',
    role: 'Producer',
    instruments: ['Ableton Live', 'Logic Pro', 'FL Studio'],
    stats: { studentCount: 2500, rating: 4.9 },
  },
  {
    id: '2',
    name: 'Sarah Chen',
    image: '/images/teachers/sarah.jpg',
    specialty: 'Mixing & Mastering',
    bio: 'Senior engineer at top LA studios, worked with major label artists.',
    role: 'Engineer',
    instruments: ['Pro Tools', 'Logic Pro', 'Waves'],
    stats: { studentCount: 1800, rating: 4.8 },
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    image: '/images/teachers/marcus.jpg',
    specialty: 'Sound Design',
    bio: 'Sound designer for film and games, specialized in synthesis and sampling.',
    role: 'Sound Designer',
    instruments: ['Serum', 'Massive', 'Kontakt'],
    stats: { studentCount: 1200, rating: 4.7 },
  },
];

type LessonSeed = {
  title: string;
  minutes: number;
  summary: string;
  exercise: string;
  takeaway: string;
};

type CourseSeed = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  teacherId: string;
  category: Course['category'];
  level: Course['level'];
  slug: string;
  lessons: LessonSeed[];
};

const formatDuration = (totalMinutes: number) => {
  if (totalMinutes < 60) {
    return `~${totalMinutes} мин`;
  }

  const hours = totalMinutes / 60;
  return `~${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} цаг`;
};

const buildLesson = (courseId: string, lesson: LessonSeed, index: number): Lesson => ({
  id: `${courseId}-${index + 1}`,
  title: lesson.title,
  durationMinutes: lesson.minutes,
  free: true,
  contentType: 'brief',
  summary: lesson.summary,
  exercise: lesson.exercise,
  takeaway: lesson.takeaway,
});

const buildCourse = (seed: CourseSeed): Course => {
  const curriculum = seed.lessons.map((lesson, index) => buildLesson(seed.id, lesson, index));
  const totalMinutes = curriculum.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);

  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    thumbnail: seed.thumbnail,
    price: 0,
    teacherId: seed.teacherId,
    category: seed.category,
    level: seed.level,
    duration: formatDuration(totalMinutes),
    lessonsCount: curriculum.length,
    slug: seed.slug,
    curriculum,
  };
};

const courseSeeds: CourseSeed[] = [
  {
    id: '1',
    title: 'Groove Foundations',
    description:
      'Rhythm, pulse, bar structure, and movement for learners who want to stop guessing and start building steady grooves.',
    thumbnail: '/images/courses/electronic.jpg',
    teacherId: '1',
    category: 'music-production',
    level: 'beginner',
    slug: 'groove-foundations',
    lessons: [
      {
        title: 'Pulse ба count-in',
        minutes: 8,
        summary:
          'Steady pulse гэж юу болох, 4-count count-in яагаад groove эхлүүлэхэд чухал болохыг тайлбарлана.',
        exercise: 'Clap ашиглаад 4 count-in хийж, дараа нь 8 bar турш нэг тогтвортой pulse барь.',
        takeaway:
          'Groove эхлэхээс өмнө pulse тогтвортой байх нь бүх дараагийн layer-ийн суурь болдог.',
      },
      {
        title: 'Kick ба snare-ийн тулгуур',
        minutes: 10,
        summary: 'Kick ба snare хоёроор groove-ийн үндсэн хэлбэрийг яаж босгодогийг харуулна.',
        exercise: '2 өөр feel-тэй drum pattern бич: нэг нь straight, нөгөө нь арай илүү space-тэй.',
        takeaway: 'Хамгийн энгийн хоёр элемент хүртэл track-ийн energy-г тодорхойлж чадна.',
      },
      {
        title: 'Hi-hat-аар хөдөлгөөн нэмэх',
        minutes: 9,
        summary:
          'Subdivision болон жижиг хөдөлгөөнүүд groove-ийг яаж илүү амьд болгодгийг тайлбарлана.',
        exercise: 'Нэг ижил drum loop дээр 3 өөр hi-hat variation туршиж харьцуул.',
        takeaway: 'Жижиг rhythmic detail-ууд track-ийг flat биш, хөдөлгөөнтэй болгож өгдөг.',
      },
      {
        title: 'Tempo, swing, feel',
        minutes: 11,
        summary:
          'Tempo өөрчлөгдөхөд сонсголын мэдрэмж, swing нэмэгдэхэд groove яаж өөр болдгийг ойлгуулна.',
        exercise: 'Нэг pattern-ээ 90, 110, 128 BPM дээр сонсоод дараа нь swing нэмж үз.',
        takeaway: 'Pattern ижил байсан ч feel нь tempo болон timing-оос их хамаардаг.',
      },
      {
        title: '8-bar groove sketch',
        minutes: 12,
        summary:
          'Өмнөх хичээлүүдийн санааг ашиглаад богино groove sketch бүтээх урсгалыг нэгтгэнэ.',
        exercise: '8 bar loop дотор intro feel, full groove, жижиг variation гэсэн 3 үе хий.',
        takeaway: 'Simple structure нэмэхэд loop илүү “track-like” болж эхэлдэг.',
      },
    ],
  },
  {
    id: '2',
    title: 'Melody Sketchbook',
    description:
      'Simple note movement, motif building, and hook writing for turning ideas into memorable lead lines.',
    thumbnail: '/images/courses/sound-design.jpg',
    teacherId: '1',
    category: 'melody-voice',
    level: 'beginner',
    slug: 'melody-sketchbook',
    lessons: [
      {
        title: 'Single-note shapes',
        minutes: 8,
        summary:
          'Ascending, descending, repeat-heavy shape-ууд melody-ийн занг яаж өөрчилдгийг танилцуулна.',
        exercise: '3-5 note-той 3 өөр contour бичээд аль нь илүү дурсагдаж байгааг сонс.',
        takeaway: 'Melody сайхан сонсогдохын тулд олон note биш, тод contour хэрэгтэй.',
      },
      {
        title: 'Motif барих',
        minutes: 10,
        summary: 'Бага хэмжээний motif-ийг давтаж, slight variation хийж hook үүсгэх зарчмыг үзнэ.',
        exercise: '2 bar motif бичээд дараагийн 2 bar-т нь rhythm эсвэл 1 note өөрчил.',
        takeaway: 'Repetition ба variation хоёрын тэнцвэр melody-г тогтоцтой болгодог.',
      },
      {
        title: 'Major ба minor mood',
        minutes: 9,
        summary:
          'Ижил contour-ийг өөр scale feeling дээр туршихад сэтгэлзүйн өнгө яаж өөрчлөгдөхийг харуулна.',
        exercise: 'Нэг motif-оо bright version, dark version гэж 2 янзаар хувирга.',
        takeaway: 'Mood нь зөвхөн sound-аас биш, note choice-оос бас хүчтэй хамаардаг.',
      },
      {
        title: 'Call and response',
        minutes: 10,
        summary: 'Melody-г нэг урт шугам биш, асуулт-хариултын жижиг хэсгүүдээр бодох аргыг заана.',
        exercise: '2 bar “call” бичээд дараагийн 2 bar-т нь shorter “response” бич.',
        takeaway: 'Phrase thinking хийснээр melody илүү хүний яриа шиг урсгалтай болдог.',
      },
      {
        title: 'Hook polishing',
        minutes: 12,
        summary:
          'Melody-г цэвэршүүлж, unnecessary note-уудыг хасаж, strongest version-ийг сонгох алхмуудыг үзнэ.',
        exercise: 'Өмнөх хичээлүүдийн motif-оос нэгийг сонгоод 2 өөр simplified version гарга.',
        takeaway: 'Сайн hook олон note-оор бус, зөв note-оор ажилладаг.',
      },
    ],
  },
  {
    id: '3',
    title: 'Chord Movement Lab',
    description:
      'A practical harmony path for building stable progressions, stronger voicings, and emotional movement.',
    thumbnail: '/images/courses/mixing.jpg',
    teacherId: '1',
    category: 'melody-voice',
    level: 'intermediate',
    slug: 'chord-movement-lab',
    lessons: [
      {
        title: 'Triad thinking',
        minutes: 9,
        summary:
          'Simple triad-уудыг root-position дээр харахаас илүү function-ээр нь ойлгох суурь тавина.',
        exercise: '3 chord progression бичээд тус бүрийн mood role-ийг нэрлэ.',
        takeaway: 'Chord progression гэдэг нь random shape биш, хөдөлгөөнтэй санаа юм.',
      },
      {
        title: 'Tension ба release',
        minutes: 10,
        summary:
          'Stable chord ба unstable chord-ийн мэдрэмжийг ялгаж, resolution үүсгэх логикийг үзнэ.',
        exercise:
          '4 chord loop дотор one “tension” момент оруулж, дараагийн chord-оор resolve хий.',
        takeaway: 'Сонсогчийг урагш татах хүч нь tension-release-ээс үүсдэг.',
      },
      {
        title: 'Voicing spacing',
        minutes: 11,
        summary: 'Ижил chord different spacing дээр ямар өнгөтэй сонсогддгийг жишээгээр харуулна.',
        exercise: 'Нэг progression-ээ close voicing, open voicing гэж 2 янзаар тогло.',
        takeaway: 'Voicing choice нь harmony-г more lush эсвэл more tight болгодог.',
      },
      {
        title: 'Progression loop-оос section хийх',
        minutes: 10,
        summary:
          'Нэг chord loop-ийг section бүрт бага зэрэг өөрчилж arrangement-friendly болгохыг үзнэ.',
        exercise: 'Verse, lift, chorus гэж 3 хэсэгт chord density өөрчил.',
        takeaway: 'Progression нэг хэвийн байхаа болиход section feeling төрж эхэлдэг.',
      },
      {
        title: 'Emotional rewrite',
        minutes: 12,
        summary:
          'Нэг progression-ийг илүү hopeful, илүү dark, илүү suspended гэсэн 3 өөр чиглэлд хувиргана.',
        exercise: 'Өмнөх progression-оосоо нэгийг сонгоод 2 alternate emotion version гарга.',
        takeaway: 'Harmony бол track-ийн emotional camera angle гэж ойлгож болно.',
      },
    ],
  },
  {
    id: '4',
    title: 'Bassline Builder',
    description:
      'Low-end line writing for locking with drums, supporting chords, and creating forward motion.',
    thumbnail: '/images/courses/electronic.jpg',
    teacherId: '3',
    category: 'sound-design',
    level: 'intermediate',
    slug: 'bassline-builder',
    lessons: [
      {
        title: 'Root note anchoring',
        minutes: 8,
        summary:
          'Bassline хамгийн түрүүнд harmony-г яаж баталгаажуулдгийг тайлбарлаж, root note anchor-ийг танилцуулна.',
        exercise: 'Kick pattern дээр chord root-уудаар 1 bar bass sketch хий.',
        takeaway: 'Strong low-end ихэнхдээ root awareness-аас эхэлдэг.',
      },
      {
        title: 'Rhythmic lock',
        minutes: 9,
        summary: 'Bass ба drums rhythm дээрээ таарах эсвэл intentionally contrast хийх аргыг үзнэ.',
        exercise: 'Нэг bassline-аа kick-тэй unison, нөгөөг нь offbeat accent-тэй хий.',
        takeaway: 'Bassline-ийн rhythm нь note choice шигээ чухал.',
      },
      {
        title: 'Octave jump ба movement',
        minutes: 10,
        summary: 'Octave movement ашиглаад нэгэн хэвийн root-following line-ийг илүү амьд болгоно.',
        exercise: '2 bar bass phrase дотор дор хаяж нэг octave jump оруул.',
        takeaway: 'Movement нэмэхэд bassline зөвхөн support биш character болж эхэлдэг.',
      },
      {
        title: 'Chord-той ярих bass',
        minutes: 10,
        summary:
          'Bassline harmony-г давтах биш, түүнтэй ярилцах байдлаар ажиллаж болдгийг харуулна.',
        exercise: 'Chord change бүр дээр full root дарахгүй хувилбарын bassline бич.',
        takeaway: 'Space үлдээсэн bassline ихэвчлэн илүү musical сонсогддог.',
      },
      {
        title: 'Low-end glue pass',
        minutes: 11,
        summary:
          'Bassline, drums, chord foundation-аа хамтад нь сонсоод юу үлдээж, юуг цэвэрлэхээ ялгана.',
        exercise: 'Өмнөх bass sketch-ээсээ unnecessary note 3-ыг хасаад before/after сонс.',
        takeaway: 'Сайн bassline нь их тоглосондоо биш, зөв зайгаа барьсандаа хүчтэй байдаг.',
      },
    ],
  },
  {
    id: '5',
    title: 'Arrangement Flow',
    description:
      'Turn loops into sections, shape energy, and learn how to finish a track with clear movement.',
    thumbnail: '/images/courses/mixing.jpg',
    teacherId: '1',
    category: 'music-production',
    level: 'intermediate',
    slug: 'arrangement-flow',
    lessons: [
      {
        title: 'Loop-оос section ялгах',
        minutes: 9,
        summary:
          'Ижил material-ийг volume биш arrangement choice-оор хэрхэн section болгодгийг тайлбарлана.',
        exercise: '8 bar loop-оос intro, core, stripped section гэсэн 3 version хий.',
        takeaway: 'Arrangement бол шинэ idea нэмэхээс илүү existing idea-г ухаалгаар тараах ажил.',
      },
      {
        title: 'Energy staircase',
        minutes: 10,
        summary: 'Track energy-г шатаар өсгөх сэтгэлгээгээр section order харах арга өгнө.',
        exercise: 'Өөрийн track-ийн 5 хэсгийг lowest to highest energy гэж жагсаа.',
        takeaway: 'Хэтэрхий flat arrangement сонсогчийг track дотор авч явахад хэцүү болгодог.',
      },
      {
        title: 'Contrast moments',
        minutes: 9,
        summary:
          'Everything-on feel-ээс зайлсхийж, contrast section оруулах нь яагаад чухал болохыг үзнэ.',
        exercise: 'Main section-ийхээ өмнө 2 bar “pull-back” хэсэг хий.',
        takeaway: 'Energy өсгөх хамгийн сайн арга нь заримдаа түр бууруулах байдаг.',
      },
      {
        title: 'Transition language',
        minutes: 11,
        summary:
          'Rise, drop, mute, filter, tail, silence зэрэг transition gesture-үүдийг track дотор ашиглахыг заана.',
        exercise: '2 section-ийн хооронд 3 өөр transition idea туршиж нэгийг нь сонго.',
        takeaway: 'Transitions section-үүдийг наах биш, хөдөлгөөнтэй болгодог.',
      },
      {
        title: 'Finish pass',
        minutes: 12,
        summary:
          'Arrangement-аа нэг бүтэн урсгал гэж сонсоод repeated weak spot-уудаа олж засах pass хийнэ.',
        exercise: 'Track-аа beginning to end сонсоод energy унадаг 2 moment тэмдэглэ.',
        takeaway: 'Track finish хийх нь шинэ part бичихээс илүү decision хийх чадвар шаарддаг.',
      },
    ],
  },
  {
    id: '6',
    title: 'Mix Clarity Basics',
    description:
      'A clean introduction to balance, EQ space, depth, and simple decision-making that helps mixes translate better.',
    thumbnail: '/images/courses/sound-design.jpg',
    teacherId: '2',
    category: 'mixing-mastering',
    level: 'intermediate',
    slug: 'mix-clarity-basics',
    lessons: [
      {
        title: 'Balance first',
        minutes: 8,
        summary: 'Plugin-гүйгээр зөв level balance хийх нь mix-ийн эхний том ялгаа болохыг үзнэ.',
        exercise: '5 element-тэй sketch дээр fader-only balance pass хий.',
        takeaway: 'Сайн balance хийсний дараа л processing-ийн утга илүү гарч ирдэг.',
      },
      {
        title: 'Frequency space',
        minutes: 10,
        summary:
          'Element-үүд ижил мужид мөргөлдөхөд яагаад muddy сонсогддогийг энгийн жишээгээр тайлбарлана.',
        exercise: '2 element сонгоод аль нь foreground, аль нь support байхыг шийд.',
        takeaway: 'Mix clarity нь бүгдийг чангаруулах биш, зай гаргахаас эхэлдэг.',
      },
      {
        title: 'Dynamics with intent',
        minutes: 10,
        summary: 'Compression-ийг louder хийх хэрэгсэл биш, movement control гэж харах өнцөг өгнө.',
        exercise: 'Нэг punchy, нэг smoother feel гэж 2 compressor intention бич.',
        takeaway: 'Processing бүр тодорхой зорилготой байх үед mix decision илүү цэвэр болно.',
      },
      {
        title: 'Depth and front-to-back',
        minutes: 9,
        summary:
          'Dry/wet, brightness, level, stereo гэсэн сонголтууд depth illusion үүсгэхэд яаж нөлөөлдгийг үзнэ.',
        exercise: '3 element-ээ front, mid, back гэж ангилж сонс.',
        takeaway: 'Space design хийснээр mix flat plane биш scene болж сонсогдоно.',
      },
      {
        title: 'Final clarity checklist',
        minutes: 11,
        summary: 'Mix-ээ экспортлохоос өмнө сонсох ёстой гол асуултуудыг нэгтгэнэ.',
        exercise: 'Өөрийн sketch дээр balance, conflict, depth, dynamics гэсэн 4 check хий.',
        takeaway: 'Хурдан checklist-тэй байх нь endless tweaking-ээс хамгаалдаг.',
      },
    ],
  },
];

export const courses: Course[] = courseSeeds.map(buildCourse);

export type { Lesson };
