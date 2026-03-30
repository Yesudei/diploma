'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', bio: '' });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Load profile from Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);
      setFormData({
        full_name: profileData?.full_name || '',
        bio: profileData?.bio || '',
      });
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.full_name,
              bio: formData.bio,
            }
          : null
      );
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#7A7570]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-[#F5F0E8]">👤 Profile</h1>

        <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-6 space-y-6">
          {/* Profile Picture */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#7A7570] mb-1">Email</label>
              <p className="text-lg text-[#F5F0E8]">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A7570] mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className="w-full bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg px-4 py-2 text-[#F5F0E8]"
                />
              ) : (
                <p className="text-lg text-[#F5F0E8]">{profile?.full_name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A7570] mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  className="w-full bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg px-4 py-2 text-[#F5F0E8] resize-none"
                  rows={4}
                />
              ) : (
                <p className="text-lg text-[#F5F0E8]">{profile?.bio || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A7570] mb-1">
                Member Since
              </label>
              <p className="text-lg text-[#F5F0E8]">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-[rgba(245,240,232,0.06)]">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-[#C9A84C] text-[#0A0A0F] py-2 rounded-lg font-semibold hover:bg-[#D4B85E] transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-[#18181F] text-[#F5F0E8] py-2 rounded-lg font-semibold border border-[rgba(245,240,232,0.1)] hover:bg-[#22222D] transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-[#C9A84C] text-[#0A0A0F] py-2 rounded-lg font-semibold hover:bg-[#D4B85E] transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
