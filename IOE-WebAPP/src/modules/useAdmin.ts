import { ref } from 'vue';
import type { ApiKeys, Question } from '../types';
import { useQuestions } from './useQuestions';

export function useAdmin() {
    const adminAuth = ref(false);
    const adminPassword = ref('');
    const loginError = ref(false);
    const knowledgeText = ref('');
    const targetGrade = ref(1);
    const isGenerating = ref(false);
    const generateStatus = ref('');

    // Shared Store
    // Shared Store
    const { questions, save, apiKeys, difficultyConfig } = useQuestions();

    const checkAdmin = async () => {
        loginError.value = false;

        if (adminPassword.value.trim() === '159753') {
            adminAuth.value = true;
        } else {
            loginError.value = true;
        }
    };

    const assembleQuestions = async (rawData: any, grade: number) => {
        const newQs: Question[] = [];

        const draw = (arr: any[]) => {
            if (!arr || arr.length === 0) return null;
            const idx = Math.floor(Math.random() * arr.length);
            return arr.splice(idx, 1)[0];
        };

        const rnd = (arr: any[]) => arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

        const shuffle = (arr: any[]) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };

        // Deep copy needed for splice
        const data = JSON.parse(JSON.stringify(rawData));

        for (let i = 0; i < 100; i++) {
            const type = (i % 10) + 1;
            let q: Partial<Question> = { grade: grade, isHidden: true };

            // Helper to get fallback data if pool exhausted from rawData
            const safePool = (key: string) => (data[key] && data[key].length) ? draw(data[key]) : rnd(rawData[key]);

            if (type === 1) {
                // 1. Fill in blank (MCQ)
                const item = safePool('fill_in_blank');
                if (item) {
                    q = { ...q, type: 1, question: item.sentence.replace(item.word, '_____'), correct: item.word, options: shuffle([item.word, ...item.distractors]) };
                }
            } else if (type === 2) {
                // 2. Reading
                const item = safePool('reading');
                if (item) {
                    q = { ...q, type: 2, passage: item.text, question: item.question, correct: item.answer, options: shuffle([item.answer, ...item.distractors]) };
                }
            } else if (type === 3) {
                // 3. True/False
                const item = safePool('true_false');
                if (item) {
                    q = { ...q, type: 3, question: `True or False?<br>"${item.statement}"`, correct: item.is_true ? 'True' : 'False', options: ['True', 'False'] };
                }
            } else if (type === 4) {
                // 4. Find Error
                const item = safePool('find_error');
                if (item) {
                    q = { ...q, type: 4, question: `Choose the incorrect part:<br>"${item.sentence}"`, correct: item.error_part, options: shuffle([item.error_part, ...item.distractors]) };
                }
            } else if (type === 5) {
                // 5. Sentence Scramble
                const item = safePool('scramble_sentence');
                if (item && item.split(' ').length >= 4) {
                    q = { ...q, type: 5, question: "Rearrange the words/phrases to form a complete sentence:", correct: item, options: [] };
                }
            } else if (type === 6) {
                // 6. Listening
                const item = safePool('listening');
                if (item) {
                    q = { ...q, type: 6, question: item.question, audioScript: item.script, correct: item.answer, options: shuffle([item.answer, ...item.distractors]) };
                }
            } else if (type === 7) {
                // 7. Word Unscramble (MCQ)
                const item = safePool('vocab_scramble');
                if (item) {
                    const scrambled = item.word.split('').sort(() => Math.random() - 0.5).join(' / ');
                    q = { ...q, type: 7, question: `Unscramble: <b>${scrambled}</b>`, correct: item.word, options: shuffle([item.word, ...item.distractors]) };
                }
            } else if (type === 8) {
                // 8. Typing Cloze
                const item = safePool('typing_cloze');
                if (item) {
                    q = { ...q, type: 8, question: `Fill in the missing word:<br>"${item.question}"`, correct: item.answer, options: [] };
                }
            } else if (type === 9) {
                // 9. Pronunciation
                const item = safePool('pronunciation');
                if (item) {
                    q = { ...q, type: 9, question: `Which word has the same pronunciation (or rhyme) as <b>"${item.target}"</b>?`, correct: item.match, options: shuffle([item.match, ...item.distractors]) };
                }
            } else if (type === 10) {
                // 10. Image
                const item = safePool('image_questions');
                if (item) {
                    q = { ...q, type: 10, question: item.question, imagePrompt: item.image_prompt, correct: item.answer, options: shuffle([item.answer, ...item.distractors]) };
                }
            }

            if (!q.question) continue;

            if (!q.options) q.options = [];
            if (!q.imagePrompt) q.imagePrompt = "";
            if (!q.audioScript) q.audioScript = "";

            // Assign ID
            q.id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

            newQs.push(q as Question);
        }

        // APPEND instead of REPLACE
        questions.value = [...questions.value, ...newQs];
        await save();
    };

    const generateQuestions = async (apiKeys: ApiKeys) => {
        if (!knowledgeText.value || !apiKeys.gemini) {
            const { showAlert } = await import('./useModal').then(m => m.useModal());
            // Dynamic import or regular? Regular is fine as they are in same module structure.
            // But useModal is stateful.
            // Let's just import at top. But wait, circular dependency? 
            // useAdmin -> useModal. useModal -> nothing. Safe.
            await showAlert("Vui lòng nhập Chủ đề kiến thức và API Key!", "Thiếu thông tin");
            return;
        }

        isGenerating.value = true;
        generateStatus.value = "Preparing prompt...";

        try {
            generateStatus.value = `Analyzing current distribution for Grade ${targetGrade.value}...`;

            // 1. Calculate Distribution
            // Filter current questions by grade
            const gradeQs = questions.value.filter(q => q.grade === targetGrade.value);
            const counts: Record<number, number> = {};
            for (let i = 1; i <= 10; i++) counts[i] = 0;
            gradeQs.forEach(q => {
                const t = q.type || 1;
                if (counts[t] !== undefined) counts[t]++;
            });

            // Calculate inverse proportion (fewer questions = higher weight)
            // Strategy: Target is to flush them out to be equal.
            // Let's find the max count to know the "ceiling"
            const maxCount = Math.max(...Object.values(counts));
            const deficits: Record<number, number> = {};
            let totalDeficit = 0;

            for (let i = 1; i <= 10; i++) {
                // If a type has 10, max is 50. Deficit = 40.
                // If a type has 60, max is 50. Deficit = 0? Or just basic weight?
                // Let's use a "Base Target" of Max + 10 (buffer)
                // Actually, simpler: Weight = 1 / (Current + 1)
                // then normalize to 100 questions.

                // Better approach for "Catch up":
                // Deficit = (Max + 5) - Current. 
                // If Current > Max + 5, Deficit = 1 (always give at least a chance)
                let d = (maxCount + 10) - counts[i];
                if (d < 5) d = 5; // Minimum weight
                deficits[i] = d;
                totalDeficit += d;
            }

            // Distribute 100 questions based on deficit ratio
            const TOTAL_GEN = 100;
            const targetCounts: Record<number, number> = {};
            let allocated = 0;

            // First pass: floor values
            for (let i = 1; i <= 10; i++) {
                const ratio = deficits[i] / totalDeficit;
                const count = Math.floor(ratio * TOTAL_GEN);
                targetCounts[i] = count;
                allocated += count;
            }

            // Second pass: distribute remainder to those with highest deficits (or just random)
            let remainder = TOTAL_GEN - allocated;
            let typeIdx = 1;
            while (remainder > 0) {
                targetCounts[typeIdx]++;
                remainder--;
                typeIdx++;
                if (typeIdx > 10) typeIdx = 1;
            }

            console.log(`Generating distribution for Grade ${targetGrade.value}:`, targetCounts);

            generateStatus.value = `Sending to Gemini (Grade ${targetGrade.value})...`;

            const prompt = `
                Generate English Learning Questions for Grade ${targetGrade.value} students (Vietnam Curriculum).
                Focus on this specific topic/knowledge:
                "${knowledgeText.value}"

                Strict Rules:
                - ALL CONTENT MUST BE IN ENGLISH. NO VIETNAMESE.
                - Create ${TOTAL_GEN} questions centered around the provided TOPIC.
                - Difficulty must match Grade ${targetGrade.value}.
                
                The JSON must contain these arrays (Exact counts requested):
                1. "fill_in_blank": ${targetCounts[1]} objects { "sentence": "...", "word": "missed_word (MUST be a contiguous phrase or word found in sentence)", "distractors": ["wrong1", "wrong2", "wrong3"] }
                2. "reading": ${targetCounts[2]} objects { "text": "Short passage relative to topic", "question": "...", "answer": "...", "distractors": ["...", "...", "..."] }
                3. "true_false": ${targetCounts[3]} objects { "statement": "...", "is_true": boolean }
                4. "find_error": ${targetCounts[4]} objects { "sentence": "Sentence with one error", "error_part": "wrong_word", "distractors": ["word1", "word2", "word3"] }
                5. "scramble_sentence": ${targetCounts[5]} strings (Sentences must be at least 5 words long, prevent short sentences)
                6. "listening": ${targetCounts[6]} objects { "script": "Dialogue/Monologue", "question": "...", "answer": "...", "distractors": ["...", "...", "..."] }
                7. "vocab_scramble": ${targetCounts[7]} objects { "word": "topic_word", "distractors": ["...", "...", "..."] }
                8. "typing_cloze": ${targetCounts[8]} objects { "question": "Sentence with gap where the missing part is replaced by underscores (_). The number of underscores MUST match the number of missing letters.", "answer": "full_correct_word" }
                9. "pronunciation": ${targetCounts[9]} objects { "target": "word", "match": "rhyme_word", "distractors": ["...", "...", "..."] }
                10. "image_questions": ${targetCounts[10]} objects { "image_prompt": "Visual description of topic", "question": "...", "answer": "...", "distractors": ["...", "...", "..."] }

                Return ONLY JSON.
            `;

            const geminiUrl = apiKeys.geminiApiUrl || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp';
            const response = await fetch(`${geminiUrl}:generateContent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKeys.gemini}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (!data.candidates) throw new Error("Gemini Error: " + JSON.stringify(data));

            let textRes = data.candidates[0].content.parts[0].text;
            textRes = textRes.replace(/```json/g, '').replace(/```/g, '');
            const aiData = JSON.parse(textRes);

            generateStatus.value = "Assembling questions...";
            await assembleQuestions(aiData, targetGrade.value);

            alert(`Generated 100 questions for Grade ${targetGrade.value}!`);

        } catch (e: any) {
            alert("Error: " + e.message);
            console.error(e);
        } finally {
            isGenerating.value = false;
        }
    };

    return {
        adminAuth,
        adminPassword,
        loginError,
        knowledgeText,
        targetGrade,
        isGenerating,
        generateStatus,
        checkAdmin,
        generateQuestions,
        apiKeys,
        difficultyConfig,
        save
    };
}
