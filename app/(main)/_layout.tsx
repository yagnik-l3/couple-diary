import { getProfile } from '@/utils/supabase';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

export default function MainLayout() {
    const router = useRouter();
    const segments = useSegments();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                const isPaired = !!profile?.couple_id;
                const onInviteScreen = segments.includes('invite' as never);

                if (!isPaired && !onInviteScreen) {
                    router.replace('/(main)/invite');
                }
            } catch {
                // If profile fetch fails, let them through (auth guard handles the rest)
            } finally {
                setChecked(true);
            }
        })();
    }, [segments]);

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
