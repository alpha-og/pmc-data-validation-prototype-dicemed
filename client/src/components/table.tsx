import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import useFileStore from "@/store/fileStore";
import useMetadataStore from "@/store/metadataStore";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import JSZip from "jszip";

export default function TableView() {
    const clearFiles = useFileStore((state) => state.clearFiles);
    const files = useFileStore((state) => state.files);
    const clearMetadata = useMetadataStore((state) => state.clearMetadata);
    const metadata = useMetadataStore((state) => state.metadata);

    const clear = () => {
        clearFiles();
        clearMetadata();
    };

    const getMetadataBlob = () => {
        if (metadata.length === 0) return;
        const csv = Papa.unparse(metadata);
        const blob = new Blob([csv], { type: "text/csv" });
        return blob;
    };

    function base64ToBlob(base64: string, mimeType: string): Blob {
        const byteChars = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteChars.length; offset += 512) {
            const slice = byteChars.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type: mimeType });
    }
    const download = async () => {
        const zip = new JSZip();
        const metadataBlob = getMetadataBlob();
        if (!metadataBlob) return;
        zip.file("metadata.csv", metadataBlob);
        metadata.forEach((item) => {
            const file = files.find((f) => f.name === item.file);
            if (!file) return;
            const file_blob = base64ToBlob(
                file.content.split("base64,")[1],
                file.type,
            );
            zip.file(item.file_path, file_blob);
        });
        const url = URL.createObjectURL(
            await zip.generateAsync({ type: "blob" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "dataset.zip";
        link.click();
    };

    const [keys, setKeys] = useState<string[]>([]);
    useEffect(() => {
        if (metadata.length === 0) return;
        const keys = Object.keys(metadata[0]).slice(1);
        setKeys(keys);
    }, [metadata]);

    return (
        <>
            {metadata.length === 0 ? null : (
                <Card className="w-full h-120 shrink-0 flex flex-col gap-4 scrollbar-hidden">
                    <CardHeader className="flex justify-between">
                        <CardTitle>Dataset</CardTitle>
                        <CardDescription>
                            {metadata.length} entries
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="w-full h-full flex flex-col gap-4 overflow-y-scroll scrollbar-hidden">
                        <Table className="">
                            <TableCaption>Dataset entries</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    {keys.map((key, index) => (
                                        <TableHead key={index}>{key}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="w-full h-full overflow-y-scroll scrollbar-hidden">
                                {metadata.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="max-w-2xl overflow-x-clip">
                                            {index + 1}
                                        </TableCell>
                                        {keys.map((key, entry_index) => (
                                            <TableCell
                                                key={entry_index}
                                                className="max-w-2xl overflow-x-clip"
                                            >
                                                {item[key].toString()}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="flex gap-4 justify-between">
                        <Button onClick={download}>Download</Button>
                        <Button onClick={clear} variant={"destructive"}>
                            Clear
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
