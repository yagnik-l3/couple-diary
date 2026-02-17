import { getProfile } from '@/utils/supabase';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function MainLayout() {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                if (!profile?.couple_id) {
                    // Not paired — send back to onboarding invite step
                    router.replace('/onboarding?resume=invite');
                    return;
                }
            } catch {
                // If profile fetch fails, let them through (auth guard handles the rest)
            } finally {
                setChecked(true);
            }
        })();
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0B0D2E' },
                animation: 'fade',
            }}
        />
    );
}
