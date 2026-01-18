<template>
    <div class="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div class="flex justify-between items-center mb-4 cursor-pointer" @click="isCollapsed = !isCollapsed">
            <h3 class="font-bold text-gray-700 flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-indigo-500"></i> Phân bổ câu hỏi ({{ totalQuestions }})
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

            <div v-else class="space-y-4">
                <!-- Bars -->
                <div class="space-y-3">
                    <div v-for="stat in stats" :key="stat.type" class="flex items-center gap-3 text-sm">
                        <div class="w-32 text-gray-600 font-medium truncate text-right" :title="stat.label">
                            {{ stat.label }}
                        </div>
                        <div class="flex-grow h-4 bg-gray-100 rounded-full overflow-hidden relative group">
                            <div class="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                :style="{ width: `${stat.percent}%` }">
                            </div>
                            <!-- Tooltip on hover -->
                            <div
                                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 text-white text-[10px] font-bold">
                                {{ stat.count }} ({{ stat.percent }}%)
                            </div>
                        </div>
                        <div class="w-20 text-gray-600 text-xs text-right font-bold">{{ stat.count }} ({{ stat.percent
                            }}%)</div>
                    </div>
                </div>

                <!-- Mini Summary Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t">
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

const totalQuestions = computed(() => props.questions.length);

const stats = computed(() => {
    const counts: Record<number, number> = {};

    // Initialize all types to 0 to show gaps? Or just show what exists?
    // Let's show all types 1-10 so user sees what is missing
    for (let i = 1; i <= 10; i++) counts[i] = 0;

    props.questions.forEach(q => {
        const t = q.type || 1;
        if (counts[t] !== undefined) counts[t]++;
        else {
            // Edge case for unknown types
            counts[t] = (counts[t] || 0) + 1;
        }
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
    }).sort((a, b) => b.count - a.count); // Sort by count desc
});

const maxType = computed(() => stats.value[0] || { label: '-', count: 0 });
const minType = computed(() => {
    const active = stats.value.filter(s => s.count > 0);
    if (!active.length) return { label: '-', count: 0 };
    // get the one with lowest non-zero count? Or simply the absolute lowest (0)?
    // Usually "Least populated" is more useful if we want to fill gaps, so 0 is fine.
    // But if we want "Least of what we have", then filter > 0.
    // Let's go with absolute lowest from the list (which includes 0s)
    return stats.value[stats.value.length - 1];
});

const activeTypes = computed(() => stats.value.filter(s => s.count > 0).length);
const coveragePercent = computed(() => Math.round((activeTypes.value / 10) * 100));
const avgPerType = computed(() => totalQuestions.value > 0 ? Math.round(totalQuestions.value / 10) : 0);

</script>
