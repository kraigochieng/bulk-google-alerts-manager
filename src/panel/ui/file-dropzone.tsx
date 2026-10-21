import { useRef, useState } from "react";
import type { DragEvent, JSX, KeyboardEvent } from "react";
import { FileUp } from "lucide-react";
import clsx from "clsx";

import { isCsvFile } from "src/core/file-type";

/** Render a box that takes a CSV file by click, keyboard, or drop. It names the chosen file and refuses other file types. */
export function FileDropzone({
  onFile,
  chosenFileName,
  label,
  id,
}: {
  onFile: (file: File) => void;
  chosenFileName: string;
  label: string;
  id?: string;
}): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [refusal, setRefusal] = useState<string>("");

  const accept = (file: File | undefined): void => {
    if (file === undefined) return;
    if (!isCsvFile({ name: file.name, type: file.type })) {
      setRefusal(`${file.name} is not a CSV file. Choose a file that ends in .csv.`);
      return;
    }
    setRefusal("");
    onFile(file);
  };
  const openChooser = (): void => {
    inputRef.current?.click();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openChooser();
    }
  };
  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  };

  return (
    <div className="w-full">
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={openChooser}
        onKeyDown={onKeyDown}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={onDrop}
        className={clsx(
          "flex w-full cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary",
        )}
      >
        <FileUp className="size-6 text-primary" aria-hidden="true" />
        <span className="font-medium text-foreground">
          {dragging ? "Drop the file to load it" : "Drop a CSV file here, or click to choose one"}
        </span>
        <span className="text-muted-foreground">{chosenFileName === "" ? "No file chosen" : chosenFileName}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {refusal !== "" && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {refusal}
        </p>
      )}
    </div>
  );
}
