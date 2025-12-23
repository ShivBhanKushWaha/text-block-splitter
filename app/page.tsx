"use client";
import { useState, useMemo, useRef, useEffect } from "react";

/* ================= HELPERS ================= */
const strictNormalize = (
  words: string[],
  measure: HTMLDivElement,
  linesPerBlock: number
) => {
  let result = normalizeBlocks(words, measure, linesPerBlock);

  // 🔁 second pass for edge overflow cases
  const finalWords = result.join(" ").split(/\s+/);

  return normalizeBlocks(finalWords, measure, linesPerBlock);
};

// CORE block normalizer (unchanged logic)
const normalizeBlocks = (
  words: string[],
  measure: HTMLDivElement,
  linesPerBlock = 10
) => {
  const blocks: string[] = [];

  // height of exactly 10 visual lines
  measure.innerText = "X\n".repeat(linesPerBlock);
  const maxHeight = measure.scrollHeight;

  let currentText = "";
  let currentWords: string[] = [];

  for (const word of words) {
    const candidate = currentText ? currentText + " " + word : word;

    // STRICT global check
    measure.innerText = candidate + " X";

    if (measure.scrollHeight > maxHeight) {
      // ❌ current block FULL — lock it
      blocks.push(currentWords.join(" "));
      // 👉 start NEW block
      currentText = word;
      currentWords = [word];
    } else {
      // ✅ safe to add
      currentText = candidate;
      currentWords.push(word);
    }
  }

  // last block
  if (currentWords.length > 0) {
    blocks.push(currentWords.join(" "));
  }

  return blocks;
};
const buildLines = (
  words: string[],
  maxCharsPerLine = 32
) => {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;

    if (test.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
};
const buildBlocks = (text: string) => {
  const words = text.split(/\s+/);
  const lines = buildLines(words);

  const blocks: string[] = [];
  for (let i = 0; i < lines.length; i += 10) {
    blocks.push(lines.slice(i, i + 10).join("\n"));
  }
  return blocks;
};

// Copy EXACTLY as visible (10 lines)
const copyBlockExactlyAsShown = (
  blockText: string,
  measure: HTMLDivElement
) => {
  const words = blockText.split(/\s+/);
  const lines: string[] = [];

  // 👉 measure को EXACT block content area जैसा बनाओ
  measure.style.width = "360px";
  measure.style.padding = "12px";
  measure.style.lineHeight = "1.5em";

  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine
      ? currentLine + " " + word
      : word;

    measure.innerText = testLine;

    // ❌ line wrap हो गई
    if (measure.scrollHeight > measure.clientHeight && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // 🔒 EXACT visual copy (जैसा दिख रहा है)
  navigator.clipboard.writeText(lines.join("\n"));
};

const copyBlock = (block: string) => {
  navigator.clipboard.writeText(block);
};


export default function Home() {
  const measureRef = useRef<HTMLDivElement | null>(null);

  const [text, setText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedBlocks, setEditedBlocks] = useState<string[]>([]);
  const [pendingEdit, setPendingEdit] = useState<{
    index: number;
    value: string;
  } | null>(null);

  const LINES_PER_BLOCK = 10;
const copyBlocks = useMemo(() => buildBlocks(text), [text]);

  /* ===== BLOCKS ===== */
  const blocks = useMemo(() => {
    if (!measureRef.current) return [];

    const baseText = editedBlocks.length > 0 ? editedBlocks.join(" ") : text;

    const words = baseText.split(/\s+/);
    if (!measureRef.current) return [];

    const measure = measureRef.current;

    return strictNormalize(words, measure, LINES_PER_BLOCK);
  }, [text, editedBlocks]);

  /* ===== DEBOUNCED EDIT ===== */
  useEffect(() => {
    if (!pendingEdit || !measureRef.current) return;

    const timer = setTimeout(() => {
      const { index, value } = pendingEdit;

      const fullText = blocks.join(" ");
      const allWords = fullText.split(/\s+/);

      const currentBlockWords = blocks[index].split(/\s+/);
      const editedWords = value.split(/\s+/);

      let startWordIndex = 0;
      for (let i = 0; i < index; i++) {
        startWordIndex += blocks[i].split(/\s+/).length;
      }

      allWords.splice(startWordIndex, currentBlockWords.length, ...editedWords);

      if (!pendingEdit || !measureRef.current) return;

      const measure = measureRef.current;

      const newBlocks = strictNormalize(allWords, measure, LINES_PER_BLOCK);

      setEditedBlocks(newBlocks);
      setPendingEdit(null);
    }, 250); // debounce

    return () => clearTimeout(timer);
  }, [pendingEdit, blocks]);

  /* ===== HANDLERS ===== */
  const handleEditChange = (index: number, value: string) => {
    setPendingEdit({ index, value });
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      {/* INPUT */}
      <textarea
        className="
          w-full h-80 resize-none
          border rounded-md p-3 mb-6
          font-mono text-sm
        "
        placeholder="पूरा content यहाँ paste करो..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setEditedBlocks([]);
          setEditingIndex(null);
        }}
      />

      {/* BLOCKS */}
      <div className="flex flex-wrap gap-4 justify-center">
        {blocks.map((block, index) => (
          <div
            key={index}
            className="bg-white border shadow flex flex-col"
            style={{ width: "360px", height: "330px" }}
          >
            <div className="px-3 py-2 border-b text-sm font-semibold">
              Block {index + 1}
            </div>

            <div
              className="p-3"
              style={{
                height: "calc(330px - 40px - 40px)",
                overflow: "hidden",
              }}
            >
              {editingIndex === index ? (
                <textarea
                  className="
                    w-full h-full resize-none
                    font-mono text-sm
                    whitespace-pre-wrap
                    overflow-wrap-anywhere
                    break-words
                    bg-transparent
                    outline-none
                    border-none
                    p-0
                    leading-relaxed
                  "
                  value={block}
                  onChange={(e) => handleEditChange(index, e.target.value)}
                />
              ) : (
                <p
                  className="
                    h-full
                    font-mono text-sm
                    whitespace-pre-wrap
                    overflow-wrap-anywhere
                    break-words
                    text-justify
                    leading-relaxed
                  "
                >
                  {block}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center px-3 py-2 border-t">
              <button
                onClick={() => copyBlock(block)}

                className="text-xs px-3 py-1 rounded bg-blue-600 text-white"
              >
                Copy
              </button>

              <button
                onClick={() =>
                  setEditingIndex(editingIndex === index ? null : index)
                }
                className="text-xs px-3 py-1 rounded bg-gray-200"
              >
                {editingIndex === index ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* HIDDEN MEASURER (ONE ONLY) */}
      <div
        ref={measureRef}
        className="
          invisible absolute top-0 left-0
          font-mono text-sm
          whitespace-pre-wrap
          overflow-wrap-anywhere
          break-words
          leading-relaxed
        "
        style={{
          width: "360px",
          padding: "12px",
          boxSizing: "border-box",
        }}
      />
    </main>
  );
}
