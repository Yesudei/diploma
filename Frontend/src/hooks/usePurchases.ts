'use client';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getPurchasedCourses } from '@/lib/database';
import {
  getLocalPurchasedCourseIds,
  getLocalPurchaseUpdateEventName,
} from '@/lib/mockPayments';

export function usePurchases() {
  const { user } = useAuth();
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [localPurchasedIds, setLocalPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncFromLocalStorage = () => {
      setLocalPurchasedIds(getLocalPurchasedCourseIds());
    };

    syncFromLocalStorage();

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes('melodex_purchased_courses')) {
        syncFromLocalStorage();
      }
    };

    const purchaseEventName = getLocalPurchaseUpdateEventName();
    window.addEventListener('storage', onStorage);
    window.addEventListener(purchaseEventName, syncFromLocalStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(purchaseEventName, syncFromLocalStorage);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setPurchasedIds([]);
      setLoading(false);
      return;
    }
    getPurchasedCourses(user.id).then(({ data }) => {
      setPurchasedIds(data?.map((p: { course_id: string }) => p.course_id) ?? []);
      setLoading(false);
    }).catch(() => {
      setPurchasedIds([]);
      setLoading(false);
    });
  }, [user]);

  const canWatch = (courseId: string, price: number) => {
    if (price === 0) return true;

    return purchasedIds.includes(courseId) || localPurchasedIds.includes(courseId);
  };

  return { purchasedIds, localPurchasedIds, loading, canWatch };
}
