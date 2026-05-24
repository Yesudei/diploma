const LOCAL_PURCHASED_COURSES_KEY = 'melodex_purchased_courses';
const LOCAL_PURCHASE_UPDATE_EVENT = 'melodex:local-purchase-updated';

const isBrowser = (): boolean => typeof window !== 'undefined';

const sanitizeCourseIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(cleaned));
};

const emitLocalPurchaseUpdate = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(LOCAL_PURCHASE_UPDATE_EVENT));
};

const writeLocalPurchasedCourseIds = (courseIds: string[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    LOCAL_PURCHASED_COURSES_KEY,
    JSON.stringify(sanitizeCourseIds(courseIds))
  );
  emitLocalPurchaseUpdate();
};

export const getLocalPurchaseUpdateEventName = (): string =>
  LOCAL_PURCHASE_UPDATE_EVENT;

export const getLocalPurchasedCourseIds = (): string[] => {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(LOCAL_PURCHASED_COURSES_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    return sanitizeCourseIds(JSON.parse(rawValue));
  } catch {
    return [];
  }
};

export const addLocalPurchasedCourse = (courseId: string): string[] => {
  const normalizedCourseId = courseId.trim();
  if (!normalizedCourseId) {
    return getLocalPurchasedCourseIds();
  }

  const updated = Array.from(
    new Set([...getLocalPurchasedCourseIds(), normalizedCourseId])
  );
  writeLocalPurchasedCourseIds(updated);
  return updated;
};
