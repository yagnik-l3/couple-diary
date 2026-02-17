import { Question } from '@/types/database';
import { getTodayDate } from './journalStore';
import { supabase } from './supabase';

export const QuestionService = {
    /**
     * Get today's question for the couple.
     * If one doesn't exist, it assigns a new one from the pool.
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

        // 2. Check if a daily question already exists for today
        let { data: dailyQ } = await supabase
            .from('daily_questions')
            .select('id, question:questions(*)')
            .eq('couple_id', profile.couple_id)
            .eq('date', today)
            .maybeSingle();

        // 3. If exists, return it
        if (dailyQ && dailyQ.question) {
            const q = dailyQ.question as unknown as Question;
            return { ...q, daily_id: dailyQ.id };
        }

        // 4. If not, pick a random question from the pool
        // (In a real app, we'd filter out used questions, but for now random is fine)
        const { data: randomQ } = await supabase
            .from('questions')
            .select('*')
            .limit(1)
            .maybeSingle();
        // Note: In production you'd use a postgres function or a more complex query to get a random unused one

        // If no questions in pool, return a fallback (or seed one)
        let questionToUse = randomQ;
        if (!questionToUse) {
            // Fallback seed if pool is empty
            const { data: seeded } = await supabase
                .from('questions')
                .insert({
                    text: "What's one small thing your partner does that always makes you smile?",
                    category: 'gratitude'
                })
                .select()
                .single();
            questionToUse = seeded;
        }

        // 5. Insert into daily_questions
        // Handle race condition: if partner just inserted it, this insert will fail (unique constraint),
        // so we catch error and fetch again.
        const { data: newDaily, error: insertError } = await supabase
            .from('daily_questions')
            .insert({
                couple_id: profile.couple_id,
                question_id: questionToUse!.id,
                date: today
            })
            .select('id')
            .single();

        if (insertError) {
            // Likely race condition — fetch the one that was just created
            const { data: existing } = await supabase
                .from('daily_questions')
                .select('id, question:questions(*)')
                .eq('couple_id', profile.couple_id)
                .eq('date', today)
                .single();

            if (existing && existing.question) {
                const q = existing.question as unknown as Question;
                return { ...q, daily_id: existing.id };
            }
            throw insertError;
        }

        return { ...questionToUse!, daily_id: newDaily.id };
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
};
