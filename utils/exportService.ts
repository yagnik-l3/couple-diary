import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const SAVED_DIRECTORY_KEY = '@couple_diary_export_directory';

/**
 * Service to handle data export in plain text format
 */
export const ExportService = {
    /**
     * Internal helper to save file directly or share
     */
    saveFile: async (content: string, filename: string) => {
        try {
            if (Platform.OS === 'android') {
                const { StorageAccessFramework } = FileSystem as any;

                // 1. Get saved directory URI
                let directoryUri = await AsyncStorage.getItem(SAVED_DIRECTORY_KEY);

                // 2. Request permission if not saved
                if (!directoryUri) {
                    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                        directoryUri = permissions.directoryUri;
                        await AsyncStorage.setItem(SAVED_DIRECTORY_KEY, directoryUri!);
                    } else {
                        // Fallback to sharing if user denies SAF
                        return await ExportService.shareFallback(content, filename);
                    }
                }

                // 3. Create file
                const fileUri = await StorageAccessFramework.createFileAsync(directoryUri, filename, 'text/plain');

                // 4. Write content
                await FileSystem.writeAsStringAsync(fileUri, content, { encoding: 'utf8' });
                return true;
            } else {
                // iOS: Use Sharing sheet (only way to "Save to Files")
                return await ExportService.shareFallback(content, filename);
            }
        } catch (error) {
            console.error('Save file failed:', error);
            // If SAF fails (e.g. folder moved), clear storage and try sharing
            await AsyncStorage.removeItem(SAVED_DIRECTORY_KEY);
            return await ExportService.shareFallback(content, filename);
        }
    },

    /**
     * Fallback to sharing sheet
     */
    shareFallback: async (content: string, filename: string) => {
        const fileUri = `${(FileSystem as any).cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, content, { encoding: 'utf8' });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
            return true;
        } else {
            throw new Error('Sharing is not available on this device');
        }
    },

    /**
     * Export the couple's shared timeline (Memories)
     */
    exportTimeline: async (coupleId: string, currentUserId: string) => {
        try {
            const { data: dailyQuestions, error } = await supabase
                .from('daily_questions')
                .select(`
                    date,
                    answers (
                        user_id,
                        content
                    )
                `)
                .eq('couple_id', coupleId)
                .order('date', { ascending: true });

            if (error) throw error;
            if (!dailyQuestions || dailyQuestions.length === 0) {
                return { success: false, message: 'No memories' };
            }

            let content = '';
            for (const dq of dailyQuestions) {
                const dateStr = new Date(dq.date).toLocaleDateString('en-GB');
                const answers = dq.answers || [];
                const myAnswer = answers.find(a => a.user_id === currentUserId)?.content || 'No answer';
                const partnerAnswer = answers.find(a => a.user_id !== currentUserId)?.content || 'No answer';

                content += `[${dateStr}]::You-${myAnswer}::Partner-${partnerAnswer}\n`;
            }

            const filename = `couple_diary_memories_${new Date().toISOString().split('T')[0]}.txt`;
            await ExportService.saveFile(content, filename);
            return { success: true };
        } catch (error) {
            console.error('Error exporting timeline:', error);
            throw error;
        }
    },

    /**
     * Export the user's private journal entries
     */
    exportJournal: async (currentUserId: string) => {
        try {
            const { data: entries, error } = await supabase
                .from('journal_entries')
                .select('date, content')
                .eq('user_id', currentUserId)
                .order('date', { ascending: true });

            if (error) throw error;
            if (!entries || entries.length === 0) {
                return { success: false, message: 'No entries' };
            }

            let content = '';
            for (const entry of entries) {
                const dateStr = new Date(entry.date).toLocaleDateString('en-GB');
                content += `[${dateStr}]::${entry.content}\n`;
            }

            const filename = `couple_diary_journal_${new Date().toISOString().split('T')[0]}.txt`;
            await ExportService.saveFile(content, filename);
            return { success: true };
        } catch (error) {
            console.error('Error exporting journal:', error);
            throw error;
        }
    }
};
