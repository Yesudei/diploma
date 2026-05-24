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
  youtubeId?: string;
  free?: boolean;
  summary: string;
  exercise: string;
  takeaway: string;
};

type CourseSeed = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price?: number;
  freePreviewLessons?: number;
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

const buildLesson = (
  courseId: string,
  lesson: LessonSeed,
  index: number,
  isFree: boolean
): Lesson => ({
  id: `${courseId}-${index + 1}`,
  title: lesson.title,
  youtubeId: lesson.youtubeId,
  durationMinutes: lesson.minutes,
  free: isFree,
  contentType: lesson.youtubeId ? 'video' : 'brief',
  summary: lesson.summary,
  exercise: lesson.exercise,
  takeaway: lesson.takeaway,
});

const buildCourse = (seed: CourseSeed): Course => {
  const coursePrice = seed.price ?? 0;
  const previewCount = seed.freePreviewLessons ?? (coursePrice > 0 ? 2 : seed.lessons.length);
  const curriculum = seed.lessons.map((lesson, index) => {
    const isFree = lesson.free ?? index < previewCount;
    return buildLesson(seed.id, lesson, index, isFree);
  });
  const totalMinutes = curriculum.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);

  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    thumbnail: seed.thumbnail,
    price: coursePrice,
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
    id: '0',
    title: 'Хөгжмийн суурь ойлголт',
    description:
      'Анхлан суралцагчдад зориулсан эхний курс: хөгжим хэрхэн бүтээгддэг, rhythm, chord, FL Studio-ийн үндсэн цонхнууд, энгийн beat хийх дарааллыг сурна.',
    thumbnail: '/images/courses/electronic.jpg',
    price: 59000,
    freePreviewLessons: 3,
    teacherId: '1',
    category: 'music-production',
    level: 'beginner',
    slug: 'music-from-zero',
    lessons: [
      {
        title: 'Хөгжмийн онолын суурь',
        minutes: 30,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Note, rhythm, scale, chord гэж юу болох, эдгээр нь дуу болон beat бүтээхэд ямар үүрэгтэйг энгийнээр тайлбарлана.',
        exercise:
          'C D E F G A B note-уудыг тоглоод C, E, G гурвыг хамтад нь дарж C major chord үүсгэ.',
        takeaway:
          'Дуу нэг дороос эхэлдэггүй. Note, chord, rhythm, mood гэсэн жижиг хэсгүүд нийлж бүтээл болдог.',
      },
      {
        title: 'Pulse, tempo ба тоолол',
        minutes: 30,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Beat, tempo, bar, тоолол гэсэн ойлголтууд DAW-ийн grid дээр хэрхэн ажилладгийг үзнэ.',
        exercise:
          'Metronome асаагаад 1-2-3-4 гэж тоолж, нэг bar дотор kick болон snare байрлуул.',
        takeaway:
          'Drum, chord, melody бүгд track-ийн үндсэн pulse дээр тогтвортой суух хэрэгтэй.',
      },
      {
        title: 'Scale ба melody note',
        minutes: 30,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Scale доторх note-ууд яагаад хоорондоо зохицож сонсогддог, melody хийхэд scale хэрхэн тусалдгийг харуулна.',
        exercise:
          'C major scale ашиглаад 4 note-той богино melody бич. Дараа нь нэг note-ийг өөрчилж ялгааг нь сонс.',
        takeaway:
          'Зөв scale сонгох нь melody-г илүү цэвэр, зохицолтой сонсгох эхний алхам.',
      },
      {
        title: 'Chord ба progression',
        minutes: 30,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Олон note зэрэг дарахад chord үүсдэг, chord-ууд дарааллаар солигдоход progression болж mood үүсгэдгийг тайлбарлана.',
        exercise:
          'Piano Roll дээр piano instrument сонгоод C, G, Am, F progression бичиж, дээр нь энгийн melody турш.',
        takeaway:
          'Chord нь melody болон bass-д чиглэл өгдөг harmony-ийн суурь хэсэг.',
      },
      {
        title: 'FL Studio-ийн үндсэн цонхнууд',
        minutes: 18,
        youtubeId: 'pDIsEZsalAo',
        summary:
          'FL Studio доторх Browser, Channel Rack, Playlist, Piano Roll, Mixer гэсэн үндсэн хэсгүүдийг танилцуулна.',
        exercise:
          'Шинэ project нээгээд plugin нэмэх, pattern үүсгэх, mixer track руу routing хийхийг турш.',
        takeaway:
          'Аль цонх ямар ажил хийдгийг мэдвэл FL Studio илүү ойлгомжтой, хурдан санагдана.',
      },
      {
        title: 'Channel Rack дээр drum pattern хийх',
        minutes: 10,
        youtubeId: 'od5lD20Mnvw',
        summary:
          'Channel Rack дээр drum sample байрлуулж, pattern бичих эхний аргачлалыг үзнэ.',
        exercise:
          'Kick-ийг 1 ба 3 дээр, snare-ийг 2 ба 4 дээр, hi-hat-ийг beat бүр дээр байрлуул.',
        takeaway:
          'Энгийн drum pattern хүртэл зөв timing-тэй байвал groove мэдрэгдэж эхэлдэг.',
      },
      {
        title: 'Playlist дээр arrangement хийх',
        minutes: 10,
        youtubeId: 'TkTZLblecPM',
        summary:
          'Pattern-уудаа Playlist дээр байрлуулж, loop-ийг intro, main, outro хэсэгтэй arrangement болгоно.',
        exercise:
          '8 bar loop үүсгээд drum-ийг эхний 4 bar-д бага, дараагийн 4 bar-д бүтэн оруул.',
        takeaway:
          'Playlist бол pattern-уудыг дууны бүтцэд оруулж эмхлэх гол хэсэг.',
      },
      {
        title: 'Mixer-ийн суурь',
        minutes: 10,
        youtubeId: 'f1wVqmhLxUc',
        summary:
          'Энгийн mixing хийхэд volume, routing, EQ, effect ямар үүрэгтэйг тайлбарлана.',
        exercise:
          'Kick, snare, melody-г тус тусад нь mixer track руу илгээж, volume fader-ээр balance хий.',
        takeaway:
          'Mixing эхлэхээс өмнө routing болон volume balance хамгийн чухал.',
      },
      {
        title: 'FL Studio дээр drum programming хийх',
        minutes: 12,
        youtubeId: 'bSrR-6BCGy4',
        summary:
          'Rhythm, velocity, drum placement ашиглаад beat-ээ илүү амьд сонсгох аргыг үзнэ.',
        exercise:
          'Нэг drum loop-оо хоёр хувилбараар хий: нэг нь straight, нөгөө нь бага зэрэг variation-тэй.',
        takeaway:
          'Timing болон velocity дээр ажиллавал beginner drum ч илүү мэргэжлийн сонсогдоно.',
      },
      {
        title: 'Эхний санаагаа export хийх',
        minutes: 8,
        youtubeId: '0rEnGUUJ5oA',
        summary:
          'Богино demo export хийж, FL Studio дээр WAV болон MP3 файл гаргах үндсийг сурна.',
        exercise:
          '8 bar санаагаа WAV болон MP3 хэлбэрээр export хийгээд чанарын ялгааг сонс.',
        takeaway:
          'Санаагаа export хийж сонсох нь loop-оо бодит дуу шиг үнэлэх хамгийн сайн арга.',
      },
    ],
  },
  {
    id: '1',
    title: 'Groove-ийн суурь',
    description:
      'Rhythm, pulse, bar structure, movement-ийг ойлгож, тогтвортой groove бүтээж сурахад зориулсан анхан шатны курс.',
    thumbnail: '/images/courses/electronic.jpg',
    price: 0,
    teacherId: '1',
    category: 'music-production',
    level: 'beginner',
    slug: 'groove-foundations',
    lessons: [
      {
        title: 'Pulse ба count-in',
        minutes: 8,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Steady pulse гэж юу болох, 4-count count-in яагаад groove эхлүүлэхэд чухал болохыг тайлбарлана.',
        exercise: 'Clap ашиглаад 4 count-in хийж, дараа нь 8 bar турш нэг тогтвортой pulse барь.',
        takeaway:
          'Groove эхлэхээс өмнө pulse тогтвортой байх нь бүх дараагийн layer-ийн суурь болдог.',
      },
      {
        title: 'Kick ба snare-ийн тулгуур',
        minutes: 10,
        youtubeId: 'bSrR-6BCGy4',
        summary: 'Kick ба snare хоёроор groove-ийн үндсэн хэлбэрийг яаж босгодогийг харуулна.',
        exercise: '2 өөр feel-тэй drum pattern бич: нэг нь straight, нөгөө нь арай илүү space-тэй.',
        takeaway: 'Хамгийн энгийн хоёр элемент хүртэл track-ийн energy-г тодорхойлж чадна.',
      },
      {
        title: 'Hi-hat-аар хөдөлгөөн нэмэх',
        minutes: 9,
        youtubeId: 'bSrR-6BCGy4',
        summary:
          'Subdivision болон жижиг хөдөлгөөнүүд groove-ийг яаж илүү амьд болгодгийг тайлбарлана.',
        exercise: 'Нэг ижил drum loop дээр 3 өөр hi-hat variation туршиж харьцуул.',
        takeaway: 'Жижиг rhythmic detail-ууд track-ийг flat биш, хөдөлгөөнтэй болгож өгдөг.',
      },
      {
        title: 'Tempo, swing ба feel',
        minutes: 11,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Tempo өөрчлөгдөхөд сонсголын мэдрэмж, swing нэмэгдэхэд groove яаж өөр болдгийг ойлгуулна.',
        exercise: 'Нэг pattern-ээ 90, 110, 128 BPM дээр сонсоод дараа нь swing нэмж үз.',
        takeaway: 'Pattern ижил байсан ч feel нь tempo болон timing-оос их хамаардаг.',
      },
      {
        title: '8-bar groove sketch',
        minutes: 12,
        youtubeId: 'pDIsEZsalAo',
        summary:
          'Өмнөх хичээлүүдийн санааг ашиглаад богино groove sketch бүтээх урсгалыг нэгтгэнэ.',
        exercise: '8 bar loop дотор intro feel, full groove, жижиг variation гэсэн 3 үе хий.',
        takeaway: 'Simple structure нэмэхэд loop илүү "track-like" болж эхэлдэг.',
      },
    ],
  },
  {
    id: '2',
    title: 'Melody бичих дэвтэр',
    description:
      'Энгийн note movement, motif, hook бичих аргаар санаагаа тогтоцтой melody болгон хөгжүүлэх курс.',
    thumbnail: '/images/courses/sound-design.jpg',
    price: 0,
    teacherId: '1',
    category: 'melody-voice',
    level: 'beginner',
    slug: 'melody-sketchbook',
    lessons: [
      {
        title: '3 note-ийн хөдөлгөөн',
        minutes: 8,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Ascending, descending, repeat-heavy shape-ууд melody-ийн занг яаж өөрчилдгийг танилцуулна.',
        exercise: '3-5 note-той 3 өөр contour бичээд аль нь илүү дурсагдаж байгааг сонс.',
        takeaway: 'Melody сайхан сонсогдохын тулд олон note биш, тод contour хэрэгтэй.',
      },
      {
        title: 'Motif барих',
        minutes: 10,
        youtubeId: 'rgaTLrZGlk0',
        summary: 'Бага хэмжээний motif-ийг давтаж, slight variation хийж hook үүсгэх зарчмыг үзнэ.',
        exercise: '2 bar motif бичээд дараагийн 2 bar-т нь rhythm эсвэл 1 note өөрчил.',
        takeaway: 'Repetition ба variation хоёрын тэнцвэр melody-г тогтоцтой болгодог.',
      },
      {
        title: 'Major ба minor mood',
        minutes: 9,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Ижил contour-ийг өөр scale feeling дээр туршихад сэтгэлзүйн өнгө яаж өөрчлөгдөхийг харуулна.',
        exercise: 'Нэг motif-оо bright version, dark version гэж 2 янзаар хувирга.',
        takeaway: 'Mood нь зөвхөн sound-аас биш, note choice-оос бас хүчтэй хамаардаг.',
      },
      {
        title: 'Асуулт ба хариулт phrase',
        minutes: 10,
        youtubeId: 'rgaTLrZGlk0',
        summary: 'Melody-г нэг урт шугам биш, асуулт-хариултын жижиг хэсгүүдээр бодох аргыг заана.',
        exercise: '2 bar "call" бичээд дараагийн 2 bar-т нь shorter "response" бич.',
        takeaway: 'Phrase thinking хийснээр melody илүү хүний яриа шиг урсгалтай болдог.',
      },
      {
        title: 'Hook polishing',
        minutes: 12,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Melody-г цэвэршүүлж, unnecessary note-уудыг хасаж, strongest version-ийг сонгох алхмуудыг үзнэ.',
        exercise: 'Өмнөх хичээлүүдийн motif-оос нэгийг сонгоод 2 өөр simplified version гарга.',
        takeaway: 'Сайн hook олон note-оор бус, зөв note-оор ажилладаг.',
      },
    ],
  },
  {
    id: '3',
    title: 'Chord хөдөлгөөний лаборатори',
    description:
      'Тогтвортой progression, илүү хүчтэй voicing, сэтгэл хөдлөлийн хөдөлгөөнтэй harmony бүтээх практик курс.',
    thumbnail: '/images/courses/mixing.jpg',
    price: 45000,
    freePreviewLessons: 2,
    teacherId: '1',
    category: 'melody-voice',
    level: 'intermediate',
    slug: 'chord-movement-lab',
    lessons: [
      {
        title: 'Triad-ийн суурь',
        minutes: 9,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Simple triad-уудыг root-position дээр харахаас илүү function-ээр нь ойлгох суурь тавина.',
        exercise: '3 chord progression бичээд тус бүрийн mood role-ийг нэрлэ.',
        takeaway: 'Chord progression гэдэг нь random shape биш, хөдөлгөөнтэй санаа юм.',
      },
      {
        title: 'Tension ба release',
        minutes: 10,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Stable chord ба unstable chord-ийн мэдрэмжийг ялгаж, resolution үүсгэх логикийг үзнэ.',
        exercise:
          '4 chord loop дотор нэг "tension" момент оруулж, дараагийн chord-оор resolve хий.',
        takeaway: 'Сонсогчийг урагш татах хүч нь tension-release-ээс үүсдэг.',
      },
      {
        title: 'Voicing-ийн өнгө',
        minutes: 11,
        youtubeId: 'rgaTLrZGlk0',
        summary: 'Ижил chord өөр spacing дээр ямар өнгөтэй сонсогддгийг жишээгээр харуулна.',
        exercise: 'Нэг progression-ээ close voicing, open voicing гэж 2 янзаар тогло.',
        takeaway: 'Voicing choice нь harmony-г илүү өргөн эсвэл илүү tight сонсогдуулдаг.',
      },
      {
        title: 'Progression loop-оос section хийх',
        minutes: 10,
        youtubeId: 'TkTZLblecPM',
        summary:
          'Нэг chord loop-ийг section бүрт бага зэрэг өөрчилж arrangement-friendly болгохыг үзнэ.',
        exercise: 'Verse, lift, chorus гэж 3 хэсэгт chord density өөрчил.',
        takeaway: 'Progression нэг хэвийн байхаа болиход section feeling төрж эхэлдэг.',
      },
      {
        title: 'Сэтгэл хөдлөлийн хувилбарууд',
        minutes: 12,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Нэг progression-ийг илүү hopeful, илүү dark, илүү suspended гэсэн 3 өөр чиглэлд хувиргана.',
        exercise: 'Өмнөх progression-оосоо нэгийг сонгоод 2 alternate emotion version гарга.',
        takeaway: 'Harmony бол track-ийн emotional camera angle гэж ойлгож болно.',
      },
    ],
  },
  {
    id: '4',
    title: 'Bassline бүтээх',
    description:
      'Drum-тэй түгжигдэх, chord-ийг дэмжих, track-ийг урагш хөдөлгөх low-end line бичих курс.',
    thumbnail: '/images/courses/electronic.jpg',
    price: 39000,
    freePreviewLessons: 2,
    teacherId: '3',
    category: 'sound-design',
    level: 'intermediate',
    slug: 'bassline-builder',
    lessons: [
      {
        title: 'Root note-ийн тулгуур',
        minutes: 8,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Bassline хамгийн түрүүнд harmony-г яаж баталгаажуулдгийг тайлбарлаж, root note anchor-ийг танилцуулна.',
        exercise: 'Kick pattern дээр chord root-уудаар 1 bar bass sketch хий.',
        takeaway: 'Strong low-end ихэнхдээ root awareness-аас эхэлдэг.',
      },
      {
        title: 'Rhythm-тэй түгжих',
        minutes: 9,
        youtubeId: 'bSrR-6BCGy4',
        summary: 'Bass ба drums rhythm дээрээ таарах эсвэл санаатайгаар contrast хийх аргыг үзнэ.',
        exercise: 'Нэг bassline-аа kick-тэй unison, нөгөөг нь offbeat accent-тэй хий.',
        takeaway: 'Bassline-ийн rhythm нь note choice шигээ чухал.',
      },
      {
        title: 'Octave jump ба movement',
        minutes: 10,
        youtubeId: 'rgaTLrZGlk0',
        summary: 'Octave movement ашиглаад нэгэн хэвийн root-following line-ийг илүү амьд болгоно.',
        exercise: '2 bar bass phrase дотор дор хаяж нэг octave jump оруул.',
        takeaway: 'Movement нэмэхэд bassline зөвхөн support биш character болж эхэлдэг.',
      },
      {
        title: 'Chord-той ярих bass',
        minutes: 10,
        youtubeId: 'rgaTLrZGlk0',
        summary:
          'Bassline harmony-г давтах биш, түүнтэй ярилцах байдлаар ажиллаж болдгийг харуулна.',
        exercise: 'Chord change бүр дээр full root дарахгүй хувилбарын bassline бич.',
        takeaway: 'Space үлдээсэн bassline ихэвчлэн илүү musical сонсогддог.',
      },
      {
        title: 'Low-end-ийн цэвэрлэх pass',
        minutes: 11,
        youtubeId: 'f1wVqmhLxUc',
        summary:
          'Bassline, drums, chord foundation-аа хамтад нь сонсоод юу үлдээж, юуг цэвэрлэхээ ялгана.',
        exercise: 'Өмнөх bass sketch-ээсээ unnecessary note 3-ыг хасаад before/after сонс.',
        takeaway: 'Сайн bassline нь их тоглосондоо биш, зөв зайгаа барьсандаа хүчтэй байдаг.',
      },
    ],
  },
  {
    id: '5',
    title: 'Arrangement-ийн урсгал',
    description:
      'Loop-оо section болгон хөгжүүлж, energy-г хэлбэржүүлэн, track-ээ дуусгах дарааллыг сурах курс.',
    thumbnail: '/images/courses/mixing.jpg',
    price: 49000,
    freePreviewLessons: 2,
    teacherId: '1',
    category: 'music-production',
    level: 'intermediate',
    slug: 'arrangement-flow',
    lessons: [
      {
        title: 'Loop-оос section ялгах',
        minutes: 9,
        youtubeId: 'TkTZLblecPM',
        summary:
          'Ижил material-ийг volume биш arrangement choice-оор хэрхэн section болгодгийг тайлбарлана.',
        exercise: '8 bar loop-оос intro, core, stripped section гэсэн 3 version хий.',
        takeaway: 'Arrangement бол шинэ idea нэмэхээс илүү existing idea-г ухаалгаар тараах ажил.',
      },
      {
        title: 'Energy-г шатлуулж харах',
        minutes: 10,
        youtubeId: 'TkTZLblecPM',
        summary: 'Track energy-г шатаар өсгөх сэтгэлгээгээр section order харах арга өгнө.',
        exercise: 'Өөрийн track-ийн 5 хэсгийг lowest to highest energy гэж жагсаа.',
        takeaway: 'Хэтэрхий flat arrangement сонсогчийг track дотор авч явахад хэцүү болгодог.',
      },
      {
        title: 'Contrast section оруулах',
        minutes: 9,
        youtubeId: 'TkTZLblecPM',
        summary:
          'Everything-on feel-ээс зайлсхийж, contrast section оруулах нь яагаад чухал болохыг үзнэ.',
        exercise: 'Main section-ийхээ өмнө 2 bar "pull-back" хэсэг хий.',
        takeaway: 'Energy өсгөх хамгийн сайн арга нь заримдаа түр бууруулах байдаг.',
      },
      {
        title: 'Transition-ийн арга',
        minutes: 11,
        youtubeId: 'aBzQ5KV4glE',
        summary:
          'Rise, drop, mute, filter, tail, silence зэрэг transition gesture-үүдийг track дотор ашиглахыг заана.',
        exercise: '2 section-ийн хооронд 3 өөр transition idea туршиж нэгийг нь сонго.',
        takeaway: 'Transitions section-үүдийг наах биш, хөдөлгөөнтэй болгодог.',
      },
      {
        title: 'Дуусгах pass',
        minutes: 12,
        youtubeId: '0rEnGUUJ5oA',
        summary:
          'Arrangement-аа нэг бүтэн урсгал гэж сонсоод repeated weak spot-уудаа олж засах pass хийнэ.',
        exercise: 'Track-аа beginning to end сонсоод energy унадаг 2 moment тэмдэглэ.',
        takeaway: 'Track finish хийх нь шинэ part бичихээс илүү decision хийх чадвар шаарддаг.',
      },
    ],
  },
  {
    id: '6',
    title: 'Цэвэр mix-ийн суурь',
    description:
      'Balance, EQ space, depth болон энгийн mix decision ашиглаж илүү цэвэр сонсогдох mix хийх суурь курс.',
    thumbnail: '/images/courses/sound-design.jpg',
    price: 55000,
    freePreviewLessons: 2,
    teacherId: '2',
    category: 'mixing-mastering',
    level: 'intermediate',
    slug: 'mix-clarity-basics',
    lessons: [
      {
        title: 'Fader balance',
        minutes: 8,
        youtubeId: 'f1wVqmhLxUc',
        summary: 'Plugin-гүйгээр зөв level balance хийх нь mix-ийн эхний том ялгаа болохыг үзнэ.',
        exercise: '5 element-тэй sketch дээр fader-only balance pass хий.',
        takeaway: 'Сайн balance хийсний дараа л processing-ийн утга илүү гарч ирдэг.',
      },
      {
        title: 'Frequency-д зай гаргах',
        minutes: 10,
        youtubeId: 'f1wVqmhLxUc',
        summary:
          'Element-үүд ижил мужид мөргөлдөхөд яагаад muddy сонсогддогийг энгийн жишээгээр тайлбарлана.',
        exercise: '2 element сонгоод аль нь foreground, аль нь support байхыг шийд.',
        takeaway: 'Mix clarity нь бүгдийг чангаруулах биш, зай гаргахаас эхэлдэг.',
      },
      {
        title: 'Dynamics-ийг зорилготой ашиглах',
        minutes: 10,
        youtubeId: 'Zl-uG5oIUdg',
        summary: 'Compression-ийг louder хийх хэрэгсэл биш, movement control гэж харах өнцөг өгнө.',
        exercise: 'Нэг punchy, нэг smoother feel гэж 2 compressor intention бич.',
        takeaway: 'Processing бүр тодорхой зорилготой байх үед mix decision илүү цэвэр болно.',
      },
      {
        title: 'Depth ба зайны мэдрэмж',
        minutes: 9,
        youtubeId: 'f1wVqmhLxUc',
        summary:
          'Dry/wet, brightness, level, stereo гэсэн сонголтууд depth illusion үүсгэхэд яаж нөлөөлдгийг үзнэ.',
        exercise: '3 element-ээ front, mid, back гэж ангилж сонс.',
        takeaway: 'Space design хийснээр mix flat plane биш scene болж сонсогдоно.',
      },
      {
        title: 'Эцсийн mix шалгах checklist',
        minutes: 11,
        youtubeId: '0rEnGUUJ5oA',
        summary: 'Mix-ээ экспортлохоос өмнө сонсох ёстой гол асуултуудыг нэгтгэнэ.',
        exercise: 'Өөрийн sketch дээр balance, conflict, depth, dynamics гэсэн 4 check хий.',
        takeaway: 'Хурдан checklist-тэй байх нь endless tweaking-ээс хамгаалдаг.',
      },
    ],
  },
];

export const courses: Course[] = courseSeeds.map(buildCourse);

export type { Lesson };
