'use client';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getPurchasedCourses } from '@/lib/database';

export function usePurchases() {
  const { user } = useAuth();
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPurchasedIds([]);
      setLoading(false);
      return;
    }
    getPurchasedCourses(user.id).then(({ data }) => {
      setPurchasedIds(data?.map((p: any) => p.course_id) ?? []);
      setLoading(false);
    }).catch(() => {
      setPurchasedIds([]);
      setLoading(false);
    });
  }, [user]);

  const canWatch = (courseId: string, price: number) => {
    if (price === 0) return true;
    return purchasedIds.includes(courseId);
  };

  return { purchasedIds, loading, canWatch };
}
