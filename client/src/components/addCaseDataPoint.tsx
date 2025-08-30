//@ts-nocheck
import { useState, useEffect, useCallback } from "react";
import useMetadataStore, { ImageMetadata } from "@/store/metadataStore";
import useFileStore, { readFileAsBase64 } from "@/store/fileStore";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddCaseDataPoint() {
  const selectedCaseId = useMetadataStore((state) => state.selectedCaseId);
  const selectedCase = useMetadataStore((state) => state.selectedCase);
  const allFileNames = useMetadataStore((state) => state.metadata).map(
    (f) => f.file,
  );
  const selectCase = useMetadataStore((state) => state.selectCase);
  const addFileMetadata = useMetadataStore((state) => state.addFileMetadata);
  const addFile = useFileStore((state) => state.addFile);
  const suggestions = useMetadataStore((state) => state.suggestions);

  const [open, setOpen] = useState(false);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<ImageMetadata>({
    file_id: "",
    file: "",
    file_path: "",
    main_image: "",
    case_id: "",
    license: "",
    file_size: "",
    split_during_preprocessing: false,
    caption: "",
    image_type: "",
    image_subtype: "",
    radiology_region: "",
    radiology_region_granular: "",
    radiology_view: "",
    ml_labels_for_supervised_classification: [],
    gt_labels_for_semisupervised_classification: [],
    verified: true,
  });

  const updateDialogData = (key: keyof ImageMetadata, value: string) => {
    setDialogData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // Handle image paste
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          setPastedImage(file);
          setDialogData((prevState) => ({
            ...prevState,
            file_size: file.size.toString(),
          }));
        }
      }
    }
  }, []);

  const saveChanges = () => {
    if (
      selectedCaseId &&
      selectedCase &&
      selectedCase.length > 0 &&
      pastedImage
    ) {
      if (allFileNames.includes(dialogData.file))
        return alert("File already exists");
      const metadata = dialogData;
      const image_type =
        {
          pathology: "histopathological",
          radiology: "radiological",
          medical_photograph: "clinical",
        }[metadata.image_type] || "other";
      metadata.file_path = `${metadata.file_path}/${image_type}/${metadata.file}`;
      addFileMetadata(metadata);
      const image = new File([pastedImage], dialogData.file, {
        type: pastedImage.type,
      });
      addFile(image);
      selectCase(selectedCaseId);
      setOpen(false);
    }
  };

  useEffect(() => {
    if (selectedCase && selectedCase.length > 0) {
      const initialData: ImageMetadata = {
        file_id: "",
        file: "",
        file_path: "",
        main_image: "",
        case_id: "",
        license: "",
        file_size: "",
        split_during_preprocessing: false,
        caption: "",
        image_type: "",
        image_subtype: "",
        radiology_region: "",
        radiology_region_granular: "",
        radiology_view: "",
        ml_labels_for_supervised_classification: [],
        gt_labels_for_semisupervised_classification: [],
        verified: true,
      };
      for (const key of Object.keys(selectedCase[0]).slice(1)) {
        if (key === "file") {
          initialData[key] =
            selectedCase[selectedCase.length - 1]["main_image"];
        } else if (key === "file_path") {
          initialData[key] =
            selectedCase[0][key].split("/").slice(0, 2).join("/") || "";
        } else if (key === "case_id") {
          initialData[key] = selectedCaseId || "";
        } else if (key === "split_during_preprocessing") {
          initialData[key] = false;
        } else if (key === "license") {
          initialData[key] = selectedCase[0][key];
        } else if (key === "file_size") {
          continue;
        } else {
          initialData[key as keyof ImageMetadata] = "";
        }
        initialData["verified"] = true;
      }

      setDialogData(initialData);
    }
  }, [selectedCase, selectedCaseId]);

  useEffect(() => {
    if (pastedImage) {
      readFileAsBase64(pastedImage).then((file) => {
        setPreviewImage(file.content);
      });
    }
  }, [pastedImage]);

  useEffect(() => {
    if (open) {
      window.addEventListener("paste", handlePaste);
    } else {
      window.removeEventListener("paste", handlePaste);
    }

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [open, handlePaste]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Add data point to case <strong>{selectedCaseId}</strong>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedCaseId}</DialogTitle>
          <DialogDescription>
            Add a data point to the case. Press <kbd>Ctrl</kbd> + <kbd>V</kbd>{" "}
            to paste an image.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {selectedCase &&
            selectedCase.length > 0 &&
            Object.keys(selectedCase[0])
              .slice(1)
              .map((key, index) => {
                if (
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
                      key={index}
                      className="grid grid-cols-4 items-center gap-4"
                    >
                      <Label
                        htmlFor={key}
                        className="text-right col-span-2 overflow-hidden overflow-ellipsis whitespace-nowrap"
                      >
                        {key}
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          updateDialogData(key as keyof ImageMetadata, value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={`Select a ${key}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {suggestions &&
                              suggestions[key].map(
                                (suggestion: string, index: number) => {
                                  if (!suggestion) return;
                                  return (
                                    <SelectItem key={index} value={suggestion}>
                                      {suggestion}
                                    </SelectItem>
                                  );
                                },
                              )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                return (
                  <div
                    key={index}
                    className="grid grid-cols-4 items-center gap-4"
                  >
                    <Label htmlFor={key} className="text-right">
                      {key}
                    </Label>
                    <Input
                      id={key}
                      readOnly={[
                        "case_id",
                        "license",
                        "verified",
                        "file_path",
                      ].includes(key)}
                      value={dialogData[key as keyof ImageMetadata].toString()}
                      className="col-span-3"
                      onChange={(event) => {
                        updateDialogData(
                          key as keyof ImageMetadata,
                          event.target.value,
                        );
                        if (key === "file") {
                          updateDialogData("main_image", event.target.value);
                        }
                      }}
                    />
                  </div>
                );
              })}

          {pastedImage && (
            <div className="mt-4">
              <Label className="mb-2 block text-sm font-medium text-muted-foreground">
                Pasted Image
              </Label>
              <img
                src={previewImage || undefined}
                alt="Pasted"
                className="max-h-64 rounded-md border border-muted"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" onClick={() => saveChanges()}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
