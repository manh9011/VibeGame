export interface Question {
    id: string;
    type: number;
    question: string;
    correct: string;
    options: string[];
    imagePrompt?: string;
    audioScript?: string;
    isHidden?: boolean;
    grade?: number;
    passage?: string;
}

export interface ApiKeys {
    gemini: string;
    geminiApiUrl: string;
    pollinations: string;
}

export type ViewState = 'intro' | 'game' | 'result' | 'admin';
export type AdminTab = 'config' | 'questions' | 'history';
export type Difficulty = 'easy' | 'medium' | 'hard';
