import FilePicker from "@components/filePicker";
import TableView from "@components/table";
import Article from "@components/article";
import SelectCase from "@components/selectCase";
import CaseDataPoints from "@components/caseDataPoints";
import AddCaseDataPoint from "@components/addCaseDataPoint";
function App() {
    return (
        <div className="p-4 flex flex-col items-center justify-center gap-4 overflow-y-scroll">
            <FilePicker />
            <SelectCase />
            <AddCaseDataPoint />
            <div className="w-full h-screen flex gap-4">
                <CaseDataPoints />
                <Article />
            </div>
            <TableView />
        </div>
    );
}

export default App;
