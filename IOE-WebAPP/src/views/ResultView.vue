<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuestions } from '../modules/useQuestions';
import { useGameState } from '../modules/useGameState';

const router = useRouter();
const { lastScore: score, lastTotal: total } = useGameState(); // Aliased for simpler usage

const { examResults } = useQuestions();
const showReview = ref(false);

// Get the latest result matching current score/total (approximate match or just take latest)
const latestResult = computed(() => {
    // Assuming the game just finished pushed the result.
    return examResults.value[examResults.value.length - 1];
});

const wrongAnswers = computed(() => {
    if (!latestResult.value) return [];
    return latestResult.value.details.filter(d => !d.isCorrect);
});

const goHome = () => {
    router.push('/');
};
</script>

<template>
    <div class="flex flex-col items-center justify-center h-screen bg-blue-50 space-y-6">
        <div v-if="!showReview" class="text-center animate-bounce-in">
            <h1 class="text-4xl font-bold text-blue-600 mb-2">Kết Quả</h1>
            <div class="text-6xl font-extrabold text-orange-500 mb-4">{{ score }} / {{ total }}</div>
            <p v-if="score === total && total > 0" class="text-green-600 font-bold text-xl">Tuyệt vời! Bạn đã làm đúng
                hết!</p>
            <p v-else class="text-gray-600">Cố gắng hơn lần sau nhé!</p>

            <div class="flex gap-4 justify-center mt-6">
                <button @click="goHome"
                    class="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 shadow-lg transition transform hover:scale-105">
                    <i class="fa-solid fa-house"></i> Về Trang Chủ
                </button>
                <button v-if="wrongAnswers.length > 0" @click="showReview = true"
                    class="bg-orange-500 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 shadow-lg transition transform hover:scale-105">
                    <i class="fa-solid fa-rotate-left"></i> Xem Câu Sai
                </button>
            </div>
        </div>

        <div v-else class="w-full max-w-4xl h-full flex flex-col p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">Review Câu Sai ({{ wrongAnswers.length }})</h2>
                <button @click="showReview = false" class="text-blue-600 font-bold hover:underline">Quay lại kết
                    quả</button>
            </div>

            <div class="flex-grow overflow-y-auto space-y-4 pr-2">
                <div v-for="(detail, idx) in wrongAnswers" :key="idx"
                    class="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
                    <div class="font-bold text-gray-800 mb-2" v-html="detail.questionSnapshot.question"></div>

                    <div v-if="detail.questionSnapshot.passage"
                        class="mb-2 p-2 bg-gray-50 text-sm italic border-l-2 border-gray-300">
                        {{ detail.questionSnapshot.passage }}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div class="bg-red-50 p-2 rounded text-red-700">
                            <strong>Bạn chọn:</strong> {{ detail.userAnswer || '(Bỏ trống)' }}
                        </div>
                        <div class="bg-green-50 p-2 rounded text-green-700">
                            <strong>Đáp án đúng:</strong> {{ detail.questionSnapshot.correct }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-4 text-center">
                <button @click="goHome"
                    class="bg-gray-600 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-700">
                    <i class="fa-solid fa-house"></i> Về Trang Chủ
                </button>
            </div>
        </div>
    </div>
</template>
