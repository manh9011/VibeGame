<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAdmin } from '../../modules/useAdmin';

const { difficultyConfig, save } = useAdmin();

const activeTab = ref<string>('easy');
const tabs = [
    { id: 'easy', label: 'Dễ (Easy)', color: 'border-green-500 text-green-600' },
    { id: 'medium', label: 'Trung Bình (Medium)', color: 'border-yellow-500 text-yellow-600' },
    { id: 'hard', label: 'Khó (Hard)', color: 'border-red-500 text-red-600' }
];

const currentConfig = computed(() => {
    if (!difficultyConfig.value[activeTab.value]) {
        // Fallback initialization if missing
        difficultyConfig.value[activeTab.value] = {
            playTime: 30,
            questionCount: 100,
            typeWeights: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10 }
        };
    }
    return difficultyConfig.value[activeTab.value];
});

const totalWeight = computed(() => {
    const weights = currentConfig.value.typeWeights;
    return Object.values(weights).reduce((a, b) => a + b, 0);
});

const getPercentage = (weight: number) => {
    if (totalWeight.value === 0) return 0;
    return Math.round((weight / totalWeight.value) * 100);
};
</script>

<template>
    <div class="flex-grow overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 w-full">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4">
            <h2 class="text-2xl font-bold text-gray-800"><i class="fa-solid fa-gauge-high text-blue-600"></i> Cấu hình
                Độ khó</h2>
        </div>

        <!-- Tabs -->
        <div class="flex border-b mb-6">
            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                :class="['px-6 py-3 font-bold text-sm transition-colors border-b-4', activeTab === tab.id ? tab.color + ' bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-700']">
                {{ tab.label }}
            </button>
        </div>

        <!-- Config Panel -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 class="font-bold text-lg mb-6 capitalize flex items-center gap-2">
                Cấu hình: <span :class="tabs.find(t => t.id === activeTab)?.color">{{tabs.find(t => t.id === activeTab)?.label
                    }}</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">
                        <i class="fa-regular fa-clock"></i> Thời gian làm bài (Phút)
                    </label>
                    <input v-model.number="currentConfig.playTime" type="number" min="1"
                        class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg font-bold">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">
                        <i class="fa-solid fa-list-ol"></i> Tổng số câu hỏi
                    </label>
                    <input v-model.number="currentConfig.questionCount" type="number" min="5"
                        class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg font-bold">
                </div>
            </div>

            <!-- Weights -->
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <label class="block text-sm font-bold text-gray-700">Phân bố câu hỏi</label>
                    <span class="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">Tổng trọng số: {{
                        totalWeight }}</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                    <div v-for="i in 10" :key="i"
                        class="p-3 border rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm transition">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-sm text-gray-700">
                                #{{ i }}.
                                <span v-if="i === 1">Trắc nghiệm (MCQ)</span>
                                <span v-else-if="i === 2">Đọc hiểu (Reading)</span>
                                <span v-else-if="i === 3">Đúng/Sai (True/False)</span>
                                <span v-else-if="i === 4">Tìm lỗi sai (Error)</span>
                                <span v-else-if="i === 5">Xếp câu (Scramble)</span>
                                <span v-else-if="i === 6">Nghe (Listening)</span>
                                <span v-else-if="i === 7">Xếp từ (Vocab)</span>
                                <span v-else-if="i === 8">Điền từ (Typing)</span>
                                <span v-else-if="i === 9">Phát âm (Rhyme)</span>
                                <span v-else-if="i === 10">Hình ảnh (Image)</span>
                            </span>
                            <span class="font-bold text-blue-600 text-sm">{{ getPercentage(currentConfig.typeWeights[i])
                                }}% <span class="text-xs text-gray-400 font-normal">({{ currentConfig.typeWeights[i]
                                    }})</span></span>
                        </div>
                        <input type="range" v-model.number="currentConfig.typeWeights[i]" min="0" max="100"
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
                    </div>
                </div>
            </div>

            <button @click="save"
                class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform active:scale-95">
                <i class="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi
            </button>
        </div>
    </div>
</template>
