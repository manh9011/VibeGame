<template>
    <div class="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div class="flex justify-between items-center cursor-pointer" @click="isCollapsed = !isCollapsed">
            <h3 class="font-bold text-gray-700 flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-indigo-500"></i> Phân bổ câu hỏi
            </h3>
            <button class="text-gray-500 hover:text-indigo-600 transition-transform duration-200"
                :class="{ 'rotate-180': isCollapsed }">
                <i class="fa-solid fa-chevron-up"></i>
            </button>
        </div>

        <div v-show="!isCollapsed">

            <div v-if="totalQuestions === 0" class="text-center text-gray-400 text-sm py-4">
                Chưa có câu hỏi nào trong danh sách lọc.
            </div>

            <div v-else class="flex flex-col lg:flex-row gap-6">
                <!-- Pie Chart -->
                <div class="flex-shrink-0 flex justify-center">
                    <svg :width="pieSize" :height="pieSize" class="drop-shadow-md">
                        <g :transform="`translate(${pieSize / 2}, ${pieSize / 2})`">
                            <path v-for="(slice, idx) in pieSlices" :key="idx" :d="slice.path" :fill="slice.color"
                                class="hover:opacity-80 transition-opacity cursor-pointer" :stroke="'white'"
                                :stroke-width="2" @mouseenter="hoveredSlice = idx" @mouseleave="hoveredSlice = null" />
                            <!-- Center circle for donut effect -->
                            <circle :r="pieSize / 4" fill="white" />
                            <text text-anchor="middle" dominant-baseline="middle"
                                class="font-bold text-lg fill-gray-700" dy="-5">{{ totalQuestions }}</text>
                            <text text-anchor="middle" dominant-baseline="middle" class="text-xs fill-gray-400"
                                dy="12">câu
                                hỏi</text>
                        </g>
                    </svg>
                </div>

                <!-- Legend -->
                <div class="flex-shrink-0 grid grid-cols-2 gap-x-4 gap-y-1 text-xs self-center">
                    <div v-for="(stat, idx) in stats" :key="stat.type"
                        class="flex items-center gap-2 transition-all duration-300 origin-left scale-90"
                        :class="{ 'opacity-50': stat.count === 0, '!scale-100 underline': hoveredSlice === idx }">
                        <span class="w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: colors[idx] }"></span>
                        <span class="truncate max-w-[100px]" :title="stat.label">{{ stat.label }}</span>
                        <span class="font-bold text-gray-600">({{ stat.count }})</span>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="flex-grow grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 self-center">
                    <div class="bg-indigo-50 p-2 rounded text-center">
                        <div class="text-lg font-bold text-indigo-700">{{ maxType.count }}</div>
                        <div class="text-[10px] text-indigo-500 uppercase font-bold truncate">{{ maxType.label }}</div>
                        <div class="text-[10px] text-gray-400">Nhiều nhất</div>
                    </div>
                    <div class="bg-orange-50 p-2 rounded text-center">
                        <div class="text-lg font-bold text-orange-700">{{ minType.count }}</div>
                        <div class="text-[10px] text-orange-500 uppercase font-bold truncate">{{ minType.label }}</div>
                        <div class="text-[10px] text-gray-400">Ít nhất</div>
                    </div>
                    <div class="bg-green-50 p-2 rounded text-center">
                        <div class="text-lg font-bold text-green-700">{{ coveragePercent }}%</div>
                        <div class="text-[10px] text-green-500 uppercase font-bold">Độ phủ</div>
                        <div class="text-[10px] text-gray-400">{{ activeTypes }} / 10 loại</div>
                    </div>
                    <div class="bg-gray-50 p-2 rounded text-center">
                        <div class="text-lg font-bold text-gray-700">{{ avgPerType }}</div>
                        <div class="text-[10px] text-gray-500 uppercase font-bold">Trung bình</div>
                        <div class="text-[10px] text-gray-400">câu / loại</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Question } from '../types';

const props = defineProps<{
    questions: Question[];
}>();

const isCollapsed = ref(false);
const hoveredSlice = ref<number | null>(null);
const pieSize = 150;

const QUESTION_TYPES: Record<number, string> = {
    1: 'Điền chỗ trống',
    2: 'Đọc hiểu',
    3: 'Đúng/Sai',
    4: 'Tìm lỗi sai',
    5: 'Ghép câu',
    6: 'Nghe',
    7: 'Sắp xếp từ',
    8: 'Điền từ (Nhập)',
    9: 'Phát âm',
    10: 'Mô tả ảnh'
};

const colors = [
    '#6366f1', // indigo
    '#f97316', // orange
    '#22c55e', // green
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#eab308', // yellow
    '#ec4899', // pink
    '#14b8a6', // teal
    '#64748b', // slate
];

const totalQuestions = computed(() => props.questions.length);

const stats = computed(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) counts[i] = 0;

    props.questions.forEach(q => {
        const t = q.type || 1;
        if (counts[t] !== undefined) counts[t]++;
        else counts[t] = (counts[t] || 0) + 1;
    });

    const total = totalQuestions.value;

    return Object.entries(counts).map(([type, count]) => {
        const typeId = Number(type);
        return {
            type: typeId,
            label: QUESTION_TYPES[typeId] || `Type ${typeId}`,
            count,
            percent: total > 0 ? Math.round((count / total) * 100) : 0
        };
    }).sort((a, b) => b.count - a.count);
});

// Pie chart slices
const pieSlices = computed(() => {
    const total = totalQuestions.value;
    if (total === 0) return [];

    const radius = pieSize / 2 - 5;
    let startAngle = -Math.PI / 2; // Start from top

    return stats.value.map((stat, idx) => {
        const angle = (stat.count / total) * 2 * Math.PI;
        const endAngle = startAngle + angle;

        const x1 = Math.cos(startAngle) * radius;
        const y1 = Math.sin(startAngle) * radius;
        const x2 = Math.cos(endAngle) * radius;
        const y2 = Math.sin(endAngle) * radius;

        const largeArc = angle > Math.PI ? 1 : 0;

        const path = stat.count === 0
            ? ''
            : `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        startAngle = endAngle;

        return {
            path,
            color: colors[idx % colors.length],
            stat
        };
    });
});

const maxType = computed(() => stats.value[0] || { label: '-', count: 0 });
const minType = computed(() => {
    const active = stats.value.filter(s => s.count > 0);
    if (!active.length) return { label: '-', count: 0 };
    return stats.value[stats.value.length - 1];
});

const activeTypes = computed(() => stats.value.filter(s => s.count > 0).length);
const coveragePercent = computed(() => Math.round((activeTypes.value / 10) * 100));
const avgPerType = computed(() => totalQuestions.value > 0 ? Math.round(totalQuestions.value / 10) : 0);

</script>
