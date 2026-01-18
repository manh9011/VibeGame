import { ref } from 'vue';

const difficulty = ref('easy');
const gameGrade = ref<number | undefined>(undefined);
const lastScore = ref(0);
const lastTotal = ref(0);

export function useGameState() {

    const setGameSettings = (diff: string, grade?: number) => {
        difficulty.value = diff;
        gameGrade.value = grade;
    };

    const setGameResult = (score: number, total: number) => {
        lastScore.value = score;
        lastTotal.value = total;
    };

    return {
        difficulty,
        gameGrade,
        lastScore,
        lastTotal,
        setGameSettings,
        setGameResult
    };
}
