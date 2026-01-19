<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuestions } from '../../modules/useQuestions';
import { useModal } from '../../modules/useModal';
import { useAdmin } from '../../modules/useAdmin'; // Need apiKeys for image preview
import QuestionChart from '../../components/QuestionChart.vue';

const { questions, addQuestion, save, deleteQuestion, deleteAllQuestions, removeDuplicates, load } = useQuestions();
const { showAlert, showConfirm } = useModal();
const { apiKeys } = useAdmin(); // For pollinations key if needed

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

// Filter & Sort
const filterGrade = ref<number>(1); // Default to Grade 1
const filterVisibility = ref<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL');
const filterType = ref<number>(0); // 0 = All

const filteredQuestions = computed(() => {
    let result = questions.value;

    // Filter by Grade
    if (filterGrade.value !== 0) {
        result = result.filter(q => q.grade === filterGrade.value);
    }

    // Filter by Type
    if (filterType.value !== 0) {
        result = result.filter(q => q.type === filterType.value);
    }

    // Filter by Visibility
    if (filterVisibility.value === 'VISIBLE') {
        result = result.filter(q => !q.isHidden);
    } else if (filterVisibility.value === 'HIDDEN') {
        result = result.filter(q => q.isHidden);
    }

    return result;
});

// Editing State
const editingQuestion = ref<any | null>(null);

// Toggle Hidden
const toggleHidden = async (q: any) => {
    q.isHidden = !q.isHidden;
    await save();
};

// Delete Modal State
const showDeleteModal = ref(false);
const deleteTargetIndex = ref<number | 'ALL' | null>(null);

const confirmDelete = (idx: number | 'ALL') => {
    deleteTargetIndex.value = idx;
    showDeleteModal.value = true;
};

const executeDelete = async () => {
    if (deleteTargetIndex.value === 'ALL') {
        await deleteAllQuestions();
    } else if (typeof deleteTargetIndex.value === 'number') {
        await deleteQuestion(deleteTargetIndex.value);
    }
    cancelDelete();
    alert("Đã xóa và lưu thành công!");
};

const cancelDelete = () => {
    showDeleteModal.value = false;
    deleteTargetIndex.value = null;
};

// Preview Modal State
const showPreviewModal = ref(false);
const previewQuestion = ref<any | null>(null);
const isAudioPlaying = ref(false);
const previewImage = ref('');
const isImageLoading = ref(false);

const playAudio = (text: string) => {
    if (!text) return;

    window.speechSynthesis.cancel();

    // Strip HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";

    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = 'en-US';
    u.rate = 0.9;

    u.onstart = () => { isAudioPlaying.value = true; };
    u.onend = () => { isAudioPlaying.value = false; };
    u.onerror = () => { isAudioPlaying.value = false; };

    window.speechSynthesis.speak(u);
};

const openPreview = async (q: any) => {
    previewQuestion.value = q;
    showPreviewModal.value = true;
    previewImage.value = '';

    // Auto-load image for type 10
    if (q.type === 10 && q.imagePrompt) {
        isImageLoading.value = true;
        try {
            const encodedPrompt = encodeURIComponent(q.imagePrompt);
            const response = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`, {
                headers: {
                    'Authorization': `Bearer ${apiKeys.value.pollinations || ''}`,
                    'Referer': 'https://pollinations.ai/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            if (response.ok) {
                const blob = await response.blob();
                previewImage.value = URL.createObjectURL(blob);
            }
        } catch (e) {
            console.error("Image loading failed", e);
        } finally {
            isImageLoading.value = false;
        }
    }
};

const closePreview = () => {
    showPreviewModal.value = false;
    window.speechSynthesis.cancel();
    isAudioPlaying.value = false;
};

const setBatchVisibility = async (visible: boolean) => {
    if (!filteredQuestions.value.length) return;

    if (await showConfirm(`Bạn có chắc chắn muốn ${visible ? 'HIỆN' : 'ẨN'} tất cả ${filteredQuestions.value.length} câu hỏi trong danh sách này?`, "Xác nhận")) {
        // Actually simple logic: just set them all.
        filteredQuestions.value.forEach(q => q.isHidden = !visible);
        await save();
        await showAlert(`Đã cập nhật xong!`, "Thành công");
    }
};

const handleRemoveDuplicates = async () => {
    if (await showConfirm("Bạn có chắc chắn muốn quét và xóa các câu hỏi trùng lặp không?", "Xác nhận xóa")) {
        const count = await removeDuplicates();
        await showAlert(`Đã xóa ${count} câu hỏi trùng lặp!`, "Hoàn tất");
    }
};

const saveQuestionsToStorage = async () => {
    await save();
    await showAlert("Đã lưu thành công!", "Thông báo");
};

const addEmptyQuestion = async () => {
    const newQ = {
        type: 1,
        question: "New Question",
        correct: "A",
        options: ["A", "B", "C", "D"],
        imagePrompt: "",
        audioScript: "",
        grade: filterGrade.value // Use current filter (which is now always valid)
    };
    await addQuestion(newQ as any);
};

const handleStrOptions = (q: any, val: string) => {
    q.options = val.split(',').map(s => s.trim());
};

const handleRefresh = async () => {
    await load();
    await showAlert("Đã làm mới danh sách câu hỏi!", "Thành công");
};
</script>

<template>
    <div class="flex-grow flex flex-col h-full overflow-hidden">
        <!-- Sticky Toolbar -->
        <div
            class="p-6 pb-2 bg-white sticky top-0 z-10 border-b flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <div class="flex items-center gap-4 flex-wrap">
                <h3 class="font-bold text-lg whitespace-nowrap">Danh sách ({{ filteredQuestions.length }})
                </h3>
                <select v-model="filterGrade" class="border p-1 rounded text-sm font-bold text-indigo-700 bg-indigo-50">
                    <option v-for="i in 12" :key="i" :value="i">Lớp {{ i }}</option>
                </select>
                <select v-model="filterVisibility"
                    class="border p-1 rounded text-sm font-bold text-gray-700 bg-gray-50">
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="VISIBLE">Đang hiện (Công khai)</option>
                    <option value="HIDDEN">Đang ẩn (Chờ duyệt)</option>
                </select>
                <select v-model="filterType" class="border p-1 rounded text-sm font-bold text-blue-700 bg-blue-50">
                    <option :value="0">Tất cả loại câu hỏi</option>
                    <option v-for="(label, key) in QUESTION_TYPES" :key="key" :value="Number(key)">
                        {{ label }}
                    </option>
                </select>
            </div>
            <div class="space-x-2 flex-shrink-0">
                <button @click="handleRefresh"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold"><i
                        class="fa-solid fa-sync"></i> Refresh</button>
                <button @click="addEmptyQuestion" class="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold"><i
                        class="fa-solid fa-plus"></i> Thêm</button>
                <button @click="saveQuestionsToStorage"
                    class="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold"><i class="fa-solid fa-save"></i>
                    Lưu</button>
                <button @click="confirmDelete('ALL')"
                    class="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"><i class="fa-solid fa-trash"></i>
                    Xóa hết</button>
                <div class="inline-block relative group">
                    <button class="bg-gray-200 px-3 py-1 rounded text-sm font-bold border"><i
                            class="fa-solid fa-ellipsis-vertical"></i></button>
                    <!-- Dropdown context menu -->
                    <div
                        class="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border rounded shadow-lg w-48 z-50">
                        <button @click="setBatchVisibility(true)"
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold">
                            Hiện tất cả
                        </button>
                        <button @click="setBatchVisibility(false)"
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold">
                            Ẩn tất cả
                        </button>
                        <hr>
                        <button @click="handleRemoveDuplicates"
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold text-red-600">
                            Quét trùng lặp
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-grow overflow-y-auto p-6 pt-4 space-y-4">
            <!-- Distribution Chart -->
            <QuestionChart v-if="filterType === 0" :questions="filteredQuestions" />

            <!-- Question List -->
            <div class="space-y-4">
                <div v-for="q in filteredQuestions" :key="q.id"
                    :class="['bg-white p-4 rounded-lg shadow border border-gray-200', q.isHidden ? 'opacity-60 bg-gray-100' : '']">

                    <!-- View Mode -->
                    <div v-if="editingQuestion !== q">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-gray-800 flex-grow pr-4 max-h-20 overflow-hidden text-ellipsis"
                                v-html="q.question"></h4>
                            <div class="flex space-x-2 flex-shrink-0">
                                <button @click="openPreview(q)" class="text-blue-500 hover:text-blue-700"
                                    title="Xem thử"><i class="fa-solid fa-eye"></i></button>
                                <button @click="toggleHidden(q)"
                                    :class="['transition', q.isHidden ? 'text-gray-400 hover:text-green-500' : 'text-green-500 hover:text-gray-500']"
                                    :title="q.isHidden ? 'Hiện câu hỏi' : 'Ẩn câu hỏi'">
                                    <i :class="['fa-solid', q.isHidden ? 'fa-eye-slash' : 'fa-eye']"></i>
                                </button>
                                <button @click="editingQuestion = q" class="text-orange-500 hover:text-orange-700"><i
                                        class="fa-solid fa-pen"></i></button>
                                <button @click="confirmDelete(questions.indexOf(q))"
                                    class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
                            <div class="bg-gray-50 p-1 rounded px-2"><span class="font-bold">Loại:</span> {{
                                QUESTION_TYPES[q.type] || q.type }}</div>
                            <div
                                :class="['p-1 rounded px-2 font-bold', q.isHidden ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600']">
                                {{ q.isHidden ? 'ĐANG ẨN' : 'ĐANG HIỆN' }}</div>
                            <div class="bg-gray-50 p-1 rounded px-2"><span class="font-bold">Đáp án:</span>
                                {{ q.correct }}</div>
                            <div v-if="q.grade" class="bg-blue-50 p-1 rounded px-2 text-blue-700"><span
                                    class="font-bold">Lớp:</span> {{ q.grade }}</div>
                        </div>
                    </div>

                    <!-- Edit Mode -->
                    <div v-else class="space-y-3 bg-blue-50 p-4 rounded-lg animate-fade-in-down">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold mb-1">Loại Câu Hỏi</label>
                                <select v-model="q.type" class="w-full border p-1 rounded text-sm">
                                    <option v-for="(label, key) in QUESTION_TYPES" :key="key" :value="Number(key)">{{
                                        label }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold mb-1">Lớp</label>
                                <select v-model="q.grade" class="w-full border p-1 rounded text-sm">
                                    <option v-for="i in 12" :key="i" :value="i">{{ i }}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold mb-1">Câu hỏi (HTML support)</label>
                            <textarea v-model="q.question" class="w-full border p-2 rounded" rows="2"></textarea>
                        </div>

                        <div>
                            <label class="block text-xs font-bold mb-1">Options (cách nhau bởi dấu
                                phẩy)</label>
                            <input :value="q.options.join(', ')"
                                @input="e => handleStrOptions(q, (e.target as HTMLInputElement).value)" type="text"
                                class="w-full border p-2 rounded mb-1">
                            <div class="flex flex-wrap gap-2">
                                <span v-for="(opt, i) in q.options" :key="i"
                                    class="bg-white border rounded px-2 text-xs text-gray-500">{{ opt }}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold mb-1">Đáp án đúng (Text khớp 100%
                                    với option)</label>
                                <input v-model="q.correct" type="text" class="w-full border p-2 rounded">
                            </div>
                            <div>
                                <label class="block text-xs font-bold mb-1">Audio Script (Cho loại
                                    Nghe/Phát âm)</label>
                                <input v-model="q.audioScript" type="text" class="w-full border p-2 rounded">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold mb-1">Image Prompt (Cho loại mô tả
                                ảnh/10)</label>
                            <input v-model="q.imagePrompt" type="text" class="w-full border p-2 rounded">
                        </div>

                        <div class="flex justify-end pt-2">
                            <button @click="editingQuestion = null"
                                class="w-full bg-blue-600 text-white py-1 rounded font-bold text-sm">Xong</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Custom Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full animate-fade-in-down">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fa-solid fa-triangle-exclamation text-red-500 mr-2"></i> Xác nhận xóa
                </h3>
                <p class="text-gray-600 mb-6">
                    {{ deleteTargetIndex === 'ALL' ? 'Bạn có chắc chắn muốn xóa TOÀN BỘ câu hỏi không?' :
                        'Bạn có chắc chắn muốn xóa câu hỏi này không ? ' }}
                    <br>Hành động này không thể hoàn tác.
                </p>
                <div class="flex justify-end space-x-3">
                    <button @click="cancelDelete"
                        class="px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300">Hủy</button>
                    <button @click="executeDelete"
                        class="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700">Xóa
                        ngay</button>
                </div>
            </div>
        </div>

        <!-- Preview Modal -->
        <div v-if="showPreviewModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div
                class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-down flex flex-col">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="font-bold text-lg text-gray-800"><i class="fa-solid fa-eye text-indigo-500"></i> Xem thử
                        câu hỏi</h3>
                    <button @click="closePreview" class="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
                </div>

                <div class="p-6 bg-slate-50 flex-grow">
                    <!-- Preview Content (Similar to GameView) -->
                    <div class="bg-white rounded-2xl shadow-lg p-6 min-h-[300px] flex flex-col">
                        <div class="mb-6">
                            <span
                                class="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-indigo-500 mb-3">
                                {{ QUESTION_TYPES[previewQuestion?.type || 1] }} (Type: {{ previewQuestion?.type }})
                            </span>

                            <!-- Image Preview -->
                            <div v-if="previewQuestion?.type === 10 && previewQuestion.imagePrompt"
                                class="mb-4 flex justify-center">
                                <div
                                    class="relative rounded-lg overflow-hidden shadow-md bg-gray-100 min-w-[300px] min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <div v-if="isImageLoading" class="flex flex-col items-center">
                                        <div
                                            class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2">
                                        </div>
                                        <p class="text-xs text-gray-500">Đang tạo ảnh...</p>
                                    </div>
                                    <img v-else-if="previewImage" :src="previewImage"
                                        class="max-w-full h-auto rounded-lg shadow-lg" alt="AI Generated">
                                    <div v-else class="text-center p-4">
                                        <i class="fa-solid fa-image text-4xl text-gray-300 mb-2"></i>
                                        <p class="text-sm text-gray-500 italic">{{ previewQuestion.imagePrompt }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Audio Preview -->
                            <div v-if="[6].includes(previewQuestion?.type) || previewQuestion?.audioScript"
                                class="mb-4 flex justify-center">
                                <button @click="playAudio(previewQuestion.audioScript || previewQuestion.question)"
                                    :disabled="isAudioPlaying"
                                    :class="['flex items-center space-x-2 px-4 py-2 rounded-full font-bold shadow-sm transition transform hover:scale-105', isAudioPlaying ? 'bg-orange-400 text-white animate-pulse' : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900']">
                                    <i class="fa-solid" :class="isAudioPlaying ? 'fa-music' : 'fa-volume-high'"></i>
                                    <span>{{ isAudioPlaying ? 'Đang đọc...' : 'Nghe (AI Voice)' }}</span>
                                </button>
                            </div>

                            <!-- Reading Passage -->
                            <div v-if="previewQuestion?.passage"
                                class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400 mb-4 text-gray-700 italic leading-relaxed text-sm md:text-base">
                                "{{ previewQuestion.passage }}"
                            </div>

                            <h2 class="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed"
                                v-html="previewQuestion?.question"></h2>
                        </div>

                        <!-- Answers Preview -->
                        <div class="flex-grow flex flex-col justify-end">
                            <!-- Input Type -->
                            <div v-if="previewQuestion?.type === 8" class="w-full">
                                <input type="text" disabled
                                    class="w-full border-2 border-gray-300 p-4 rounded-xl text-lg bg-gray-100"
                                    placeholder="Người chơi sẽ nhập đáp án ở đây...">
                            </div>

                            <!-- Scramble Type -->
                            <div v-else-if="previewQuestion?.type === 5" class="space-y-4">
                                <div
                                    class="min-h-[60px] bg-gray-100 rounded-xl p-3 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                                    Vùng thả từ
                                </div>
                                <div class="flex flex-wrap gap-2 justify-center">
                                    <span
                                        class="bg-white border px-3 py-2 rounded-lg shadow-sm font-medium text-gray-500">Word
                                        1</span>
                                    <span
                                        class="bg-white border px-3 py-2 rounded-lg shadow-sm font-medium text-gray-500">Word
                                        2</span>
                                    <span
                                        class="bg-white border px-3 py-2 rounded-lg shadow-sm font-medium text-gray-500">...</span>
                                </div>
                            </div>

                            <!-- Multiple Choice -->
                            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div v-for="(opt, idx) in previewQuestion?.options" :key="idx"
                                    :class="['p-4 rounded-xl border-2 transition flex items-center', opt === previewQuestion.correct ? 'border-green-500 bg-green-50' : 'border-gray-200']">
                                    <span
                                        :class="['w-8 h-8 rounded-full font-bold flex items-center justify-center mr-3', opt === previewQuestion.correct ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600']">
                                        {{ ['A', 'B', 'C', 'D'][+idx] }}
                                    </span>
                                    <span class="font-medium text-gray-700">{{ opt }}</span>
                                    <i v-if="opt === previewQuestion.correct"
                                        class="fa-solid fa-check text-green-600 ml-auto"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
