'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { toast } from 'sonner';

interface MelodyVariation {
  id: string;
  original_audio_id: string | null;
  variation_index: number;
  midi_data: string;
  audio_preview_url: string;
  created_at: string;
}

export default function MelodyGeneratorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generations, setGenerations] = useState<MelodyVariation[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Load melody variations from Supabase
      const { data } = await supabase
        .from('melody_variations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setGenerations(data || []);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || !user) {
      toast.error('Please enter a melody description');
      return;
    }

    setIsGenerating(true);

    try {
      // Mock generation - in production this would call an Edge Function or API
      // For now, we'll just show the UI works
      const mockVariations = Array.from({ length: 4 }, (_, i) => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        original_audio_id: null,
        variation_index: i + 1,
        midi_data: `Mock melody: ${prompt}`,
        audio_preview_url: '',
        created_at: new Date().toISOString(),
      }));

      // Save to Supabase
      const { data, error } = await supabase
        .from('melody_variations')
        .insert(mockVariations)
        .select();

      if (error) throw error;

      setGenerations((prev) => [...(data || []), ...prev]);
      setPrompt('');
      toast.success('Melody variations created! (Demo mode - AI generation requires backend)');
    } catch (error) {
      toast.error('Failed to generate melody');
    } finally {
      setIsGenerating(false);
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
      <div>
        <h1 className="text-3xl font-bold mb-8 text-[#F5F0E8]">🎹 Melody Generator</h1>

        {/* Generate Form */}
        <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-[#F5F0E8]">Generate New Melody</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#7A7570]">Melody Description</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Happy, uplifting melody in major key, fast tempo"
                className="w-full bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg px-4 py-3 text-[#F5F0E8] resize-none"
                rows={4}
                disabled={isGenerating}
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-[#C9A84C] text-[#0A0A0F] py-3 rounded-lg font-semibold hover:bg-[#D4B85E] transition disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Melody'}
            </button>
            <p className="text-xs text-[#7A7570] text-center">Demo mode - AI generation requires backend setup</p>
          </form>
        </div>

        {/* Generated Melodies */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-[#F5F0E8]">Generated Melodies</h2>

          {generations.length === 0 ? (
            <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-8 text-center">
              <p className="text-lg text-[#7A7570]">No melodies generated yet</p>
              <p className="text-sm mt-2 text-[#7A7570]">Describe your desired melody above to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {generations.map((gen) => (
                <div key={gen.id} className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-[#F5F0E8]">
                        Variation {gen.variation_index}
                      </h3>
                      <p className="text-[#7A7570] text-sm mt-1">
                        {new Date(gen.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#0A0A0F] rounded-lg p-4">
                    <p className="text-sm text-[#7A7570]">{gen.midi_data}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
