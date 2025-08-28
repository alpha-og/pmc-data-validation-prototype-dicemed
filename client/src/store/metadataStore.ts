import Papa from "papaparse";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ImageMetadata = {
    file_id: string;
    file: string;
    file_path: string;
    main_image: string;
    case_id: string;
    license: string;
    file_size: string;
    split_during_preprocessing: boolean;
    caption: string;
    image_type: string;
    image_subtype: string;
    radiology_region: string;
    radiology_region_granular: string;
    radiology_view: string;
    ml_labels_for_supervised_classification: string[];
    gt_labels_for_semisupervised_classification: string[];
    verified: boolean;
};

export type ImageMetadataSuggestions = {
    file_id: string[];
    file: string[];
    file_path: string[];
    main_image: string[];
    case_id: string[];
    license: string[];
    file_size: string[];
    split_during_preprocessing: boolean[];
    caption: string[];
    image_type: string[];
    image_subtype: string[];
    radiology_region: string[];
    radiology_region_granular: string[];
    radiology_view: string[];
    ml_labels_for_supervised_classification: [string[]];
    gt_labels_for_semisupervised_classification: [string[]];
    verified: boolean[];
};

type MetadataState = {
    metadata: ImageMetadata[];
    caseIds: string[];
    selectedCase: ImageMetadata[] | null;
    selectedCaseId: string | null;
    suggestions: ImageMetadataSuggestions | null;
};

type MetadataAction = {
    selectCase: (caseId: string) => void;
    clearSelectedCase: () => void;
    setMetadata: (file: File | null) => void;
    updateMetadata: (updatedCaseMetadata: ImageMetadata[] | null) => void;
    updateSelectedCase: (
        file: string,
        key: keyof ImageMetadata,
        value: string,
    ) => void;
    resetSelectedCaseMetadata: () => void;
    clearMetadata: () => void;
    addFileMetadata: (fileMetadata: ImageMetadata) => void;
    removeFileMetadata: (file: string) => void;
};

type MetadataStore = MetadataState & MetadataAction;

const useMetadataStore = create<MetadataStore>()(
    persist(
        (set) => ({
            metadata: [],
            caseIds: [],
            selectedCase: null,
            selectedCaseId: null,
            suggestions: null,
            clearMetadata: () =>
                set({
                    metadata: [],
                    caseIds: [],
                    selectedCase: null,
                    selectedCaseId: null,
                }),
            setMetadata: async (file: File | null) => {
                if (file) {
                    const text = await file.text();
                    Papa.parse<ImageMetadata>(text, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            const caseIds = [
                                ...new Set(
                                    results.data.map((row) => row.case_id),
                                ),
                            ];
                            const metadata = results.data.map((row) => ({
                                ...row,
                                verified: false,
                            }));
                            const suggestions: ImageMetadataSuggestions = {
                                file_id: [],
                                file: [],
                                file_path: [],
                                main_image: [],
                                case_id: [],
                                license: [],
                                file_size: [],
                                split_during_preprocessing: [],
                                caption: [],
                                image_type: [],
                                image_subtype: [],
                                radiology_region: [],
                                radiology_region_granular: [],
                                radiology_view: [],
                                ml_labels_for_supervised_classification: [[]],
                                gt_labels_for_semisupervised_classification: [
                                    [],
                                ],
                                verified: [],
                            };
                            metadata.forEach((m) => {
                                Object.keys(m)
                                    .slice(1)
                                    .forEach((key) => {
                                        if (!m[key]) return;
                                        suggestions[key] = [
                                            ...new Set([
                                                ...suggestions[key],
                                                m[key],
                                            ]),
                                        ];
                                    });
                            });

                            set({
                                metadata,
                                caseIds,
                                suggestions,
                            });
                        },
                    });
                } else {
                    set({
                        metadata: [],
                        caseIds: [],
                        selectedCase: null,
                        selectedCaseId: null,
                        suggestions: null,
                    });
                }
            },
            updateMetadata: (updatedCaseMetadata: ImageMetadata[] | null) => {
                set((state) => {
                    if (!updatedCaseMetadata) return state;
                    const metadata = state.metadata;
                    updatedCaseMetadata.forEach((m) => {
                        const index = metadata.findIndex(
                            (row) => row.file === m.file,
                        );
                        const image_type =
                            {
                                pathology: "histopathological",
                                radiology: "radiological",
                                medical_photograph: "clinical",
                            }[m.image_type] || "other";
                        m.file_path = `full_ameloblastoma_image_dataset/${m.case_id}/${image_type}/${m.file}`;
                        if (index === -1) return;
                        metadata[index] = m;
                    });
                    return {
                        metadata: [...metadata],
                    };
                });
            },
            selectCase: (caseId: string) =>
                set((state) => {
                    const metadata = state.metadata.filter(
                        (m) => m.case_id === caseId,
                    );
                    if (!metadata) return state;
                    return {
                        selectedCase: [...metadata],
                        selectedCaseId: caseId,
                    };
                }),
            clearSelectedCase: () =>
                set({ selectedCase: null, selectedCaseId: null }),
            updateSelectedCase: (
                file: string,
                key: keyof ImageMetadata,
                value: string,
            ) =>
                set((state) => {
                    if (!state.selectedCase) return state;
                    const index = state.selectedCase.findIndex(
                        (f) => f.file === file,
                    );
                    if (index === -1) return state;
                    const metadata = state.selectedCase;
                    metadata[index] = {
                        ...metadata[index],
                        [key]: value,
                    };
                    return {
                        ...state,
                        selectedCase: [...metadata],
                    };
                }),
            resetSelectedCaseMetadata: () =>
                set((state) => {
                    if (!state.selectedCase) return state;
                    const oldMetadata = state.metadata.filter(
                        (m) => m.case_id === state.selectedCaseId,
                    );
                    if (!oldMetadata) return state;
                    return {
                        selectedCase: oldMetadata,
                    };
                }),
            addFileMetadata: (fileMetadata: ImageMetadata) =>
                set((state) => {
                    return {
                        metadata: [
                            ...state.metadata,
                            { ...fileMetadata, "": "" },
                        ],
                    };
                }),
            removeFileMetadata: (file: string) => {
                set((state) => {
                    const metadata = state.metadata.filter(
                        (m) => m.file !== file,
                    );
                    return {
                        metadata: [...metadata],
                    };
                });
            },
        }),
        {
            name: "metadataStore",
        },
    ),
);

export default useMetadataStore;
