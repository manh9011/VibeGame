<script setup lang="ts">
import { RouterView } from 'vue-router';
import GlobalModal from './components/GlobalModal.vue';
import ToastContainer from './components/ToastContainer.vue';
import { useQuestions } from './modules/useQuestions';

const { load } = useQuestions();
load(); // Start loading data (Cloud + Local)
</script>

<template>
    <div class="min-h-screen flex flex-col font-nunito bg-green-50">
        <GlobalModal />
        <ToastContainer />
        <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
                <component :is="Component" />
            </Transition>
        </RouterView>
    </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
