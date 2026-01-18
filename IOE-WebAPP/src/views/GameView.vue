<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGame } from '../modules/useGame';
import { useQuestions } from '../modules/useQuestions';
import { useModal } from '../modules/useModal';
import { useGameState } from '../modules/useGameState';

const router = useRouter();
const { difficulty, gameGrade, setGameResult } = useGameState();

const { questions, apiKeys } = useQuestions();
const {
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
} = useGame(questions.value);

const tempTextInput = ref('');
const scramblePool = ref<string[]>([]);
const scramblePlaced = ref<string[]>([]);

// Type 8: Character Slots Logic
const charInputs = ref<string[]>([]);
const inputRefs = ref<HTMLInputElement[]>([]);

// Watch Timer to auto-finish
watch(timer, (val) => {
    if (val <= 0) {
        handleFinish();
    }
});

// Reset slots when question changes
watch(currentQuestion, (newQ) => {
    if (newQ && newQ.type === 8 && newQ.correct) {
        const length = newQ.correct.length;
        charInputs.value = new Array(length).fill('');
    } else {
        charInputs.value = [];
    }
}, { immediate: true });

const handleCharInput = (index: number, event: Event) => {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
        // Auto-advance
        charInputs.value[index] = val.toUpperCase();
        if (index < charInputs.value.length - 1) {
            inputRefs.value[index + 1]?.focus();
        }
    }
};

const handleKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === 'Backspace' && !charInputs.value[index]) {
        // Go back if empty
        if (index > 0) {
            inputRefs.value[index - 1]?.focus();
        }
    } else if (event.key === 'ArrowLeft') {
        if (index > 0) inputRefs.value[index - 1]?.focus();
    } else if (event.key === 'ArrowRight') {
        if (index < charInputs.value.length - 1) inputRefs.value[index + 1]?.focus();
    } else if (event.key === 'Enter') {
        const fullAnswer = charInputs.value.join('');
        if (fullAnswer.length === charInputs.value.length) {
            onSubmit(fullAnswer);
        }
    }
};

// Computed to inject slots into question text (Type 8)
const questionWithSlotsParts = computed(() => {
    const q = currentQuestion.value;
    if (!q || q.type !== 8 || !q.question) return null;

    // Regex to find gaps (underscores or dots)
    const regex = /(_+|\.{3,})/;

    let parts = q.question.split(regex);

    // Cleanup empty strings from split
    parts = parts.filter(p => p !== '');

    if (parts.length === 1 && !regex.test(q.question)) {
        parts.push('...');
    }
    return parts;
});

onMounted(async () => {
    try {
        startGame(difficulty.value, 100, gameGrade.value);
        setupQuestionMechanics();

        // Start background preloader
        setTimeout(() => {
            preloadImages();
        }, 2000); // Small delay to let initial UI render
    } catch (e) {
        const { showAlert } = useModal();
        await showAlert(`Có lỗi xảy ra: ${e}`, "Lỗi Game");
        router.push('/');
    }
});

onUnmounted(() => {
    finishGame();
});

const setupQuestionMechanics = () => {
    const q = currentQuestion.value;
    if (q && q.type === 5) {
        const words = q.correct.split(' ');
        scramblePool.value = [...words].sort(() => Math.random() - 0.5);
        scramblePlaced.value = [];
    }
    tempTextInput.value = '';
};

const handleNext = () => {
    setupQuestionMechanics();
};

const handleFinish = () => {
    setGameResult(score.value, totalGameQuestions.value);
    router.push('/result');
};

const onSubmit = (ans: string) => {
    submitAnswer(ans, handleNext, handleFinish);
};

const submitScramble = () => {
    onSubmit(scramblePlaced.value.join(' '));
};

// Scramble Helpers
const placeWord = (idx: number) => {
    scramblePlaced.value.push(scramblePool.value[idx]);
    scramblePool.value.splice(idx, 1);
};
const returnWordToPool = (idx: number) => {
    scramblePool.value.push(scramblePlaced.value[idx]);
    scramblePlaced.value.splice(idx, 1);
};

// Helpers
// Image Handling
// Media Readiness State
const isMediaReady = ref(true);
const isAudioPlaying = ref(false);

const currentImageUrl = ref('');

const imageCache = new Map<string, string>(); // Url -> BlobUrl

const fetchImage = async (prompt: string) => {
    isMediaReady.value = false; // Block while loading
    if (!prompt) {
        currentImageUrl.value = '';
        isMediaReady.value = true;
        return;
    }

    try {
        const encoded = encodeURIComponent(prompt);
        // User requested Ajax with Bearer token if key exists
        const url = `https://gen.pollinations.ai/image/${encoded}?width=400&height=300&model=zimage`;

        // Check Cache first
        if (imageCache.has(url)) {
            currentImageUrl.value = imageCache.get(url) || '';
            return; // Cache hit
        }

        const headers: HeadersInit = {};
        if (apiKeys.value.pollinations) {
            headers['Authorization'] = `Bearer ${apiKeys.value.pollinations}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error('Image fetch failed');

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        imageCache.set(url, blobUrl);
        currentImageUrl.value = blobUrl;
    } catch (e) {
        console.error("Failed to load image:", e);
        currentImageUrl.value = '';
    } finally {
        isMediaReady.value = true; // Unblock after load (success or fail)
    }
};

// Background Image Preloading
const preloadImages = async () => {
    if (!gameQuestions.value) return;

    // Collect all image prompts from type 10 questions or others with imagePrompt
    const promptsToLoad = gameQuestions.value
        .filter(q => q.imagePrompt)
        .map(q => q.imagePrompt!); // Non-null assertion safe due to filter

    // Process sequentially or with concurrency limit to avoid flooding network
    // Simple sequential approach for stability
    for (const prompt of promptsToLoad) {
        const encoded = encodeURIComponent(prompt);
        const url = `https://gen.pollinations.ai/image/${encoded}?width=400&height=300&model=zimage`;

        if (imageCache.has(url)) continue; // Already cached

        try {
            const headers: HeadersInit = {};
            if (apiKeys.value.pollinations) {
                headers['Authorization'] = `Bearer ${apiKeys.value.pollinations}`;
            }

            const res = await fetch(url, { headers });
            if (res.ok) {
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                imageCache.set(url, blobUrl);
            }
        } catch (e) {
            // Ignore background errors
            console.warn("Background preload failed for:", prompt);
        }
    }
};

// Watch for question change to reset state
watch(() => currentQuestion.value, (newQ) => {
    if (!newQ) return;

    currentImageUrl.value = '';
    isAudioPlaying.value = false;

    // Reset readiness logic
    if (newQ && newQ.type === 10 && newQ.imagePrompt) {
        isMediaReady.value = false;
        fetchImage(newQ.imagePrompt);
    } else if ([6].includes(newQ.type) || newQ.audioScript) {
        isMediaReady.value = false; // Must listen first
        // Auto-play audio (after a small delay to ensure UI mount)
        setTimeout(() => {
            playAudio(newQ.audioScript || newQ.question);
        }, 500);
    } else {
        isMediaReady.value = true;
    }
}, { immediate: true });


const playAudio = (text: string) => {
    if (!text) return;

    // Strip HTML tags for clean reading
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";

    window.speechSynthesis.cancel(); // Stop any currently playing audio

    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = 'en-US';
    u.rate = 0.9; // Slightly slower for clarity

    // Optional: Select a better voice if available
    const voices = window.speechSynthesis.getVoices();
    const googleVoice = voices.find(v => v.name.includes('Google US English'));
    if (googleVoice) u.voice = googleVoice;

    u.onstart = () => { isAudioPlaying.value = true; };
    u.onend = () => {
        isAudioPlaying.value = false;
        isMediaReady.value = true; // Unlock after listening
    };
    u.onerror = () => {
        isAudioPlaying.value = false;
        isMediaReady.value = true; // Unlock on error to prevent stuck state
    };

    window.speechSynthesis.speak(u);
};

const getQuestionTypeLabel = (t: number) => {
    const map: Record<number, string> = {
        1: 'Điền vào chỗ trống',
        2: 'Đọc hiểu',
        3: 'Đúng/Sai',
        4: 'Tìm lỗi sai',
        5: 'Ghép câu',
        6: 'Nghe',
        7: 'Sắp xếp từ',
        8: 'Điền từ (Nhập)',
        9: 'Phát âm',
        10: 'Mô tả hình ảnh'
    };
    return map[t] || 'Câu hỏi';
};

const shouldShowPagination = (i: number) => i >= Math.max(0, currentQuestionIndex.value - 15) && i < Math.min(totalGameQuestions.value, Math.max(0, currentQuestionIndex.value - 15) + 30);
</script>

<template>
    <div class="flex flex-col h-screen overflow-hidden">
        <header class="bg-white shadow-md z-10">
            <div class="flex justify-between items-center px-4 py-2 border-b">
                <div class="font-bold text-xl text-green-600">Câu {{ currentQuestionIndex + 1 }}/{{ totalGameQuestions
                    }}</div>
                <div
                    class="flex items-center space-x-2 text-red-500 font-mono text-xl font-bold bg-red-50 px-3 py-1 rounded-lg">
                    <i class="fa-regular fa-clock"></i> <span>{{ formatTime(timer) }}</span>
                </div>
            </div>
            <!-- Pagination -->
            <div class="overflow-x-auto whitespace-nowrap py-2 px-2 bg-gray-50 flex space-x-2">
                <button v-for="(_, index) in gameQuestions" :key="index" v-show="shouldShowPagination(index)"
                    :class="['w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all', index === currentQuestionIndex ? 'bg-blue-600 text-white scale-110 shadow-md ring-2 ring-blue-300' : userAnswers[index] !== undefined ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500']"
                    disabled>
                    {{ index + 1 }}
                </button>
            </div>
        </header>

        <main class="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-50" v-if="currentQuestion">
            <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 min-h-[400px] flex flex-col">
                <div class="mb-6">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-indigo-500 mb-3">{{
                        getQuestionTypeLabel(currentQuestion.type) }}</span>

                    <!-- Image Handling (Type 10) -->
                    <div v-if="currentQuestion.type === 10 && currentQuestion.imagePrompt"
                        class="mb-4 flex justify-center">
                        <div
                            class="relative rounded-lg overflow-hidden shadow-md max-h-60 bg-gray-100 min-w-[300px] min-h-[200px] flex items-center justify-center">
                            <img :src="currentImageUrl" v-if="currentImageUrl" class="object-cover h-full w-full"
                                alt="AI Generated" loading="lazy">
                            <div v-else class="text-gray-400 text-sm flex flex-col items-center">
                                <i class="fa-solid fa-spinner fa-spin mb-2"></i>
                                <span>Đang tải ảnh...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Audio Handling (Type 6, 9 or explicit audioScript) -->
                    <div v-if="[6].includes(currentQuestion.type) || currentQuestion.audioScript"
                        class="mb-4 flex justify-center">
                        <button @click="playAudio(currentQuestion.audioScript || currentQuestion.question)"
                            :disabled="isAudioPlaying"
                            :class="['flex items-center space-x-2 px-4 py-2 rounded-full font-bold shadow-sm transition transform hover:scale-105', isAudioPlaying ? 'bg-orange-400 text-white animate-pulse' : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900']">
                            <i class="fa-solid" :class="isAudioPlaying ? 'fa-music' : 'fa-volume-high'"></i>
                            <span>{{ isAudioPlaying ? 'Đang đọc...' : 'Nghe (AI Voice)' }}</span>
                        </button>
                    </div>

                    <!-- Reading Passage (Type 2) -->
                    <div v-if="currentQuestion.passage"
                        class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400 mb-4 text-gray-700 italic leading-relaxed text-sm md:text-base">
                        "{{ currentQuestion.passage }}"
                    </div>

                    <h2 v-if="currentQuestion.type !== 8"
                        class="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed"
                        v-html="currentQuestion.question"></h2>
                </div>

                <div class="flex-grow flex flex-col justify-end">
                    <!-- Input Type -->
                    <!-- Type 8: Character Slots -->
                    <div v-if="currentQuestion.type === 8" class="w-full">
                        <!-- Question Text with Embedded Slots Container -->
                        <div class="mb-6 text-center">
                            <div class="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed mb-6">
                                <template v-if="questionWithSlotsParts">
                                    <template v-for="(part, idx) in questionWithSlotsParts" :key="idx">
                                        <span v-if="!part.match(/(_+|\.{3,})/)" v-html="part"></span>
                                        <span v-else
                                            class="text-indigo-500 mx-1 font-mono font-bold tracking-widest text-2xl"
                                            v-html="part"></span>
                                    </template>
                                </template>
                                <span v-else v-html="currentQuestion.question"></span>
                            </div>

                            <!-- Input Slots (New Line) -->
                            <div class="flex flex-wrap items-center justify-center gap-2">
                                <div class="inline-flex items-end gap-2">
                                    <input v-for="(_, i) in charInputs" :key="i"
                                        :ref="(el) => { if (el) inputRefs[i] = el as HTMLInputElement }"
                                        v-model="charInputs[i]" maxlength="1"
                                        class="w-10 h-10 border-b-2 border-gray-400 focus:border-indigo-600 bg-transparent text-center text-2xl font-bold uppercase focus:outline-none transition-colors rounded-none p-0 text-indigo-700"
                                        @input="handleCharInput(i, $event)" @keydown="handleKeyDown(i, $event)"
                                        :disabled="!isMediaReady || userAnswers[currentQuestionIndex] !== undefined">
                                </div>
                            </div>
                        </div>

                        <button @click="onSubmit(charInputs.join(''))"
                            :disabled="!isMediaReady || charInputs.join('').length !== currentQuestion.correct.length"
                            class="mt-4 w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                            {{ isMediaReady ? 'Trả lời' : 'Vui lòng đợi...' }}
                        </button>
                    </div>

                    <!-- Scramble Type -->
                    <div v-else-if="currentQuestion.type === 5">
                        <div
                            class="min-h-[60px] bg-gray-100 rounded-xl p-3 mb-4 border-2 border-dashed border-gray-300 flex flex-wrap gap-2 items-center">
                            <span v-if="scramblePlaced.length === 0"
                                class="text-gray-400 text-sm w-full text-center">Chọn từ bên dưới để
                                ghép câu</span>
                            <div v-for="(word, idx) in scramblePlaced" :key="'placed-' + idx"
                                @click="returnWordToPool(idx)"
                                class="bg-blue-600 text-white px-3 py-1 rounded-lg shadow word-card font-bold hover:bg-blue-700">
                                {{ word }}</div>
                        </div>
                        <div class="flex flex-wrap gap-2 justify-center">
                            <button v-for="(word, idx) in scramblePool" :key="'pool-' + idx" @click="placeWord(idx)"
                                class="bg-white border border-gray-300 hover:border-blue-400 text-gray-700 px-3 py-2 rounded-lg shadow-sm word-card font-medium">{{
                                    word }}</button>
                        </div>
                        <button @click="submitScramble" :disabled="!isMediaReady"
                            class="mt-6 w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {{ isMediaReady ? 'Xác nhận' : 'Vui lòng đợi...' }}
                        </button>
                    </div>

                    <!-- Multiple Choice -->
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button v-for="(opt, idx) in currentQuestion.options" :key="idx" @click="onSubmit(opt)"
                            :disabled="!isMediaReady"
                            class="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-left transition flex items-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200">
                            <span
                                class="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center mr-3 group-hover:bg-blue-500 group-hover:text-white transition">{{
                                    ['A', 'B', 'C', 'D'][idx] }}</span>
                            <span class="font-medium text-gray-700">{{ opt }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
