import { create, Mutate, StoreApi } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

// Serializable representation of a file
export type SerializedFile = {
    name: string;
    type: string;
    content: string; // base64-encoded content
    path?: string;
};

type FileStoreState = {
    files: SerializedFile[]; // stored as serializable content
};

type FileStoreActions = {
    setFiles: (files: FileList | null) => Promise<void>;
    clearFiles: () => void;
    removeFile: (file_name: string) => Promise<void>;
    addFile: (file: File) => Promise<void>;
};

type FileStore = FileStoreState & FileStoreActions;

// Custom storage object
export const indexDBStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

export function readFileAsBase64(file: File): Promise<SerializedFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve({
                name: file.name,
                type: file.type,
                content: reader.result as string,
                path: (file as any).webkitRelativePath || file.name,
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

type StoreWithPersist = Mutate<
    StoreApi<FileStore>,
    [["zustand/persist", unknown]]
>;

export const withStorageDOMEvents = (store: StoreWithPersist) => {
    const storageEventCallback = (e: StorageEvent) => {
        if (e.key === store.persist.getOptions().name && e.newValue) {
            store.persist.rehydrate();
        }
    };

    window.addEventListener("storage", storageEventCallback);

    return () => {
        window.removeEventListener("storage", storageEventCallback);
    };
};

const useFileStore = create<FileStore>()(
    persist(
        (set) => ({
            files: [],
            setFiles: async (files: FileList | null) => {
                if (!files) return;

                const fileArray = Array.from(files).filter(
                    (f) => f.type !== "text/csv",
                );
                const serializedFiles = await Promise.all(
                    fileArray.map(readFileAsBase64),
                );

                set({
                    files: serializedFiles,
                });
            },
            addFile: async (file: File) => {
                const serializedFile = await readFileAsBase64(file);
                set((state) => ({
                    files: [...state.files, serializedFile],
                }));
            },
            removeFile: async (file_name: string) => {
                set((state) => ({
                    files: state.files.filter((f) => f.name !== file_name),
                }));
            },
            clearFiles: () =>
                set({
                    files: [],
                }),
        }),
        {
            name: "fileStore",
            storage: createJSONStorage(() => indexDBStorage),
        },
    ),
);

withStorageDOMEvents(useFileStore);

export default useFileStore;
