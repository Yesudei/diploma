'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

interface AnalysisResult {
  id: string;
  audio_file_id: string;
  quality_score: number;
  eq_recommendations: Record<string, unknown>;
  compression_settings: Record<string, unknown>;
  frequency_balance: Record<string, unknown>;
  issues_found: string;
  spectrogram_url: string;
  analyzed_at: string;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Load analysis results from Supabase
      const { data } = await supabase
        .from('mixing_analysis')
        .select('*')
        .eq('user_id', session.user.id)
        .order('analyzed_at', { ascending: false });

      setAnalyses(data || []);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

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
        <h1 className="text-3xl font-bold mb-8 text-[#F5F0E8]">📈 Audio Analysis Results</h1>

        {analyses.length === 0 ? (
          <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-8 text-center">
            <p className="text-lg text-[#7A7570] mb-4">No analyses yet</p>
            <p className="text-[#7A7570]">Upload and analyze audio files to see results here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#F5F0E8]">Audio Analysis</h3>
                    <p className="text-[#7A7570] text-sm">
                      {new Date(analysis.analyzed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#C9A84C]">{analysis.quality_score}</div>
                    <div className="text-xs text-[#7A7570]">Quality Score</div>
                  </div>
                </div>
                {analysis.issues_found && (
                  <div className="bg-[#0A0A0F] rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-[#F5F0E8] mb-2">Issues Found</h4>
                    <p className="text-[#7A7570] text-sm">{analysis.issues_found}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
