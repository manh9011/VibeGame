import { createRouter, createWebHistory } from 'vue-router';
import IntroView from '../views/IntroView.vue';
import GameView from '../views/GameView.vue';
import ResultView from '../views/ResultView.vue';
import AdminView from '../views/AdminView.vue';

// Admin Sub-views (will be created shortly)
import AdminConfig from '../views/admin/AdminConfig.vue';
import AdminQuestions from '../views/admin/AdminQuestions.vue';
import AdminHistory from '../views/admin/AdminHistory.vue';
import AdminDifficulty from '../views/admin/AdminDifficulty.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/intro'
        },
        {
            path: '/intro',
            name: 'intro',
            component: IntroView
        },
        {
            path: '/game',
            name: 'game',
            component: GameView
        },
        {
            path: '/result',
            name: 'result',
            component: ResultView
        },
        {
            path: '/admin',
            component: AdminView, // This will be the layout shell
            children: [
                {
                    path: '',
                    redirect: '/admin/config'
                },
                {
                    path: 'config', // /admin/config (mapped to api/config concept from user request, but naming it config for clarity matching UI)
                    name: 'admin-config',
                    component: AdminConfig
                },
                {
                    path: 'difficulty',
                    name: 'admin-difficulty',
                    component: AdminDifficulty
                },
                {
                    path: 'question-mgr', // /admin/question-mgr
                    name: 'admin-questions',
                    component: AdminQuestions
                },
                {
                    path: 'history', // /admin/history
                    name: 'admin-history',
                    component: AdminHistory
                },
                // Mapping 'api' to config as per user request structure loosely
                {
                    path: 'api',
                    redirect: '/admin/config'
                }
            ]
        }
    ]
});

export default router;
