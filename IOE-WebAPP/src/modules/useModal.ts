import { ref } from 'vue';

type ModalType = 'alert' | 'confirm';

const isOpen = ref(false);
const type = ref<ModalType>('alert');
const title = ref('');
const message = ref('');
const resolvePromise = ref<((value: boolean) => void) | null>(null);

export function useModal() {
    const showAlert = (msg: string, heading: string = 'Thông báo') => {
        return new Promise<boolean>((resolve) => {
            type.value = 'alert';
            message.value = msg;
            title.value = heading;
            resolvePromise.value = resolve;
            isOpen.value = true;
        });
    };

    const showConfirm = (msg: string, heading: string = 'Xác nhận') => {
        return new Promise<boolean>((resolve) => {
            type.value = 'confirm';
            message.value = msg;
            title.value = heading;
            resolvePromise.value = resolve;
            isOpen.value = true;
        });
    };

    const confirm = () => {
        isOpen.value = false;
        if (resolvePromise.value) {
            resolvePromise.value(true);
            resolvePromise.value = null;
        }
    };

    const cancel = () => {
        isOpen.value = false;
        if (resolvePromise.value) {
            resolvePromise.value(false);
            resolvePromise.value = null;
        }
    };

    return {
        isOpen,
        type,
        title,
        message,
        showAlert,
        showConfirm,
        confirm,
        cancel
    };
}
