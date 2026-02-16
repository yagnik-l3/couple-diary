import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppState } from '@/utils/store';
import { updateCoupleData, updateProfile } from '@/utils/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const GENDER_OPTIONS = [
    { id: 'male', label: 'Male', icon: '👨' },
    { id: 'female', label: 'Female', icon: '👩' },
    { id: 'non-binary', label: 'Non-Binary', icon: '🧑' },
    { id: 'prefer-not', label: 'Prefer Not to Say', icon: '✨' },
];

const TOPIC_OPTIONS = [
    { id: 'love', label: 'Love Languages', icon: '💕' },
    { id: 'dreams', label: 'Dreams & Goals', icon: '🌠' },
    { id: 'intimacy', label: 'Intimacy', icon: '🔥' },
    { id: 'fun', label: 'Fun & Hypothetical', icon: '🎭' },
    { id: 'deep', label: 'Deep Conversations', icon: '🌊' },
    { id: 'memories', label: 'Past Memories', icon: '📸' },
    { id: 'future', label: 'Future Together', icon: '🚀' },
    { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
];

export default function EditProfileScreen() {
    const router = useRouter();
    const { state, update } = useAppState();

    const [firstName, setFirstName] = useState(state.userFirstName);
    const [lastName, setLastName] = useState(state.userLastName);
    const [gender, setGender] = useState(state.userGender || '');
    const [relationshipDate, setRelationshipDate] = useState(state.relationshipDate ? new Date(state.relationshipDate) : new Date());
    const [birthDate, setBirthDate] = useState(state.userBirthDate ? new Date(state.userBirthDate) : new Date());
    const [selectedTopics, setSelectedTopics] = useState<string[]>(state.topicPreferences || []);

    // DateTimePicker visibility states
    const [showRelPicker, setShowRelPicker] = useState(false);
    const [showBirthPicker, setShowBirthPicker] = useState(false);

    const [loading, setLoading] = useState(false);

    // Fetch latest profile data on mount to ensure we have the latest preferences
    React.useEffect(() => {
        (async () => {
            try {
                const { getProfile } = require('@/utils/supabase');
                const profile = await getProfile();
                if (profile) {
                    setFirstName(profile.first_name || profile.name?.split(' ')[0] || '');
                    setLastName(profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '');
                    setGender(profile.gender || '');
                    if (profile.relationship_date) setRelationshipDate(new Date(profile.relationship_date));
                    if (profile.birth_date) setBirthDate(new Date(profile.birth_date));
                    if (profile.topic_preferences) setSelectedTopics(profile.topic_preferences);

                    // Sync with store just in case
                    update({
                        userFirstName: profile.first_name,
                        userLastName: profile.last_name,
                        userGender: profile.gender,
                        relationshipDate: profile.relationship_date,
                        userBirthDate: profile.birth_date,
                        topicPreferences: profile.topic_preferences,
                    });
                }
            } catch (e) {
                console.error('Failed to refresh profile', e);
            }
        })();
    }, []);

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) return;

        setLoading(true);
        try {
            // Profile-specific fields (profiles table)
            const profileUpdates = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                gender,
                birth_date: birthDate.toISOString(),
            };
            await updateProfile(profileUpdates);

            // Couple-specific fields (couples table) - only if paired
            try {
                await updateCoupleData({
                    relationship_date: relationshipDate.toISOString().split('T')[0],
                    topic_preferences: selectedTopics,
                });
            } catch (coupleErr: any) {
                // Silently skip if not paired yet
                if (!coupleErr.message?.includes('Not paired')) {
                    console.warn('Could not update couple data:', coupleErr);
                }
            }

            update({
                userFirstName: firstName.trim(),
                userLastName: lastName.trim(),
                userGender: gender as any,
                relationshipDate: relationshipDate.toISOString(),
                userBirthDate: birthDate.toISOString(),
                topicPreferences: selectedTopics,
            });

            router.back();
        } catch (error) {
            console.error(error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const renderDatePicker = (
        value: Date,
        onChange: (date: Date) => void,
        show: boolean,
        setShow: (s: boolean) => void,
        maxDate?: Date
    ) => {
        if (Platform.OS === 'android') {
            return (
                <>
                    <TouchableOpacity onPress={() => setShow(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>{formatDate(value)}</Text>
                    </TouchableOpacity>
                    {show && (
                        <DateTimePicker
                            value={value}
                            mode="date"
                            display="default"
                            maximumDate={maxDate}
                            onChange={(event: any, selectedDate?: Date) => {
                                setShow(false);
                                if (selectedDate) onChange(selectedDate);
                            }}
                        />
                    )}
                </>
            );
        }

        // iOS
        return (
            <DateTimePicker
                value={value}
                mode="date"
                display="default"
                maximumDate={maxDate}
                onChange={(event: any, selectedDate?: Date) => {
                    if (selectedDate) onChange(selectedDate);
                }}
                themeVariant="dark"
                style={{ alignSelf: 'flex-start' }}
            />
        );
    };


    return (
        <GradientBackground>
            <StarBackground />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
                    {loading ? <ActivityIndicator color={Colors.textPrimary} /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.form}>
                        {/* Email */}
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>📧</Text>
                            <TextInput
                                style={styles.input}
                                value={state.userEmail}
                                onChangeText={setLastName}
                                placeholder="Email"
                                editable={false}
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        {/* First Name */}
                        <Text style={styles.label}>First Name</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>✨</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        {/* Last Name */}
                        <Text style={styles.label}>Last Name</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>🌟</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last Name"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        {/* Gender */}
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderGrid}>
                            {GENDER_OPTIONS.map((g) => (
                                <TouchableOpacity
                                    key={g.id}
                                    style={[styles.genderChip, gender === g.id && styles.genderChipSelected]}
                                    onPress={() => setGender(g.id)}
                                >
                                    <Text style={styles.genderIcon}>{g.icon}</Text>
                                    <Text style={[styles.genderLabel, gender === g.id && styles.genderLabelSelected]}>
                                        {g.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Topic Preferences */}
                        <Text style={styles.label}>Daily Question Topics</Text>
                        <View style={styles.genderGrid}>
                            {TOPIC_OPTIONS.map((t) => {
                                const isSelected = selectedTopics.includes(t.id);
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[styles.genderChip, isSelected && styles.genderChipSelected]}
                                        onPress={() => toggleTopic(t.id)}
                                    >
                                        <Text style={styles.genderIcon}>{t.icon}</Text>
                                        <Text style={[styles.genderLabel, isSelected && styles.genderLabelSelected]}>
                                            {t.label}
                                        </Text>
                                        {isSelected && <Text style={{ color: Colors.softPink, marginLeft: 4 }}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <Text style={styles.helperText}>Select at least 3 topics</Text>

                        {/* Relationship Date */}
                        <Text style={styles.label}>Relationship Start Date</Text>
                        <FloatingCard style={styles.inputCardRow}>
                            {renderDatePicker(relationshipDate, setRelationshipDate, showRelPicker, setShowRelPicker, new Date())}
                        </FloatingCard>

                        {/* Birthdate */}
                        <Text style={styles.label}>Birthdate</Text>
                        <FloatingCard style={styles.inputCardRow}>
                            {renderDatePicker(birthDate, setBirthDate, showBirthPicker, setShowBirthPicker, new Date())}
                        </FloatingCard>

                        {/* Email (Read Only) */}
                        {/* <Text style={styles.label}>Email</Text>
                        <FloatingCard style={[styles.inputCard, styles.disabledCard]}>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={state.userEmail}
                                editable={false}
                            />
                        </FloatingCard> */}


                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
    },
    backText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    title: {
        ...Typography.bodySemiBold,
        fontSize: 17,
        color: Colors.textPrimary,
    },
    saveButton: {
        padding: Spacing.sm,
        minWidth: 50,
        alignItems: 'flex-end',
    },
    saveText: {
        ...Typography.bodySemiBold,
        color: Colors.softPink,
    },
    form: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
    },
    label: {
        ...Typography.caption,
        color: Colors.textMuted,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
        marginLeft: 4,
    },
    helperText: {
        ...Typography.caption,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
        marginLeft: 4,
    },
    // Matches onboarding.tsx inputWrapper
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg || Colors.white08, // Fallback if inputBg not defined in theme yet, but onboarding uses it
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.inputBorder || Colors.white08,
        paddingHorizontal: Spacing.md,
        width: '100%',
    },
    inputIcon: {
        fontSize: 18,
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        ...Typography.body,
        fontSize: 16,
        color: Colors.textPrimary,
        paddingVertical: Spacing.md,
    },
    inputCard: {
        padding: Spacing.md,
    },
    inputCardRow: {
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    disabledCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    disabledInput: {
        color: Colors.textMuted,
    },
    genderGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    genderChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.white08,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    genderChipSelected: {
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        borderColor: Colors.softPink,
    },
    genderIcon: {
        fontSize: 16,
    },
    genderLabel: {
        ...Typography.caption,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    genderLabelSelected: {
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    dateButton: {
        flex: 1,
    },
    dateButtonText: {
        ...Typography.body,
        color: Colors.textPrimary,
        fontSize: 16,
    },
});
