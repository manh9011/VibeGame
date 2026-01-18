<script setup lang="ts">
import { useModal } from '../modules/useModal';

const { isOpen, type, title, message, confirm, cancel } = useModal();
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-50 transition-opacity" @click="cancel"></div>

        <!-- Modal Content -->
        <div
            class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 overflow-hidden relative z-10">
            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                <h3 class="text-white font-bold text-lg"><i class="fa-solid fa-bell mr-2"></i> {{ title }}</h3>
                <button @click="cancel" class="text-white hover:text-gray-200 transition-colors">
                    <i class="fa-solid fa-times text-xl"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6">
                <p class="text-gray-700 text-base leading-relaxed whitespace-pre-line">{{ message }}</p>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100">
                <button v-if="type === 'confirm'" @click="cancel"
                    class="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                    Hủy bỏ
                </button>
                <button @click="confirm"
                    class="px-5 py-2 rounded-lg font-bold text-white shadow-md hover:shadow-lg transform active:scale-95 transition-all bg-gradient-to-r from-blue-500 to-indigo-600">
                    {{ type === 'confirm' ? 'Đồng ý' : 'Đóng' }}
                </button>
            </div>
        </div>
    </div>
</template>
