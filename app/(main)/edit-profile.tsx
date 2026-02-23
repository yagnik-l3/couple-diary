import FloatingCard from '@/components/FloatingCard';
import GradientBackground from '@/components/GradientBackground';
import InlineToast from '@/components/InlineToast';
import PremiumDatePicker from '@/components/PremiumDatePicker';
import SkeletonLoader from '@/components/SkeletonLoader';
import StarBackground from '@/components/StarBackground';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { pickAndCropAvatar } from '@/utils/avatarService';
import { useAppState } from '@/utils/store';
import { getProfile, getUserId, updateCoupleData, updateProfile } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
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

const VIBE_OPTIONS = [
    { id: 'chill', label: 'Chill & Relaxed', icon: '😌' },
    { id: 'romantic', label: 'Hopeless Romantics', icon: '💘' },
    { id: 'adventurous', label: 'Adventurous', icon: '🌍' },
    { id: 'intellectual', label: 'Deep Thinkers', icon: '🧠' },
    { id: 'playful', label: 'Playful & Silly', icon: '🤪' },
    { id: 'growth', label: 'Growth Oriented', icon: '🌱' },
];

const REMINDER_OPTIONS = [
    { id: '09:00', label: 'Morning', sub: '9:00 AM', icon: '☀️' },
    { id: '18:00', label: 'Evening', sub: '6:00 PM', icon: '🌆' },
    { id: '21:00', label: 'Night', sub: '9:00 PM', icon: '🌙' },
];

export default function EditProfileScreen() {
    const router = useRouter();
    const { state, update } = useAppState();

    // Personal State
    const [firstName, setFirstName] = useState(state.userFirstName);
    const [lastName, setLastName] = useState(state.userLastName);
    const [gender, setGender] = useState(state.userGender || '');
    const [birthDate, setBirthDate] = useState(state.userBirthDate ? new Date(state.userBirthDate) : new Date());
    const [reminderTime, setReminderTime] = useState(state.reminderTime || '');

    // Couple State
    const [relationshipDate, setRelationshipDate] = useState(state.relationshipDate ? new Date(state.relationshipDate) : new Date());
    const [selectedTopics, setSelectedTopics] = useState<string[]>(state.topicPreferences || []);
    const [coupleVibe, setCoupleVibe] = useState(state.coupleVibe || '');

    // Metadata
    const [isEditor, setIsEditor] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [partnerName, setPartnerName] = useState('Partner');

    // UI State
    const [showRelPicker, setShowRelPicker] = useState(false);
    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(state.avatarUrl || '');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    };

    const handleAvatarPick = async () => {
        setUploadingAvatar(true);
        try {
            const url = await pickAndCropAvatar();
            if (url) {
                setAvatarUrl(url);
                update({ avatarUrl: url });
            }
        } catch (err: any) {
            showToast(err.message || 'Failed to upload photo', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Fetch latest profile data
    React.useEffect(() => {
        (async () => {
            try {
                const userId = await getUserId();
                const profile = await getProfile();
                if (profile && userId) {
                    setFirstName(profile.first_name || profile.name?.split(' ')[0] || '');
                    setLastName(profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '');
                    setGender(profile.gender || '');
                    if (profile.relationship_date) setRelationshipDate(new Date(profile.relationship_date));
                    if (profile.birth_date) setBirthDate(new Date(profile.birth_date));
                    if (profile.reminder_time) setReminderTime(profile.reminder_time);

                    if (profile.topic_preferences) setSelectedTopics(profile.topic_preferences);
                    if (profile.couple_vibe) setCoupleVibe(profile.couple_vibe);
                    if (profile.avatar_url) setAvatarUrl(profile.avatar_url);

                    if (profile.partner_name) setPartnerName(profile.partner_name);

                    // Determine if editor
                    // If no editor set yet (old data), assume current user can edit for now or default to user_a logic if we had it
                    // But our migration set defaults, so couple_editor_id should be present if paired
                    if (profile.couple_editor_id) {
                        setIsEditor(profile.couple_editor_id === userId);
                    } else {
                        // If not paired or something, user can edit their own stuff implies no couple data anyway
                        setIsEditor(true);
                    }

                    // Sync store
                    update({
                        userFirstName: profile.first_name,
                        userLastName: profile.last_name,
                        userGender: profile.gender,
                        relationshipDate: profile.relationship_date,
                        userBirthDate: profile.birth_date,
                        topicPreferences: profile.topic_preferences,
                        coupleVibe: profile.couple_vibe,
                        reminderTime: profile.reminder_time,
                        coupleEditorId: profile.couple_editor_id,
                    });
                }
            } catch (e) {
                console.error('Failed to refresh profile', e);
            } finally {
                setIsLoadingProfile(false);
            }
        })();
    }, []);

    const toggleTopic = (id: string) => {
        if (!isEditor) return;
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) return;

        setLoading(true);
        try {
            // 1. Update Profile (Personal)
            const profileUpdates = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                gender,
                birth_date: birthDate.toISOString(),
                reminder_time: reminderTime,
            } as any;

            await updateProfile(profileUpdates);

            // 2. Update Couple (Shared) - only if editor
            if (isEditor) {
                try {
                    await updateCoupleData({
                        relationship_date: relationshipDate.toISOString().split('T')[0],
                        topic_preferences: selectedTopics,
                        couple_vibe: coupleVibe,
                    });
                } catch (coupleErr: any) {
                    if (!coupleErr.message?.includes('Not paired')) {
                        console.warn('Could not update couple data:', coupleErr);
                    }
                }
            }

            // 3. Update Local Store
            update({
                userFirstName: firstName.trim(),
                userLastName: lastName.trim(),
                userGender: gender as any,
                relationshipDate: relationshipDate.toISOString(),
                userBirthDate: birthDate.toISOString(),
                topicPreferences: selectedTopics,
                coupleVibe,
                reminderTime,
            });

            router.back();
        } catch (error) {
            console.error(error);
            showToast('Failed to update profile. Please try again.', 'error');
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
        return (
            <>
                <TouchableOpacity onPress={() => setShow(true)} style={styles.dateButton}>
                    <Text style={styles.dateButtonText}>{formatDate(value)}</Text>
                </TouchableOpacity>
                <PremiumDatePicker
                    visible={show}
                    onClose={() => setShow(false)}
                    initialDate={value}
                    maxDate={maxDate}
                    onDateSelected={onChange}
                />
            </>
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

            {/* Inline Toast */}
            {toast && (
                <View style={{ paddingHorizontal: Spacing.lg }}>
                    <InlineToast
                        message={toast.message}
                        visible={!!toast}
                        type={toast.type}
                        duration={4000}
                        onHide={() => setToast(null)}
                    />
                </View>
            )}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {isLoadingProfile ? (
                        <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
                            <View style={{ alignItems: 'center' }}><SkeletonLoader.Avatar size={100} /></View>
                            <SkeletonLoader.Line height={50} />
                            <SkeletonLoader.Line height={50} />
                            <SkeletonLoader.Card height={200} />
                        </View>
                    ) : (
                        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.form}>

                            {/* ─── SECTION 1: PERSONAL DETAILS ─────────────────── */}
                            <Text style={styles.sectionTitle}>Personal Details</Text>

                            {/* Avatar Picker */}
                            <View style={styles.avatarSection}>
                                <TouchableOpacity onPress={handleAvatarPick} disabled={uploadingAvatar} style={styles.avatarTouchable}>
                                    <View style={styles.avatarContainer}>
                                        {avatarUrl ? (
                                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarPlaceholderIcon}>👤</Text>
                                            </View>
                                        )}
                                        {uploadingAvatar ? (
                                            <View style={styles.avatarOverlay}>
                                                <ActivityIndicator color="#fff" />
                                            </View>
                                        ) : (
                                            <View style={styles.cameraIcon}>
                                                <Text style={{ fontSize: 14 }}>📷</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.avatarHint}>Tap to change photo</Text>
                            </View>

                            {/* Email */}
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>📧</Text>
                                <TextInput
                                    style={styles.input}
                                    value={state.userEmail}
                                    editable={false}
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>

                            {/* Names */}
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>First Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            placeholder="First Name"
                                            placeholderTextColor={Colors.textMuted}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: Spacing.md }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Last Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            value={lastName}
                                            onChangeText={setLastName}
                                            placeholder="Last Name"
                                            placeholderTextColor={Colors.textMuted}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Gender */}
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.grid}>
                                {GENDER_OPTIONS.map((g) => (
                                    <TouchableOpacity
                                        key={g.id}
                                        style={[styles.chip, gender === g.id && styles.chipSelected]}
                                        onPress={() => setGender(g.id)}
                                    >
                                        <Text style={styles.chipIcon}>{g.icon}</Text>
                                        <Text style={[styles.chipLabel, gender === g.id && styles.chipLabelSelected]}>
                                            {g.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Birthdate */}
                            <Text style={styles.label}>Birthdate</Text>
                            <FloatingCard style={styles.inputCardRow}>
                                {renderDatePicker(birthDate, setBirthDate, showBirthPicker, setShowBirthPicker, new Date())}
                            </FloatingCard>

                            {/* Reminder Time */}
                            <Text style={styles.label}>Daily Reminder Time</Text>
                            <View style={styles.grid}>
                                {REMINDER_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[styles.cardOption, reminderTime === opt.id && styles.cardOptionSelected]}
                                        onPress={() => setReminderTime(opt.id)}
                                    >
                                        <Text style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</Text>
                                        <Text style={styles.cardTitle}>{opt.label}</Text>
                                        <Text style={styles.cardSub}>{opt.sub}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.divider} />

                            {/* ─── SECTION 2: COUPLE SETTINGS ───────────────────── */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Couple Settings</Text>
                                {!isEditor && (
                                    <View style={styles.lockedBadge}>
                                        <Text style={styles.lockedText}>🔒 Managed by {partnerName}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Relationship Date */}
                            <Text style={styles.label}>Relationship Start Date</Text>
                            <FloatingCard style={[styles.inputCardRow, !isEditor && styles.disabledContainer]}>
                                {isEditor ? (
                                    renderDatePicker(relationshipDate, setRelationshipDate, showRelPicker, setShowRelPicker, new Date())
                                ) : (
                                    <Text style={styles.dateButtonText}>{formatDate(relationshipDate)}</Text>
                                )}
                            </FloatingCard>

                            {/* Couple Vibe */}
                            <Text style={styles.label}>Couple Vibe</Text>
                            <View style={[styles.grid, !isEditor && { opacity: 0.6 }]}>
                                {VIBE_OPTIONS.map((v) => (
                                    <TouchableOpacity
                                        key={v.id}
                                        disabled={!isEditor}
                                        style={[styles.chip, coupleVibe === v.id && styles.chipSelected]}
                                        onPress={() => setCoupleVibe(v.id)}
                                    >
                                        <Text style={styles.chipIcon}>{v.icon}</Text>
                                        <Text style={[styles.chipLabel, coupleVibe === v.id && styles.chipLabelSelected]}>
                                            {v.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Topic Preferences */}
                            <Text style={styles.label}>Daily Question Topics</Text>
                            <View style={[styles.grid, !isEditor && { opacity: 0.6 }]}>
                                {TOPIC_OPTIONS.map((t) => {
                                    const isSelected = selectedTopics.includes(t.id);
                                    return (
                                        <TouchableOpacity
                                            key={t.id}
                                            disabled={!isEditor}
                                            style={[styles.chip, isSelected && styles.chipSelected]}
                                            onPress={() => toggleTopic(t.id)}
                                        >
                                            <Text style={styles.chipIcon}>{t.icon}</Text>
                                            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                                                {t.label}
                                            </Text>
                                            {isSelected && <Text style={{ color: Colors.softPink, marginLeft: 4 }}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <Text style={styles.helperText}>{isEditor ? 'Select at least 3 topics' : 'Partner edits these preferences'}</Text>

                            <View style={{ height: 40 }} />
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Spacing.xs,
        paddingHorizontal: Spacing.lg,
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
    sectionTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    lockedBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    lockedText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        fontSize: 10,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: Spacing.xl,
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
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg || Colors.white08,
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
    inputCardRow: {
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    disabledContainer: {
        opacity: 0.6,
    },
    row: {
        flexDirection: 'row',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    chip: {
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
    chipSelected: {
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        borderColor: Colors.softPink,
    },
    chipIcon: {
        fontSize: 16,
    },
    chipLabel: {
        ...Typography.caption,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    chipLabelSelected: {
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    cardOption: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: Colors.white08,
        padding: Spacing.md,
        borderRadius: Radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardOptionSelected: {
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        borderColor: Colors.softPink,
    },
    cardTitle: {
        ...Typography.bodySemiBold,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    cardSub: {
        ...Typography.caption,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    dateButton: {
        flex: 1,
    },
    dateButtonText: {
        ...Typography.body,
        color: Colors.textPrimary,
        fontSize: 16,
    },
    pickerWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: Radius.lg,
        marginTop: Spacing.md,
        padding: Spacing.xs,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatarTouchable: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: 'relative',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: Colors.softPink,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.white08,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.white08,
    },
    avatarPlaceholderIcon: {
        fontSize: 40,
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.softPink,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.deepNavy,
    },
    avatarHint: {
        ...Typography.caption,
        color: Colors.textMuted,
        marginTop: Spacing.sm,
        fontSize: 12,
    },
});
