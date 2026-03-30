'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);
      
      // Load chat history from Supabase
      const { data: history } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (history) {
        const userMessages = history.map((m: { id: string; user_id: string; user_message: string; ai_response: string; created_at: string }) => ({
          id: m.id,
          user_id: m.user_id,
          role: 'user' as const,
          content: m.user_message,
          created_at: m.created_at,
        }));
        const aiMessages = history.filter((m: { ai_response: string }) => m.ai_response).map((m: { id: string; user_id: string; ai_response: string; created_at: string }) => ({
          id: m.id + '_response',
          user_id: m.user_id,
          role: 'assistant' as const,
          content: m.ai_response,
          created_at: m.created_at,
        }));
        const allMessages = [...userMessages, ...aiMessages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(allMessages);
      }

      setPageLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Search knowledge base for relevant answer
    const { data: kbArticles } = await supabase
      .from('knowledge_base')
      .select('question, answer')
      .ilike('question', `%${userMessage}%`)
      .limit(3);

    if (kbArticles && kbArticles.length > 0) {
      return kbArticles[0].answer;
    }

    // Fallback responses for music production
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('eq') || lowerMessage.includes('засах')) {
      return 'EQ (Equalizer) нь давтамжийг засах хэрэгсэл юм. Bass-ийг 80Hz орчимд дээшлүүлж, high frequencies-ийг 10kHz орчимд тайрч болно. FL Studio дээр Power EQ эсвэл Fruity Parametric EQ 2 ашиглаж болно.';
    }
    if (lowerMessage.includes('compress') || lowerMessage.includes('компресс')) {
      return 'Компрессорын үндсэн параметр: Threshold (-20dB орчим), Ratio (4:1), Attack (10ms), Release (100ms). Vocals-нд soft knee ашиглана.';
    }
    if (lowerMessage.includes('mix') || lowerMessage.includes('микс')) {
      return 'Mixing-ийн үндсэн алхам: 1. Dry/wet balance тохируулах, 2. EQ-р давтамжийн зөрүү заах, 3. Компрессор ашиглан динамик хянах, 4. Reverb/Delay-р space үүсгэх.';
    }
    if (lowerMessage.includes('piano roll')) {
      return 'Piano Roll нээхийн тулд: Pattern-ээс нэгэн хоёройг сонгож, F7 товчийг дарна. Эсвэл прав талын товчлуурын Piano Roll товчийг дараарай.';
    }
    if (lowerMessage.includes('beat') || lowerMessage.includes('драм')) {
      return 'Drum pattern хийх: Step Sequencer дээр + товчийг дараад Drum kit сонгож, хоолойгоор нь Pattern хийнэ. Kick, Snare, Hi-Hat хоолойнуудыг ашиглаарай.';
    }

    return 'Уучлаарай, энэ талаар надад мэдээлэл байхгүй байна. EQ, Compression, Mixing, Piano Roll, Drum Pattern зэрэг сэдвээр асуугаарай!';
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !user) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Save user message to Supabase
      const { data: savedMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          user_message: userMessage,
          ai_response: '',
        })
        .select()
        .single();

      if (error) throw error;

      // Generate AI response
      const aiResponse = await generateAIResponse(userMessage);

      // Update message with AI response
      await supabase
        .from('chat_messages')
        .update({ ai_response: aiResponse })
        .eq('id', savedMessage.id);

      setMessages((prev) => [
        ...prev,
        {
          id: savedMessage.id,
          user_id: user.id,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString(),
        },
        {
          id: savedMessage.id + '_response',
          user_id: user.id,
          role: 'assistant',
          content: aiResponse,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      toast.error(message);
      setInputValue(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background from-background via-background to-background flex items-center justify-center">
        <div className="text-xl text-text-muted">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        <h1 className="text-3xl font-bold mb-4">🤖 AI Music Assistant</h1>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pb-4">
          {messages.length === 0 ? (
            <div className="card text-center text-text-muted mt-8">
              <p className="text-xl mb-2">No messages yet</p>
              <p>Ask me anything about music production!</p>
            </div>
           ) : (
             messages.map((message) => (
               <div key={message.id} className="space-y-2">
                 {message.role === 'user' ? (
                   <div className="flex justify-end">
                     <div className="max-w-xs bg-purple-600 rounded-lg p-4 text-white">
                       {message.content}
                     </div>
                   </div>
                 ) : (
                   <div className="flex justify-start">
                     <div className="max-w-xs bg-surface rounded-lg p-4 text-text border border-border">
                       {message.content}
                     </div>
                   </div>
                 )}
               </div>
             ))
           )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="card sticky bottom-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about music production..."
              disabled={isLoading}
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
