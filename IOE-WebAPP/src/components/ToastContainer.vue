<script setup lang="ts">
import { useToast } from '../modules/useToast';

const { toasts, remove } = useToast();
</script>

<template>
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <TransitionGroup enter-active-class="transform ease-out duration-300 transition"
            enter-from-class="translate-x-8 opacity-0" enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100"
            leave-to-class="opacity-0 translate-x-8">
            <div v-for="toast in toasts" :key="toast.id" @click="remove(toast.id)"
                class="pointer-events-auto min-w-[300px] max-w-sm rounded-lg shadow-lg border-l-4 p-4 cursor-pointer hover:shadow-xl transition-shadow flex items-start gap-3 bg-white"
                :class="{
                    'border-green-500': toast.type === 'success',
                    'border-red-500': toast.type === 'error',
                    'border-blue-500': toast.type === 'info',
                    'border-yellow-500': toast.type === 'warning'
                }">
                <div class="flex-shrink-0 mt-0.5">
                    <i v-if="toast.type === 'success'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
                    <i v-else-if="toast.type === 'error'"
                        class="fa-solid fa-circle-exclamation text-red-500 text-lg"></i>
                    <i v-else-if="toast.type === 'warning'"
                        class="fa-solid fa-triangle-exclamation text-yellow-500 text-lg"></i>
                    <i v-else class="fa-solid fa-circle-info text-blue-500 text-lg"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="font-bold text-sm text-gray-800 capitalize" :class="{
                        'text-green-800': toast.type === 'success',
                        'text-red-800': toast.type === 'error',
                        'text-yellow-800': toast.type === 'warning',
                        'text-blue-800': toast.type === 'info'
                    }">
                        {{ toast.type }}
                    </h4>
                    <p class="text-sm text-gray-600 leading-snug">{{ toast.message }}</p>
                </div>
                <button class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>
