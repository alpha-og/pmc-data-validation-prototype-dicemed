import useFileStore from "@/store/fileStore";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import useMetadataStore, { ImageMetadata } from "@/store/metadataStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@components/ui/switch";
import { useHotkeys } from "react-hotkeys-hook";

export const ImageCard = ({
    file,
    handlePrevious,
    handleNext,
}: {
    file: string;
    handlePrevious: () => void;
    handleNext: () => void;
}) => {
    const files = useFileStore((state) => state.files);
    const suggestions = useMetadataStore((state) => state.suggestions);
    const removeFile = useFileStore((state) => state.removeFile);
    const selectedCaseId = useMetadataStore((state) => state.selectedCaseId);
    const selectCase = useMetadataStore((state) => state.selectCase);
    const metadata = useMetadataStore((state) => state.selectedCase)?.find(
        (f) => f.file === file,
    );
    const removeFileMetadata = useMetadataStore(
        (state) => state.removeFileMetadata,
    );
    const updateSelectedCase = useMetadataStore(
        (state) => state.updateSelectedCase,
    );
    const [image, setImage] = useState<string | null>(null);

    const deleteFile = () => {
        if (!metadata || !selectedCaseId) return;
        handlePrevious();
        removeFile(file);
        removeFileMetadata(file);
        selectCase(selectedCaseId);
    };

    useHotkeys("v", () => {
        if (!metadata || !selectedCaseId) return;
        updateSelectedCase(metadata.file, "verified", !metadata.verified);
    });

    useHotkeys("s", () => {
        if (!metadata || !selectedCaseId) return;
        const split_during_preprocessing = ["true", "True"].includes(
            metadata["split_during_preprocessing"].toString(),
        );
        updateSelectedCase(
            metadata.file,
            "split_during_preprocessing",
            (!split_during_preprocessing).toString(),
        );
    });

    useEffect(() => {
        const imageObj = files.find((f) => f.name === file);
        if (imageObj) {
            setImage(imageObj.content);
        }
    }, [files, file]);

    return (
        <>
            {metadata && image && (
                <Card className="w-full h-5/6 shadow-md mx-auto overflow-y-hidden">
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-lg truncate">
                            {metadata.caption || "Untitled Image"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="w-full flex flex-col gap-4 overflow-y-scroll">
                        <img
                            src={image}
                            alt={metadata.caption}
                            className="rounded-lg max-w-96 max-h-96 aspect-square object-contain border"
                        />

                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(metadata)
                                .slice(1)
                                .map(([key, value]) => {
                                    if (key === "split_during_preprocessing") {
                                        return null;
                                    } else if (
                                        [
                                            "image_type",
                                            "image_subtype",
                                            "radiology_region",
                                            "radiology_view",
                                            "radiology_region_granular",
                                            "ml_labels_for_supervised_classification",
                                            "gt_labels_for_semisupervised_classification",
                                            "split_during_preprocessing",
                                        ].includes(key)
                                    )
                                        return (
                                            <div
                                                key={key}
                                                className="grid grid-rows-2 items-center "
                                            >
                                                <Label
                                                    htmlFor={key}
                                                    className="text-right row-span-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
                                                >
                                                    {key}
                                                </Label>
                                                <Select
                                                    onValueChange={(value) => {
                                                        if (
                                                            key === "image_type"
                                                        ) {
                                                            const image_type =
                                                                {
                                                                    pathology:
                                                                        "histopathological",
                                                                    radiology:
                                                                        "radiological",
                                                                    medical_photograph:
                                                                        "clinical",
                                                                }[value] ||
                                                                "other";

                                                            updateSelectedCase(
                                                                metadata.file,
                                                                "file_path",
                                                                `full_ameloblastoma_image_dataset/${metadata.case_id}/${image_type}/${metadata.file}`,
                                                            );
                                                        }

                                                        updateSelectedCase(
                                                            metadata.file,
                                                            key as keyof ImageMetadata,
                                                            value,
                                                        );
                                                    }}
                                                    value={value as string}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue
                                                            placeholder={`Select a ${key}`}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {suggestions &&
                                                                suggestions[
                                                                    key
                                                                ].map(
                                                                    (
                                                                        suggestion: string,
                                                                        index: number,
                                                                    ) => {
                                                                        if (
                                                                            !suggestion
                                                                        )
                                                                            return;
                                                                        return (
                                                                            <SelectItem
                                                                                key={
                                                                                    index
                                                                                }
                                                                                value={
                                                                                    suggestion
                                                                                }
                                                                            >
                                                                                {
                                                                                    suggestion
                                                                                }
                                                                            </SelectItem>
                                                                        );
                                                                    },
                                                                )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant={"destructive"}
                                                    className="w-1 h-1"
                                                    onClick={() =>
                                                        updateSelectedCase(
                                                            metadata.file,
                                                            key as keyof ImageMetadata,
                                                            "",
                                                        )
                                                    }
                                                >
                                                    X
                                                </Button>
                                            </div>
                                        );

                                    return (
                                        <div
                                            key={key}
                                            className="grid w-full h-min max-w-sm items-center gap-2"
                                        >
                                            <Label htmlFor={key}>{key}</Label>
                                            <Textarea
                                                readOnly={[
                                                    "file",
                                                    "verified",
                                                    "file_id",
                                                    "file_path",
                                                    "case_id",
                                                ].includes(
                                                    key as keyof ImageMetadata,
                                                )}
                                                value={value as string}
                                                onChange={(e) => {
                                                    if (key === "file") {
                                                        return updateSelectedCase(
                                                            metadata.file,
                                                            key as keyof ImageMetadata,
                                                            `full_ameloblastoma_image_dataset/${metadata.case_id}/${metadata.image_type}/${e.target.value}`,
                                                        );
                                                    }

                                                    updateSelectedCase(
                                                        metadata.file,
                                                        key as keyof ImageMetadata,
                                                        e.target.value,
                                                    );
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                    <CardFooter className="w-full flex justify-between gap-2">
                        <Button variant="destructive" onClick={deleteFile}>
                            Delete
                        </Button>
                        <div className="flex gap-2 items-center">
                            <div
                                key={"split_during_preprocessing"}
                                className="flex items-center gap-2"
                            >
                                <Label htmlFor="split" className="text-right">
                                    {"split_during_preprocessing"}
                                </Label>
                                <Switch
                                    id="split"
                                    checked={["True", "true"].includes(
                                        metadata[
                                            "split_during_preprocessing"
                                        ].toString(),
                                    )}
                                    onCheckedChange={(value) =>
                                        updateSelectedCase(
                                            metadata.file,
                                            "split_during_preprocessing" as keyof ImageMetadata,
                                            value.toString(),
                                        )
                                    }
                                />
                            </div>
                            <div className="flex gap-2">
                                <Label htmlFor="verified">Verified</Label>
                                <Checkbox
                                    id="verified"
                                    checked={metadata.verified}
                                    onCheckedChange={(e) =>
                                        updateSelectedCase(
                                            metadata.file,
                                            "verified",
                                            e as string,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </>
    );
};

export default function CaseDataPoints() {
    const selectedCase = useMetadataStore((state) => state.selectedCase);
    const selectedCaseId = useMetadataStore((state) => state.selectedCaseId);
    const resetSelectedCaseMetadata = useMetadataStore(
        (state) => state.resetSelectedCaseMetadata,
    );
    const updateMetadata = useMetadataStore((state) => state.updateMetadata);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (selectedCase && currentIndex < selectedCase.length - 1) {
            setCurrentIndex((currentIndex + 1) % selectedCase.length);
        }
    };

    const handlePrevious = () => {
        if (selectedCase && currentIndex > 0) {
            setCurrentIndex((currentIndex - 1) % selectedCase.length);
        }
    };

    useHotkeys("ctrl+s", () => updateMetadata(selectedCase));
    useHotkeys(["ctrl+n", "ArrowRight"], () => handleNext());
    useHotkeys(["ctrl+p", "ArrowLeft"], () => handlePrevious());

    useEffect(() => {
        setCurrentIndex(0);
    }, [selectedCaseId]);

    return (
        <>
            {selectedCase &&
                selectedCase.length > 0 &&
                selectedCase[currentIndex] && (
                    <div className="w-full h-full flex flex-col items-center gap-4">
                        <ImageCard
                            file={selectedCase[currentIndex].file}
                            handlePrevious={handlePrevious}
                            handleNext={handleNext}
                        />
                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                variant="secondary"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={
                                    currentIndex === selectedCase.length - 1
                                }
                                variant="secondary"
                            >
                                Next
                            </Button>
                            <p>
                                {currentIndex + 1}/{selectedCase.length}
                            </p>
                        </div>
                        <CardFooter className="w-full max-w-2xl flex justify-end gap-2">
                            <Button
                                variant={"destructive"}
                                onClick={resetSelectedCaseMetadata}
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={() => updateMetadata(selectedCase)}
                            >
                                Save
                            </Button>
                        </CardFooter>
                    </div>
                )}
        </>
    );
}
