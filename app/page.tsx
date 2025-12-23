"use client";
import { useState, useMemo } from "react";

/* ================= UI CONSTANTS ================= */

const MIN_BOX_WIDTH = 250;
const MIN_BOX_HEIGHT = 250;

// monospace approx
const CHAR_PIXEL = 8; // per character width
const LINE_PIXEL = 22; // per line height

/* ================= HELPERS ================= */

// build lines (no word break)
const buildLines = (words: string[], maxChars: number) => {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;

    if (test.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
};

// build blocks
const buildBlocks = (
  text: string,
  maxCharsPerLine: number,
  linesPerBlock: number
) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = buildLines(words, maxCharsPerLine);

  const blocks: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerBlock) {
    blocks.push(lines.slice(i, i + linesPerBlock).join("\n"));
  }

  return blocks;
};

// copy block
const copyBlock = (block: string) => {
  navigator.clipboard.writeText(block);
};

/* ================= COMPONENT ================= */

export default function Home() {
  const [text, setText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string | null>(null);

  // 🔢 user controls (can go below 35 / 6)
  const [maxChars, setMaxChars] = useState(35);
  const [linesPerBlock, setLinesPerBlock] = useState(6);

  // build blocks
  const blocks = useMemo(() => {
    return buildBlocks(
      editedText ?? text,
      Math.max(1, maxChars),
      Math.max(1, linesPerBlock)
    );
  }, [text, editedText, maxChars, linesPerBlock]);

  // 🔲 dynamic box size (MIN 250×250)
  const boxWidth = Math.max(MIN_BOX_WIDTH, maxChars * CHAR_PIXEL + 40);

  const boxHeight = Math.max(MIN_BOX_HEIGHT, linesPerBlock * LINE_PIXEL + 80);

  /* ===== SAVE EDIT ===== */
  const handleSaveEdit = (index: number, value: string) => {
    const allBlocks = [...blocks];
    allBlocks[index] = value;

    const mergedText = allBlocks.join(" ");
    setEditedText(mergedText);
    setEditingIndex(null);
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      {/* CONTROLS */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="text-sm block mb-1">Characters per line</label>
          <input
            type="number"
            value={maxChars}
            onChange={(e) => setMaxChars(Number(e.target.value))}
            className="border px-2 py-1 w-28"
          />
        </div>

        <div>
          <label className="text-sm block mb-1">Lines per block</label>
          <input
            type="number"
            value={linesPerBlock}
            onChange={(e) => setLinesPerBlock(Number(e.target.value))}
            className="border px-2 py-1 w-28"
          />
        </div>
      </div>

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
            style={{
              width: boxWidth,
              height: boxHeight,
            }}
          >
            {/* HEADER */}
            <div className="px-3 py-2 border-b text-sm font-semibold shrink-0">
              Block {index + 1}
            </div>

            {/* TEXT AREA (flexible but scroll-safe) */}
            <div
              className="p-3 font-mono text-sm whitespace-pre-wrap leading-relaxed text-justify overflow-auto"
              style={{
                flex: 1,
                textJustify: "inter-word",
                textAlignLast: "left",
                wordSpacing: "0.02em",
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
                    hyphens: "none",
                  }}
                  defaultValue={block}
                  onBlur={(e) => handleSaveEdit(index, e.target.value)}
                />
              ) : (
                block
              )}
            </div>

            {/* FOOTER (ALWAYS FIXED) */}
            <div className="flex justify-between items-center px-3 py-2 border-t shrink-0">
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
