/// <reference types="vite/client" />

interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
}

interface FilePickerOptions {
    multiple?: boolean;
    types?: FilePickerAcceptType[];
}

interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | BufferSource | string): Promise<void>;
    close(): Promise<void>;
}

interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
}

interface Window {
    showOpenFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>;
}
