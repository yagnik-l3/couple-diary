import { Stack } from 'expo-router';

export default function MainLayout() {
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
