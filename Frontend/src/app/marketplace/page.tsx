'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail_url: string;
  download_count: number;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Load marketplace items from Supabase
      let query = supabase
        .from('marketplace_items')
        .select('*')
        .eq('is_active', true);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(50);
      setListings(data || []);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, selectedCategory]);

  const categories = ['vst', 'sample_pack', 'template', 'preset'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-text">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div>
        <h1 className="text-3xl font-bold mb-8 text-white">🏪 Marketplace</h1>

        {/* Category Filter */}
        <div className="mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              selectedCategory === '' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg capitalize font-medium transition-colors ${
                selectedCategory === cat ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="card text-center text-text-muted">
            <p className="text-xl">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="category-card"
              >
                {listing.thumbnail_url && (
                  <Image
                    src={listing.thumbnail_url}
                    alt={listing.title}
                    width={300}
                    height={160}
                    className="w-full h-40 object-cover"
                  />
                )}

                <div className="category-card-content">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {listing.title}
                  </h3>
                  <p className="text-text-muted text-sm mb-4 truncate-lines-2">
                    {listing.description}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {listing.price === 0 ? 'Free' : `₮${listing.price}`}
                    </span>
                  </div>

                  <div className="text-sm text-text-muted mb-4">
                    <p>Downloads: {listing.download_count}</p>
                    <p className="capitalize">
                      {listing.category.replace('_', ' ')}
                    </p>
                  </div>

                  <button className="btn-primary w-full py-2 font-semibold">
                    {listing.price === 0 ? 'Download' : 'Buy Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
