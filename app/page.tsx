"use client";
import { useState, useMemo } from "react";

/* ================= CONFIG ================= */
const MAX_CHARS_PER_LINE = 30;
const LINES_PER_BLOCK = 8;

/* ================= HELPERS ================= */

// 🔹 build lines (≤30 chars, no word break)
const buildLines = (words: string[]) => {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;

    // 🚫 word break not allowed
    if (test.length > MAX_CHARS_PER_LINE && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
};

// 🔹 build blocks (8 lines per block)
const buildBlocks = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = buildLines(words);

  const blocks: string[] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_BLOCK) {
    blocks.push(lines.slice(i, i + LINES_PER_BLOCK).join("\n"));
  }

  return blocks;
};

// 🔹 copy exact block
const copyBlock = (block: string) => {
  navigator.clipboard.writeText(block);
};

/* ================= COMPONENT ================= */

export default function Home() {
  const [text, setText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string | null>(null);

  // 🔁 always rebuild from source text
  const blocks = useMemo(() => {
    return buildBlocks(editedText ?? text);
  }, [text, editedText]);

  /* ===== EDIT SAVE ===== */
  const handleSaveEdit = (index: number, value: string) => {
    const allBlocks = [...blocks];
    allBlocks[index] = value;

    // 🔁 merge all blocks → rebuild properly
    const mergedText = allBlocks.join(" ");
    setEditedText(mergedText);
    setEditingIndex(null);
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
        value={editedText ?? text}
        onChange={(e) => {
          setText(e.target.value);
          setEditedText(null);
          setEditingIndex(null);
        }}
      />

      {/* BLOCKS */}
      <div className="flex flex-wrap gap-4 justify-center">
        {blocks.map((block, index) => (
          <div
            key={index}
            className="bg-white border shadow flex flex-col"
            style={{ width: "250px", height: "280px" }}
          >
            <div className="px-3 py-2 border-b text-sm font-semibold">
              Block {index + 1}
            </div>

            {/* TEXT AREA */}
            <div
              className="p-3 font-mono text-sm whitespace-pre-wrap leading-relaxed text-justify"
              style={{
                flex: 1,
                textJustify: "inter-word",
                textAlignLast: "left",
                wordSpacing: "0.02em",
                letterSpacing: "0em",
                hyphens: "none",
              }}
            >
              {editingIndex === index ? (
                <textarea
                  className="
              w-full h-full resize-none
              outline-none border-none
              bg-transparent font-mono
              whitespace-pre-wrap
              text-justify
              leading-relaxed
            "
                  style={{
                    textJustify: "inter-word",
                    textAlignLast: "left",
                    wordSpacing: "0.02em",
                    letterSpacing: "0em",
                    hyphens: "none",
                  }}
                  defaultValue={block}
                  onBlur={(e) => handleSaveEdit(index, e.target.value)}
                />
              ) : (
                block
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
    </main>
  );
}
