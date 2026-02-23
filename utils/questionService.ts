import { Question } from '@/types/database';
import { getTodayDate } from './journalStore';
import { supabase } from './supabase';

export const QuestionService = {
    /**
     * Get today's question for the couple (UTC).
     * Uses a Postgres RPC to handle random assignment, non-repetition, and race conditions.
     */
    getTodayQuestion: async (): Promise<(Question & { daily_id: string }) | null> => {
        const today = getTodayDate();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Get user's profile to find couple_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('couple_id')
            .eq('id', user.id)
            .single();

        if (!profile?.couple_id) return null;

        // 2. Call the RPC to get or assign today's question
        const { data, error } = await supabase.rpc('get_or_assign_daily_question', {
            p_couple_id: profile.couple_id,
            p_date: today
        });

        if (error) {
            console.error('Error fetching/assigning daily question:', error);
            throw error;
        }

        if (!data || data.length === 0) return null;

        // The RPC returns { id, text, category, daily_id }
        const result = data[0];
        return {
            id: result.id,
            text: result.text,
            category: result.category,
            daily_id: result.daily_id,
            created_at: result.created_at || new Date().toISOString()
        };
    },

    /**
     * Submit an answer for the daily question
     */
    submitAnswer: async (dailyQuestionId: string, content: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('answers')
            .upsert({
                daily_question_id: dailyQuestionId,
                user_id: user.id,
                content: content.trim()
            });

        if (error) throw error;
    },

    /**
     * Check if user and partner have answered today
     */
    getAnswerStatus: async (dailyQuestionId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: answers } = await supabase
            .from('answers')
            .select('user_id')
            .eq('daily_question_id', dailyQuestionId);

        const hasAnswered = answers?.some(a => a.user_id === user.id) ?? false;
        const partnerAnswered = answers?.some(a => a.user_id !== user.id) ?? false;

        return { hasAnswered, partnerAnswered };
    },

    /**
     * Get both answers for the reveal screen
     */
    getRevealAnswers: async (dailyQuestionId: string) => {
        const { data: answers, error } = await supabase
            .from('answers')
            .select('*, profile:profiles(first_name, avatar_url)')
            .eq('daily_question_id', dailyQuestionId);

        if (error) throw error;
        return answers || [];
    },

    /**
     * Get timeline of all answered daily questions for the couple
     */
    getTimeline: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('couple_id')
            .eq('id', user.id)
            .single();

        if (!profile?.couple_id) return [];

        // Fetch all daily questions for this couple, with question text and answers
        const { data: dailyQuestions, error } = await supabase
            .from('daily_questions')
            .select(`
                id,
                date,
                question:questions(text, category),
                answers(content, user_id, profile:profiles(first_name))
            `)
            .eq('couple_id', profile.couple_id)
            .order('date', { ascending: false });

        if (error) throw error;

        return (dailyQuestions || [])
            .filter(dq => {
                // Only show entries where both partners have answered
                const answers = dq.answers || [];
                return answers.length >= 2;
            })
            .map((dq, i, arr) => {
                const q = dq.question as any;
                const answers = dq.answers || [] as any[];
                const myAnswer = answers.find((a: any) => a.user_id === user.id);
                const partnerAnswer = answers.find((a: any) => a.user_id !== user.id);

                return {
                    id: dq.id,
                    day: arr.length - i,
                    date: dq.date,
                    question: q?.text || '',
                    category: q?.category || 'general',
                    myAnswer: myAnswer?.content || '',
                    partnerAnswer: partnerAnswer?.content || '',
                    partnerName: (partnerAnswer?.profile as any)?.first_name || 'Partner',
                };
            });
    },

    /**
     * Get timeline entries for a specific date range (inclusive).
     * Like getTimeline but with date filtering for weekly batch fetch.
     */
    getTimelineForWeek: async (startDate: string, endDate: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('couple_id')
            .eq('id', user.id)
            .single();

        if (!profile?.couple_id) return [];

        const { data: dailyQuestions, error } = await supabase
            .from('daily_questions')
            .select(`
                id,
                date,
                question:questions(text, category),
                answers(content, user_id, profile:profiles(first_name))
            `)
            .eq('couple_id', profile.couple_id)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) throw error;

        return (dailyQuestions || [])
            .filter(dq => {
                const answers = dq.answers || [];
                return answers.length >= 2;
            })
            .map((dq) => {
                const q = dq.question as any;
                const answers = dq.answers || [] as any[];
                const myAnswer = answers.find((a: any) => a.user_id === user.id);
                const partnerAnswer = answers.find((a: any) => a.user_id !== user.id);

                return {
                    id: dq.id,
                    date: dq.date,
                    question: q?.text || '',
                    category: q?.category || 'general',
                    myAnswer: myAnswer?.content || '',
                    partnerAnswer: partnerAnswer?.content || '',
                    partnerName: (partnerAnswer?.profile as any)?.first_name || 'Partner',
                };
            });
    },

    /**
     * Get or assign daily question for a specific date
     */
    getDailyQuestionByDate: async (date: string): Promise<(Question & { daily_id: string }) | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('couple_id')
            .eq('id', user.id)
            .single();

        if (!profile?.couple_id) return null;

        const { data, error } = await supabase.rpc('get_or_assign_daily_question', {
            p_couple_id: profile.couple_id,
            p_date: date
        });

        if (error) {
            console.error('Error fetching/assigning daily question by date:', error);
            throw error;
        }

        if (!data || data.length === 0) return null;

        const result = data[0];
        return {
            id: result.id,
            text: result.text,
            category: result.category,
            daily_id: result.daily_id,
            created_at: result.created_at || new Date().toISOString()
        };
    },

    /**
     * Check streak validity.
     * Returns: 
     * - 'SAFE': Both answered today or answered yesterday + today still active.
     * - 'AT_RISK': Answered yesterday, but today's is not yet answered by both.
     * - 'LOST': Missed at least one full day.
     */
    checkStreakStatus: async (): Promise<'SAFE' | 'AT_RISK' | 'LOST'> => {
        const todayStr = getTodayDate();
        const { getLastAnsweredDate } = await import('./supabase');
        const lastDate = await getLastAnsweredDate();

        if (!lastDate) return 'SAFE'; // New couple or no answers yet

        const today = new Date(todayStr);
        const last = new Date(lastDate);
        const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 0) {
            return 'SAFE'; // Already answered today
        } else if (diffDays === 1) {
            return 'AT_RISK'; // Answered yesterday, need today's
        } else {
            return 'LOST'; // Missed at least one day
        }
    }
};
