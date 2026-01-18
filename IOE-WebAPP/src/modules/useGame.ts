
import { ref, computed } from 'vue';
import type { Question } from '../types';
import { useQuestions } from './useQuestions';
import { useModal } from './useModal';

export function useGame(allQuestions: Question[]) {
    // State
    const currentQuestionIndex = ref(0);
    const gameQuestions = ref<Question[]>([]);
    const userAnswers = ref<Record<number, string>>({});
    const timer = ref(1800); // 30 mins
    const timerInterval = ref<number | null>(null);
    const score = computed(() => {
        let s = 0;
        gameQuestions.value.forEach((q, idx) => {
            if (checkAnswer(q, userAnswers.value[idx])) s++;
        });
        return s;
    });

    const totalGameQuestions = computed(() => gameQuestions.value.length);
    const currentQuestion = computed(() => gameQuestions.value[currentQuestionIndex.value] || {});

    // Actions
    const checkAnswer = (q: Question, ans: string) => {
        if (!ans) return false;
        const a = String(ans).trim().toLowerCase();
        const c = String(q.correct).trim().toLowerCase();
        return a === c;
    };

    const startGame = (_difficulty: string, count: number = 100, grade?: number) => {
        const { difficultyConfig } = useQuestions();

        // Lookup specific config
        const diffKey = _difficulty.toLowerCase();
        // Fallback to 'easy' if key invalid or not found
        const config = difficultyConfig.value[diffKey] || difficultyConfig.value['easy'];

        // Use config for count and time
        const examCount = config.questionCount || count;
        const examTime = config.playTime || 30;

        // Filter by Hiding Status AND Grade (if provided)
        let pool = allQuestions.filter(q => !q.isHidden);
        if (grade) {
            pool = pool.filter(q => q.grade === grade);
        }

        if (pool.length < 5) { // Minimum check
            useModal().showAlert(`Không đủ câu hỏi (Cần tìm thấy ${pool.length} câu). Vui lòng tạo thêm!`);
            return;
        }

        // Weighted Selection Logic
        const selected: Question[] = [];
        const weights = config.typeWeights;
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

        // Group available questions by type
        const byType: Record<number, Question[]> = {};
        for (let i = 1; i <= 10; i++) byType[i] = [];

        pool.forEach(q => {
            const t = q.type || 1;
            if (byType[t]) byType[t].push(q);
        });

        // Helper Random
        const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

        // Shuffle each bucket
        for (let i = 1; i <= 10; i++) {
            byType[i] = shuffle(byType[i]);
        }

        let remainingSlots = examCount;

        // Pass 1: Distribute based on weights
        if (totalWeight > 0) {
            for (let i = 1; i <= 10; i++) {
                const w = weights[i] || 0;
                if (w === 0) continue;

                // Calculate target for this type
                const ratio = w / totalWeight;
                let target = Math.round(ratio * examCount);

                // Take available
                const bucket = byType[i];
                const take = Math.min(target, bucket.length);

                if (take > 0) {
                    selected.push(...bucket.splice(0, take));
                    remainingSlots -= take;
                }
            }
        }

        // Pass 2: Fill remainder with ANY remaining questions
        // Collect all leftovers
        let leftovers: Question[] = [];
        for (let i = 1; i <= 10; i++) leftovers.push(...byType[i]);
        leftovers = shuffle(leftovers);

        // If we still need questions (or if we took too few due to rounding)
        // Note: Logic above uses splice, so byType has reduced.
        // But wait, if target was high but bucket small, I took max.
        // If target was low, I left some.
        // We fill up to examCount (or max available)

        // Ensure we don't exceed desired count if rounding pushed us over (unlikely with splice logic but possible logic flow)
        // Actually, let's just fill if we are under
        while (selected.length < examCount && leftovers.length > 0) {
            selected.push(leftovers.pop()!);
        }

        // Clip if we somehow got too many (shouldn't happen with this logic but safe guard)
        if (selected.length > examCount) {
            selected.splice(examCount);
        }

        // Final Shuffle of the Exam
        gameQuestions.value = shuffle(selected);

        currentQuestionIndex.value = 0;
        userAnswers.value = {};

        // Timer Logic
        timer.value = examTime * 60;

        if (timerInterval.value) clearInterval(timerInterval.value);
        timerInterval.value = window.setInterval(() => {
            if (timer.value > 0) timer.value--;
            else finishGame();
        }, 1000);
    };

    const isFinished = ref(false);

    const finishGame = () => {
        if (isFinished.value) return; // Prevent double save
        isFinished.value = true;

        if (timerInterval.value) clearInterval(timerInterval.value);

        // Save Result
        const { saveExamResult } = useQuestions();
        const details = gameQuestions.value.map((q, idx) => ({
            questionSnapshot: q,
            userAnswer: userAnswers.value[idx] || '',
            isCorrect: checkAnswer(q, userAnswers.value[idx])
        }));

        saveExamResult({
            id: Date.now().toString(),
            timestamp: Date.now(),
            score: score.value,
            total: totalGameQuestions.value,
            details: details
        });
    };

    const submitAnswer = (ans: string, onNext: () => void, onFinish: () => void) => {
        userAnswers.value[currentQuestionIndex.value] = ans;
        if (currentQuestionIndex.value < totalGameQuestions.value - 1) {
            currentQuestionIndex.value++;
            onNext();
        } else {
            finishGame();
            onFinish();
        }
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')} `;

    return {
        currentQuestionIndex,
        gameQuestions,
        userAnswers,
        timer,
        score,
        totalGameQuestions,
        currentQuestion,
        startGame,
        finishGame,
        submitAnswer,
        formatTime,
        checkAnswer
    };
}
