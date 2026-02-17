import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET = 'avatars';
const AVATAR_SIZE = 300;

/**
 * Pick an image from gallery with 1:1 crop, resize, and upload to Supabase Storage.
 * Returns the public URL of the uploaded avatar.
 */
export async function pickAndCropAvatar(): Promise<string | null> {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Photo library permission is required to upload a profile picture.');
    }

    // Launch picker with built-in 1:1 cropper
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
        return null; // User cancelled
    }

    const picked = result.assets[0];

    // Resize to 300x300
    const manipulated = await ImageManipulator.manipulateAsync(
        picked.uri,
        [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    if (!manipulated.uri) {
        throw new Error('Failed to process image');
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Upload to Supabase
    let avatarUrl: string;
    try {
        const response = await fetch(manipulated.uri);
        const blob = await response.blob();

        const fileExt = manipulated.uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const filePath = `${user.id}/avatar.jpg`; // Consistent file path for user's avatar

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, blob, {
                contentType: `image/${fileExt}`,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filePath);

        // Add cache-buster to force refresh
        avatarUrl = `${publicUrl}?t=${Date.now()}`;
    } catch (error) {
        console.error('Avatar upload failed:', error);
        throw error;
    }

    // Save URL to profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

    if (updateError) throw updateError;

    return avatarUrl;
}

/**
 * Get the public avatar URL for a given user ID.
 */
export function getAvatarUrl(userId: string): string {
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(`${userId}/avatar.jpg`);
    return publicUrl;
}

/**
 * Remove the current user's avatar.
 */
export async function removeAvatar(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const filePath = `${user.id}/avatar.jpg`;

    await supabase.storage.from(BUCKET).remove([filePath]);

    await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
}
