import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import useMetadataStore from "@/store/metadataStore";

const proxy = "http://34.47.171.137:8080/proxy"; // Adjust if needed

export default function Article() {
  const selectedCaseId = useMetadataStore((state) => state.selectedCaseId);
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    if (!selectedCaseId) return;

    const url = `https://pmc.ncbi.nlm.nih.gov/articles/${selectedCaseId.slice(0, -3)}/`;
    fetch(`${proxy}?url=${encodeURIComponent(url)}`)
      .then((res) => res.text())
      .then((html) => setHtmlContent(html))
      .catch((err) => console.error("Failed to load HTML", err));
  }, [selectedCaseId]);

  return (
    <>
      {selectedCaseId && htmlContent.length > 0 && (
        <Card className="w-full h-full flex-col gap-4 scrollbar-hidden">
          <CardContent className="w-full h-full p-0">
            <iframe
              sandbox=""
              srcDoc={htmlContent}
              title="PMC Article Viewer"
              className="w-full h-full border-none"
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
