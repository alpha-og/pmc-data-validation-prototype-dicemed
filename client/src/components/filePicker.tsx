import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import useFileStore from "@/store/fileStore";
import useMetadataStore from "@/store/metadataStore";

export default function FilePicker() {
    const setFiles = useFileStore((state) => state.setFiles);
    const setMetadata = useMetadataStore((state) => state.setMetadata);
    const metadata = useMetadataStore((state) => state.metadata);
    const uploadFiles = (files: FileList | null) => {
        if (!files) return;
        setFiles(files);
        setMetadata(Array.from(files).filter((f) => f.type === "text/csv")[0]);
    };
    return (
        <>
            {metadata.length > 0 ? null : (
                <Card className={"w-2/3 mx-auto"}>
                    <CardHeader>
                        <CardTitle>Upload Files</CardTitle>
                        <CardDescription>
                            Upload files for validation
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Input
                            type="file"
                            multiple
                            onChange={(e) => uploadFiles(e.target.files)}
                            mozdirectory=""
                            webkitdirectory=""
                            directory=""
                        />
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
