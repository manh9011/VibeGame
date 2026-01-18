<script setup lang="ts">
import { useAdmin } from '../modules/useAdmin';
import { useQuestions } from '../modules/useQuestions';
import { useRouter, RouterLink, RouterView } from 'vue-router';

const router = useRouter();

const {
    adminAuth,
    adminPassword,
    loginError,
    checkAdmin
} = useAdmin();

// We still need questions/examResults just for the counts in the sidebar
const { questions, examResults } = useQuestions();

const closeAdmin = () => {
    router.push('/');
};
</script>

<template>
    <div class="flex-grow flex flex-col h-screen bg-gray-100">
        <!-- Admin Header -->
        <div class="bg-white shadow px-6 py-4 flex justify-between items-center z-20">
            <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                <i class="fa-solid fa-screwdriver-wrench"></i> Quản trị hệ thống
            </h2>
            <button @click="closeAdmin" class="text-gray-500 hover:text-red-500 font-bold">
                <i class="fa-solid fa-xmark"></i> Đóng
            </button>
        </div>

        <!-- Admin Content -->
        <div class="flex-grow overflow-hidden flex flex-col md:flex-row">

            <!-- Sidebar (Tabs) -->
            <div class="w-full md:w-64 bg-white border-r flex flex-col overflow-y-auto">
                <div class="p-4">
                    <div v-if="!adminAuth">
                        <label class="block text-xs font-bold mb-1">Mật khẩu</label>
                        <input type="password" v-model="adminPassword" class="border p-2 rounded w-full mb-2"
                            @keyup.enter="checkAdmin">
                        <button @click="checkAdmin"
                            class="bg-blue-600 text-white text-sm px-3 py-2 rounded w-full">Login</button>
                        <p v-if="loginError" class="text-red-500 text-xs mt-1">Sai mật khẩu!</p>
                    </div>
                    <div v-else>
                        <div class="text-xs font-bold text-gray-400 uppercase mb-2">Menu</div>

                        <RouterLink :to="{ name: 'admin-config' }" custom v-slot="{ navigate, isActive }">
                            <button @click="navigate"
                                :class="['w-full text-left px-4 py-2 rounded mb-1 text-sm font-bold flex items-center gap-2', isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600']">
                                <i class="fa-solid fa-sliders"></i> Cấu hình & Sinh câu hỏi
                            </button>
                        </RouterLink>

                        <RouterLink :to="{ name: 'admin-difficulty' }" custom v-slot="{ navigate, isActive }">
                            <button @click="navigate"
                                :class="['w-full text-left px-4 py-2 rounded mb-1 text-sm font-bold flex items-center gap-2', isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600']">
                                <i class="fa-solid fa-gauge-high"></i> Cấu hình Độ khó
                            </button>
                        </RouterLink>

                        <RouterLink :to="{ name: 'admin-questions' }" custom v-slot="{ navigate, isActive }">
                            <button @click="navigate"
                                :class="['w-full text-left px-4 py-2 rounded mb-1 text-sm font-bold flex items-center gap-2', isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600']">
                                <i class="fa-solid fa-list-check"></i> Quản lý câu hỏi ({{ questions.length }})
                            </button>
                        </RouterLink>

                        <RouterLink :to="{ name: 'admin-history' }" custom v-slot="{ navigate, isActive }">
                            <button @click="navigate"
                                :class="['w-full text-left px-4 py-2 rounded mb-1 text-sm font-bold flex items-center gap-2', isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600']">
                                <i class="fa-solid fa-clock-rotate-left"></i> Lịch sử thi ({{ examResults.length }})
                            </button>
                        </RouterLink>
                    </div>
                </div>
            </div>

            <!-- Main Admin Panel (Sub-views) -->
            <div v-if="adminAuth" class="flex-grow flex flex-col overflow-hidden relative">
                <RouterView />
            </div>
        </div>
    </div>
</template>