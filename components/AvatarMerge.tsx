import { Colors, Shadows } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

interface Props {
    avatar1?: ImageSourcePropType;
    avatar2?: ImageSourcePropType;
    size?: number;
}

const DEFAULT_AVATAR_1 = '👤';
const DEFAULT_AVATAR_2 = '👤';

export default function AvatarMerge({ avatar1, avatar2, size = 60 }: Props) {
    const avatarSize = size;
    const overlap = size * 0.3;

    return (
        <View style={[styles.container, { height: avatarSize }]}>
            <View style={[styles.avatarWrapper, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <LinearGradient
                    colors={['#6C3DB8', '#9B4DCA']}
                    style={[styles.avatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                >
                    {avatar1 ? (
                        <Image source={avatar1} style={styles.image} />
                    ) : (
                        <View style={styles.placeholder}>
                            <View style={[styles.placeholderDot, { width: avatarSize * 0.3, height: avatarSize * 0.3, borderRadius: avatarSize * 0.15, top: avatarSize * 0.2 }]} />
                            <View style={[styles.placeholderBody, { width: avatarSize * 0.5, height: avatarSize * 0.25, borderRadius: avatarSize * 0.25, bottom: avatarSize * 0.08 }]} />
                        </View>
                    )}
                </LinearGradient>
            </View>
            <View
                style={[
                    styles.avatarWrapper,
                    {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                        marginLeft: -overlap,
                    },
                ]}
            >
                <LinearGradient
                    colors={[Colors.softPink, Colors.rosePink]}
                    style={[styles.avatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                >
                    {avatar2 ? (
                        <Image source={avatar2} style={styles.image} />
                    ) : (
                        <View style={styles.placeholder}>
                            <View style={[styles.placeholderDot, { width: avatarSize * 0.3, height: avatarSize * 0.3, borderRadius: avatarSize * 0.15, top: avatarSize * 0.2 }]} />
                            <View style={[styles.placeholderBody, { width: avatarSize * 0.5, height: avatarSize * 0.25, borderRadius: avatarSize * 0.25, bottom: avatarSize * 0.08 }]} />
                        </View>
                    )}
                </LinearGradient>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        borderWidth: 2,
        borderColor: Colors.deepNavy,
        ...Shadows.soft,
    },
    avatarInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderDot: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    placeholderBody: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
});
