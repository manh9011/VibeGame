<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuestions } from '../modules/useQuestions';
import { useGameState } from '../modules/useGameState';

const router = useRouter();
const { questions, upstashToken, setToken, load } = useQuestions();
const { setGameSettings } = useGameState();

const difficulty = ref('easy');
const selectedGrade = ref<number>(1);

// Key Prompt State
const showKeyPrompt = ref(!upstashToken.value);
const inputKey = ref('');

onMounted(async () => {
    if (upstashToken.value) {
        try {
            await load();
        } catch (e) {
            showKeyPrompt.value = true;
        }
    }
});

const confirmKey = async () => {
    if (!inputKey.value) return alert("Vui lòng nhập Key!");
    setToken(inputKey.value);
    try {
        await load();
        showKeyPrompt.value = false;
    } catch (e) {
        alert("Key không hợp lệ hoặc lỗi mạng!");
        showKeyPrompt.value = true; // Keep open
    }
};

const startGame = () => {
    setGameSettings(difficulty.value, selectedGrade.value);
    router.push('/game');
};

const goToAdmin = () => {
    router.push('/admin');
};
</script>

<template>
    <div class="flex-grow flex flex-col items-center justify-center p-4">
        <div
            class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-8 border-green-500 relative">
            <div class="text-6xl text-green-500 mb-4"><i class="fa-solid fa-graduation-cap"></i></div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Thi thử IOE</h1>

            <div class="my-6">
                <!-- Data Check -->
                <div v-if="questions.length >= 0" class="space-y-3">
                    <!-- Removed strict check for 100 questions to allow testing more easily, 
                         or keep it? The original code had it. Let's keep it but maybe check filtered count? 
                         Original logic: checks absolute length.
                    -->

                    <div v-if="questions.length < 1"
                        class="text-orange-500 font-bold bg-orange-50 p-3 rounded-lg mb-4 text-sm">
                        <i class="fa-solid fa-triangle-exclamation"></i> Cần có câu hỏi để chơi.<br>Vui lòng vào trang
                        quản lý để sinh câu hỏi.
                    </div>

                    <div v-else class="text-green-600 font-bold bg-green-50 p-3 rounded-lg mb-4">
                        <i class="fa-solid fa-check-circle"></i> Đã có {{ questions.length }} câu hỏi
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-left">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Khối Lớp:</label>
                            <select v-model="selectedGrade"
                                class="w-full p-2 border rounded-lg outline-none focus:border-green-500">
                                <option v-for="i in 12" :key="i" :value="i">Lớp {{ i }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Độ khó (Thời gian):</label>
                            <select v-model="difficulty"
                                class="w-full p-2 border rounded-lg outline-none focus:border-green-500">
                                <option value="easy">Dễ (Easy)</option>
                                <option value="medium">Vừa (Medium)</option>
                                <option value="hard">Khó (Hard)</option>
                            </select>
                        </div>
                    </div>

                    <div class="bg-blue-50 text-blue-700 p-2 rounded text-sm text-left">
                        <i class="fa-solid fa-info-circle"></i>
                        <span v-if="selectedGrade"> Có <b>{{questions.filter(q => q.grade === selectedGrade).length
                        }}</b> câu hỏi cho Lớp {{ selectedGrade }}</span>
                        <span v-else> Có tổng <b>{{ questions.length }}</b> câu hỏi</span>
                    </div>

                    <button @click="startGame" :disabled="questions.length === 0"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <i class="fa-solid fa-play"></i> Bắt đầu làm bài
                    </button>
                </div>
            </div>

            <button @click="goToAdmin"
                class="text-sm text-gray-500 hover:text-green-600 underline flex items-center justify-center w-full gap-2">
                <i class="fa-solid fa-gear"></i> Quản lý & Sinh câu hỏi
            </button>
        </div>

        <!-- Upstash Key Modal -->
        <div v-if="showKeyPrompt" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
                <div class="text-center mb-4">
                    <div class="text-4xl text-blue-500 mb-2"><i class="fa-solid fa-cloud"></i></div>
                    <h2 class="text-xl font-bold text-gray-800">Cấu hình Upstash Cloud</h2>
                    <p class="text-gray-500 text-sm mt-1">Nhập Upstash REST Token để tải dữ liệu.</p>
                </div>

                <input v-model="inputKey" type="text" placeholder="Bearer ..."
                    class="w-full border p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    @keyup.enter="confirmKey">

                <button @click="confirmKey"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition">
                    Xác Nhận
                </button>
            </div>
        </div>
    </div>
</template>
