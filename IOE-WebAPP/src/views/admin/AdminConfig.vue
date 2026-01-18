<script setup lang="ts">
import { useAdmin } from '../../modules/useAdmin';

const {
    apiKeys,
    knowledgeText,
    targetGrade,
    isGenerating,
    generateStatus,
    generateQuestions
} = useAdmin();
</script>

<template>
    <div class="flex-grow overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 w-full">

        <!-- API Keys -->
        <div class="bg-white p-6 rounded-xl shadow-sm border">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><i class="fa-solid fa-key"></i> API
                Configuration</h3>
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Gemini API Key (Bắt buộc để
                            sinh)</label>
                        <input v-model="apiKeys.gemini" type="text"
                            class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="AIzaSy...">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Pollinations API Key (Tùy
                            chọn)</label>
                        <input v-model="apiKeys.pollinations" type="text"
                            class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Để trống nếu dùng free tier">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Gemini API URL (Tùy chọn - Custom Endpoint)</label>
                    <input v-model="apiKeys.geminiApiUrl" type="text"
                        class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp">
                    <p class="text-xs text-gray-500 mt-1">Để trống để dùng URL mặc định. URL không cần bao gồm ":generateContent"</p>
                </div>
            </div>
        </div>


        <!-- Knowledge Input & Generate -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <h3 class="font-bold text-lg mb-2 text-indigo-900 flex items-center gap-2"><i class="fa-solid fa-robot"></i>
                Sinh câu hỏi từ chủ đề</h3>
            <p class="text-sm text-gray-600 mb-4">Nhập chủ đề ngữ pháp/từ vựng và chọn lớp để AI sinh câu
                hỏi phù hợp.</p>

            <div class="flex flex-col space-y-4">
                <!-- Topic Input -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Chủ đề kiến thức (Tiếng
                        Anh/Việt):</label>
                    <textarea v-model="knowledgeText" rows="3"
                        class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Ví dụ: Past Simple Tense, Animals, Family members..."></textarea>
                </div>

                <!-- Grade Selector -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Trình độ (Lớp 1-12):</label>
                    <select v-model="targetGrade" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500">
                        <option v-for="i in 12" :key="i" :value="i">Lớp {{ i }}</option>
                    </select>
                </div>

                <!-- Status & Button -->
                <div v-if="isGenerating" class="p-4 bg-blue-50 rounded-lg text-blue-700 flex items-center gap-3">
                    <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent">
                    </div>
                    <span class="font-bold">{{ generateStatus }}</span>
                </div>

                <button v-if="!isGenerating" @click="generateQuestions(apiKeys)"
                    :disabled="!knowledgeText || !apiKeys.gemini"
                    :class="['w-full py-3 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition', (!knowledgeText || !apiKeys.gemini) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700']">
                    <i class="fa-solid fa-bolt"></i> Sinh 100 Câu Hỏi
                </button>
            </div>
        </div>
    </div>
</template>
