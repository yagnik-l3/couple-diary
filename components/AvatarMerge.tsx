import { Colors, Shadows } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

interface Props {
    avatar1?: ImageSourcePropType;
    avatar2?: ImageSourcePropType;
    avatar1Uri?: string;
    avatar2Uri?: string;
    size?: number;
}

export default function AvatarMerge({ avatar1, avatar2, avatar1Uri, avatar2Uri, size = 60 }: Props) {
    const avatarSize = size;
    const overlap = size * 0.3;

    const renderAvatar = (
        source: ImageSourcePropType | undefined,
        uri: string | undefined,
        gradientColors: readonly [string, string, ...string[]],
        style?: any,
    ) => (
        <View style={[styles.avatarWrapper, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }, style]}>
            {uri ? (
                <Image
                    source={{ uri }}
                    style={[styles.image, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                />
            ) : source ? (
                <Image source={source} style={[styles.image, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
            ) : (
                <LinearGradient
                    colors={gradientColors}
                    style={[styles.avatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                >
                    <View style={styles.placeholder}>
                        <View style={[styles.placeholderDot, { width: avatarSize * 0.3, height: avatarSize * 0.3, borderRadius: avatarSize * 0.15, top: avatarSize * 0.2 }]} />
                        <View style={[styles.placeholderBody, { width: avatarSize * 0.5, height: avatarSize * 0.25, borderRadius: avatarSize * 0.25, bottom: avatarSize * 0.08 }]} />
                    </View>
                </LinearGradient>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { height: avatarSize }]}>
            {renderAvatar(avatar1, avatar1Uri, ['#6C3DB8', '#9B4DCA'])}
            {renderAvatar(avatar2, avatar2Uri, [Colors.softPink, Colors.rosePink], { marginLeft: -overlap })}
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
