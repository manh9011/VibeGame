<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuestions } from '../../modules/useQuestions';

const { examResults } = useQuestions();

const QUESTION_TYPES: Record<number, string> = {
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

// History Logic
const historyGradeFilter = ref<number>(0);
const selectedExamId = ref<string | null>(null);
const historySubTab = ref<'details' | 'stats'>('stats');
const historyResultFilter = ref<'ALL' | 'CORRECT' | 'WRONG'>('ALL');

const filteredExams = computed(() => {
    let list = [...examResults.value].sort((a, b) => b.timestamp - a.timestamp);
    if (historyGradeFilter.value !== 0) {
        list = list.filter(e => {
            const firstQ = e.details[0]?.questionSnapshot;
            return firstQ && firstQ.grade === historyGradeFilter.value;
        });
    }
    return list;
});

const selectedExam = computed(() => {
    return examResults.value.find(e => e.id === selectedExamId.value) || null;
});

const historyFilteredQuestions = computed(() => {
    if (!selectedExam.value) return [];

    // Recalculate correctness on the fly to handle legacy case-sensitivity issues
    const list = selectedExam.value.details.map(d => {
        const user = (d.userAnswer || '').trim().toLowerCase();
        const correct = (d.questionSnapshot.correct || '').trim().toLowerCase();
        return {
            ...d,
            isCorrect: user === correct
        };
    });

    if (historyResultFilter.value === 'CORRECT') return list.filter(d => d.isCorrect);
    if (historyResultFilter.value === 'WRONG') return list.filter(d => !d.isCorrect);
    return list;
});

const examStats = computed(() => {
    if (!selectedExam.value) return [];

    // Map of Type ID -> { total, correct, wrong }
    const stats: Record<number, { total: number, correct: number, wrong: number, label: string }> = {};

    selectedExam.value.details.forEach(d => {
        const type = d.questionSnapshot.type || 1;
        if (!stats[type]) {
            stats[type] = {
                total: 0,
                correct: 0,
                wrong: 0,
                label: QUESTION_TYPES[type] || `Type ${type}`
            };
        }
        stats[type].total++;

        // Recalculate correctness case-insensitively
        const user = (d.userAnswer || '').trim().toLowerCase();
        const correct = (d.questionSnapshot.correct || '').trim().toLowerCase();
        const isCor = user === correct;

        if (isCor) stats[type].correct++;
        else stats[type].wrong++;
    });

    return Object.entries(stats).map(([k, v]) => ({
        type: Number(k),
        ...v
    }));
});
</script>

<template>
    <div class="flex-grow flex flex-col h-full overflow-hidden p-6">
        <div class="flex flex-col md:flex-row h-full gap-4">

            <!-- History Sidebar -->
            <div class="w-full md:w-1/3 bg-white border rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                <!-- Filter Header -->
                <div class="p-3 border-b bg-gray-50">
                    <label class="text-xs font-bold text-gray-500 uppercase mb-1 block">Lọc theo lớp</label>
                    <select v-model="historyGradeFilter" class="w-full border p-2 rounded text-sm font-bold">
                        <option :value="0">Tất cả các lớp</option>
                        <option v-for="i in 12" :key="i" :value="i">Lớp {{ i }}</option>
                    </select>
                </div>

                <!-- List -->
                <div class="flex-grow overflow-y-auto">
                    <div v-if="filteredExams.length === 0" class="p-4 text-center text-gray-500 text-sm">
                        Chưa có dữ liệu thi.
                    </div>
                    <button v-for="exam in filteredExams" :key="exam.id" @click="selectedExamId = exam.id"
                        class="relative w-full text-left p-4 border-b hover:bg-gray-50 transition flex justify-between items-center group overflow-hidden"
                        :class="{ 'bg-blue-50': selectedExamId === exam.id }">

                        <!-- Active Marker (Absolute) -->
                        <div v-if="selectedExamId === exam.id" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500">
                        </div>

                        <div>
                            <div
                                class="font-bold text-gray-800 group-hover:text-blue-600 transition truncate text-sm md:text-base">
                                {{ new Date(exam.timestamp).toLocaleString() }}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                Lớp {{ exam.details[0]?.questionSnapshot.grade || '?' }} • {{ exam.details.length }} câu
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0 ml-2">
                            <div
                                :class="['text-lg font-bold', exam.score === exam.total ? 'text-green-600' : 'text-orange-600']">
                                {{ exam.score }}/{{ exam.total }}
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- History Details -->
            <div
                class="w-full md:w-2/3 bg-white border rounded-lg shadow-sm flex flex-col h-full overflow-hidden relative">
                <div v-if="!selectedExam" class="flex flex-col items-center justify-center h-full text-gray-400">
                    <i class="fa-solid fa-file-lines text-6xl mb-4 opacity-20"></i>
                    <p>Chọn một bài thi để xem chi tiết</p>
                </div>

                <div v-else class="flex flex-col h-full">
                    <!-- Header -->
                    <div class="bg-gray-50 p-4 border-b flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-lg text-gray-800">Kết quả bài thi</h3>
                            <p class="text-xs text-gray-500">{{ new
                                Date(selectedExam.timestamp).toLocaleString() }}
                            </p>
                        </div>
                        <div class="bg-white px-4 py-2 rounded shadow-sm border text-center">
                            <span class="block text-xs text-gray-400 uppercase font-bold">Điểm số</span>
                            <span class="text-xl font-bold text-indigo-600">{{ selectedExam.score }}/{{
                                selectedExam.total }}</span>
                        </div>
                    </div>

                    <!-- Sub Tabs -->
                    <div class="flex border-b">
                        <button @click="historySubTab = 'details'"
                            :class="['flex-1 py-3 text-sm font-bold text-center border-b-2 transition', historySubTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']">
                            <i class="fa-solid fa-list-ul mr-2"></i> Kết quả chi tiết
                        </button>
                        <button @click="historySubTab = 'stats'"
                            :class="['flex-1 py-3 text-sm font-bold text-center border-b-2 transition', historySubTab === 'stats' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700']">
                            <i class="fa-solid fa-chart-column mr-2"></i> Thống kê
                        </button>
                    </div>

                    <!-- Content: Details -->
                    <div v-if="historySubTab === 'details'" class="flex-grow flex flex-col min-h-0">
                        <!-- Toolbar -->
                        <div class="p-3 border-b flex gap-2 flex-shrink-0 bg-white">
                            <button @click="historyResultFilter = 'ALL'"
                                :class="['px-3 py-1 rounded text-xs font-bold transition', historyResultFilter === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600']">
                                Tất cả
                            </button>
                            <button @click="historyResultFilter = 'CORRECT'"
                                :class="['px-3 py-1 rounded text-xs font-bold transition', historyResultFilter === 'CORRECT' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600']">
                                Làm đúng
                            </button>
                            <button @click="historyResultFilter = 'WRONG'"
                                :class="['px-3 py-1 rounded text-xs font-bold transition', historyResultFilter === 'WRONG' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600']">
                                Làm sai
                            </button>
                        </div>

                        <!-- Question List -->
                        <div class="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
                            <div v-for="(detail, idx) in historyFilteredQuestions" :key="idx"
                                class="bg-white p-4 rounded border shadow-sm">
                                <div class="flex justify-between items-start mb-2">
                                    <span
                                        :class="['text-xs font-bold px-2 py-1 rounded mb-2 inline-block', detail.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                                        {{ detail.isCorrect ? 'ĐÚNG' : 'SAI' }}
                                    </span>
                                    <span class="text-xs text-gray-400 font-bold">
                                        {{ QUESTION_TYPES[detail.questionSnapshot.type || 1] }}
                                    </span>
                                </div>

                                <p class="font-bold text-gray-800 mb-2" v-html="detail.questionSnapshot.question">
                                </p>

                                <div v-if="detail.questionSnapshot.audioScript"
                                    class="mb-2 p-2 bg-yellow-50 text-xs rounded border border-yellow-200">
                                    <i class="fa-solid fa-volume-high text-yellow-500 mr-1"></i> {{
                                        detail.questionSnapshot.audioScript }}
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                                    <div
                                        :class="['p-3 rounded border', detail.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200']">
                                        <div class="text-xs font-bold opacity-70 mb-1">Câu trả lời của bạn:
                                        </div>
                                        <div class="font-medium break-words">{{
                                            detail.userAnswer || '(Bỏ trống)'
                                            }}</div>
                                    </div>
                                    <div class="p-3 rounded border bg-gray-50 border-gray-200">
                                        <div class="text-xs font-bold opacity-70 mb-1">Đáp án đúng:</div>
                                        <div class="font-medium text-green-700">{{
                                            detail.questionSnapshot.correct
                                            }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Content: Stats -->
                    <div v-if="historySubTab === 'stats'" class="flex-grow p-6 overflow-y-auto">
                        <h4 class="font-bold text-gray-800 mb-4 text-center">Phân bố câu hỏi theo loại</h4>

                        <div
                            class="h-64 flex items-end justify-between gap-2 md:gap-4 px-4 pb-8 border-b border-gray-300 relative">
                            <!-- Y Axis grid lines (simplified) -->
                            <div
                                class="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none opacity-30">
                                <div class="border-t border-gray-400 w-full h-0"></div>
                                <div class="border-t border-gray-400 w-full h-0 border-dashed"></div>
                                <div class="border-t border-gray-400 w-full h-0 border-dashed"></div>
                                <div class="border-t border-gray-400 w-full h-0 border-dashed"></div>
                                <div class="border-t border-gray-800 w-full h-0"></div>
                            </div>

                            <div v-for="stat in examStats" :key="stat.type"
                                class="flex flex-col items-center flex-1 h-full justify-end group z-10">
                                <div class="w-full max-w-[40px] bg-gray-100 rounded-t overflow-hidden flex flex-col-reverse shadow hover:scale-105 transition relative"
                                    :style="{ height: (stat.total / Math.max(...examStats.map(s => s.total))) * 80 + '%' }">
                                    <!-- Correct Segment -->
                                    <div class="bg-green-500 w-full transition-all duration-500"
                                        :style="{ height: (stat.correct / stat.total) * 100 + '%' }"
                                        :title="`Đúng: ${stat.correct}`"></div>
                                    <!-- Wrong Segment -->
                                    <div class="bg-red-500 w-full transition-all duration-500"
                                        :style="{ height: (stat.wrong / stat.total) * 100 + '%' }"
                                        :title="`Sai: ${stat.wrong}`"></div>
                                </div>

                                <!-- Label -->
                                <div class="text-[10px] md:text-xs text-center mt-2 font-bold text-gray-600 truncate w-full"
                                    :title="stat.label">
                                    {{ stat.label }}
                                </div>
                                <div class="text-[10px] text-gray-400 font-mono">{{ stat.correct }}/{{
                                    stat.total }}
                                </div>
                            </div>
                        </div>

                        <div class="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div class="bg-green-50 p-4 rounded border border-green-100 text-center">
                                <div class="text-3xl font-bold text-green-600">{{ selectedExam.score }}
                                </div>
                                <div class="text-xs text-green-800 uppercase font-bold">Tổng Điểm</div>
                            </div>
                            <div class="bg-blue-50 p-4 rounded border border-blue-100 text-center">
                                <div class="text-3xl font-bold text-blue-600">{{
                                    Math.round((selectedExam.score /
                                        selectedExam.total) * 100) }}%</div>
                                <div class="text-xs text-blue-800 uppercase font-bold">Tỷ lệ đúng</div>
                            </div>
                            <div class="bg-red-50 p-4 rounded border border-red-100 text-center">
                                <div class="text-3xl font-bold text-red-600">{{ selectedExam.total -
                                    selectedExam.score }}</div>
                                <div class="text-xs text-red-800 uppercase font-bold">Câu sai</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
