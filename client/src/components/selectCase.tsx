import useFileStore from "@/store/fileStore";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useShallow } from "zustand/shallow";
import { Button } from "@components/ui/button";
import useMetadataStore from "@/store/metadataStore";

export default function SelectCase() {
    const [caseIds, selectCase, selectedCaseId] = useMetadataStore(
        useShallow((state) => [
            state.caseIds,
            state.selectCase,
            state.selectedCaseId,
        ]),
    );
    const goToNextCase = () => {
        const index = caseIds.findIndex((id) => id === selectedCaseId);
        selectCase(caseIds[(index + 1) % caseIds.length]);
    };
    const goToPrevCase = () => {
        const index = caseIds.findIndex((id) => id === selectedCaseId);
        selectCase(caseIds[(index - 1 + caseIds.length) % caseIds.length]);
    };
    return (
        <>
            {caseIds && caseIds.length > 0 && (
                <div className="w-full flex justify-between gap-2">
                    <Select
                        onValueChange={selectCase}
                        value={selectedCaseId || ""}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a case" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Cases</SelectLabel>
                                {caseIds.map((id) => (
                                    <SelectItem key={id} value={id}>
                                        {id}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <p>
                        {caseIds.findIndex((c) => c === selectedCaseId) + 1}/
                        {caseIds.length}
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={goToPrevCase}>Prev</Button>
                        <Button onClick={goToNextCase}>Next</Button>
                    </div>
                </div>
            )}
        </>
    );
}
