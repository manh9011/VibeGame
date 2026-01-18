import { ref } from 'vue';
import type { ApiKeys, Question } from '../types';
import { useToast } from './useToast';

export interface DifficultyConfig {
    playTime: number; // minutes
    questionCount: number;
    typeWeights: Record<number, number>; // type ID -> weight (0-100)
}


export interface ExamResult {
    id: string; // timestamp string
    timestamp: number;
    score: number;
    total: number;
    details: {
        questionSnapshot: Question;
        userAnswer: string;
        isCorrect: boolean;
    }[];
}

const UPSTASH_URL = 'https://organic-cicada-32470.upstash.io';
// No default token. User must provide it.
const KEY_PREFIX = 'ioe-questions-';
const KEY_LEGACY = 'ioe-questions';
const KEY_API_KEYS = 'ioe-api-keys';
const KEY_EXAM_HISTORY = 'ioe-exam-history';
const KEY_DIFFICULTY_CONFIG = 'ioe-difficulty-config';

// State
const questions = ref<Question[]>([]);
const examResults = ref<ExamResult[]>([]);
const apiKeys = ref<ApiKeys>({ gemini: '', pollinations: '' });
const difficultyConfig = ref<Record<string, DifficultyConfig>>({
    easy: {
        playTime: 30,
        questionCount: 100,
        typeWeights: { 1: 50, 2: 30, 3: 30, 4: 30, 5: 20, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 }
    },
    medium: {
        playTime: 20,
        questionCount: 100,
        typeWeights: { 1: 40, 2: 40, 3: 40, 4: 40, 5: 30, 6: 30, 7: 30, 8: 30, 9: 30, 10: 30 }
    },
    hard: {
        playTime: 15,
        questionCount: 100,
        typeWeights: { 1: 30, 2: 50, 3: 50, 4: 50, 5: 40, 6: 40, 7: 40, 8: 40, 9: 40, 10: 40 }
    }
});

const isLoading = ref(false);
const isSaving = ref(false);
const upstashToken = ref(localStorage.getItem('ioe_upstash_token') || '');

export function useQuestions() {

    const setToken = (token: string) => {
        if (!token.startsWith('Bearer ')) token = 'Bearer ' + token;
        upstashToken.value = token;
        localStorage.setItem('ioe_upstash_token', token);
    };

    const fetchUpstash = async (key: string) => {
        try {
            const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
                headers: { Authorization: upstashToken.value }
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.result ? JSON.parse(data.result) : null;
        } catch (e) {
            return null;
        }
    };

    const postUpstash = async (key: string, value: any) => {
        await fetch(`${UPSTASH_URL}/set/${key}`, {
            method: 'POST',
            headers: { Authorization: upstashToken.value },
            body: JSON.stringify(value)
        });
    };

    const load = async () => {
        isLoading.value = true;
        try {
            const promises = [];

            // 1. Load Grades 1-12
            for (let i = 1; i <= 12; i++) {
                promises.push(fetchUpstash(`${KEY_PREFIX}${i}`));
            }
            // 2. Load Legacy (for migration)
            promises.push(fetchUpstash(KEY_LEGACY));

            // 3. Load API Keys
            promises.push(fetchUpstash(KEY_API_KEYS));

            // 4. Load Exam History
            promises.push(fetchUpstash(KEY_EXAM_HISTORY));

            // 5. Load Difficulty Config
            promises.push(fetchUpstash(KEY_DIFFICULTY_CONFIG));


            const results = await Promise.all(promises);

            // Merge Questions (Results 0-11 are grades, 12 is legacy)
            let allQs: Question[] = [];

            // Grades 1-12
            for (let i = 0; i <= 11; i++) {
                if (results[i]) allQs = allQs.concat(results[i]);
            }
            // Legacy
            if (results[12]) allQs = allQs.concat(results[12]);

            // Ensure unique IDs and default grade
            const seenIds = new Set();
            questions.value = allQs.filter(q => {
                if (!q.id) q.id = Math.random().toString(36).substring(2) + Date.now().toString(36);
                if (seenIds.has(q.id)) return false;
                seenIds.add(q.id);
                if (!q.grade) q.grade = 5; // Default grade
                return true;
            });

            // API Keys
            if (results[13]) apiKeys.value = results[13];

            // History
            if (results[14]) examResults.value = results[14];

            // Difficulty Config
            if (results[15]) {
                // Merge in case we add new fields later
                difficultyConfig.value = { ...difficultyConfig.value, ...results[15] };
            }


        } catch (e) {
            console.error("Failed to load data from Cloud", e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    const save = async () => {
        isSaving.value = true;
        const toast = useToast();
        try {
            const savePromises = [];

            // 1. Save Questions by Grade (1-12)
            for (let i = 1; i <= 12; i++) {
                const gradeQs = questions.value.filter(q => q.grade == i);
                savePromises.push(postUpstash(`${KEY_PREFIX}${i}`, gradeQs));
            }

            // 2. Save API Keys
            savePromises.push(postUpstash(KEY_API_KEYS, apiKeys.value));

            // 3. Save Difficulty Config
            savePromises.push(postUpstash(KEY_DIFFICULTY_CONFIG, difficultyConfig.value));


            await Promise.all(savePromises);
            toast.success("Lưu dữ liệu thành công!");
        } catch (e) {
            console.error("Save Error", e);
            toast.error("Lỗi lưu dữ liệu: " + (e as Error).message);
        } finally {
            isSaving.value = false;
        }
    };

    const saveExamResult = async (result: ExamResult) => {
        examResults.value.push(result);
        try {
            await postUpstash(KEY_EXAM_HISTORY, examResults.value);
        } catch (e) {
            console.error("Failed to save exam history", e);
        }
    };

    const addQuestion = async (q: Omit<Question, 'id'>) => {
        const newQ: Question = {
            ...q,
            id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
        };
        questions.value.unshift(newQ);
        await save();
    };

    const deleteQuestion = async (index: number) => {
        questions.value.splice(index, 1);
        await save();
    };

    const deleteAllQuestions = async () => {
        questions.value = [];
        await save();
    };

    const removeDuplicates = async () => {
        const seen = new Set();
        const initialCount = questions.value.length;

        questions.value = questions.value.filter(q => {
            // Create a robust unique key based on content
            // We use type, question, correct answer, options, and image prompt to ensure true uniqueness
            const keyParts = [
                q.type,
                (q.question || '').trim().toLowerCase(),
                (q.correct || '').trim().toLowerCase(),
                (q.imagePrompt || '').trim().toLowerCase(),
                // Sort options to ensure order doesn't affect uniqueness for multiple choice
                // but keep original array intact. For some types order matters, 
                // but for duplicate detection, usually set content matters.
                JSON.stringify(q.options)
            ];

            const key = keyParts.join('|');

            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const removedCount = initialCount - questions.value.length;
        if (removedCount > 0) await save();
        return removedCount;
    };

    return {
        questions,
        apiKeys,
        difficultyConfig,
        examResults,

        isLoading,
        isSaving,
        upstashToken,
        setToken,
        load,
        save,
        saveExamResult,
        addQuestion,
        deleteQuestion,
        deleteAllQuestions,
        removeDuplicates
    };
}
