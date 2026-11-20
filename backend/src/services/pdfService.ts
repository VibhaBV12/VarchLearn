import fs from 'fs';
import pdfParse from 'pdf-parse';
import { AppError } from '../middleware/errorHandler';

export interface ParsedChapter {
  number: number;
  title: string;
  topics: {
    title: string;
    subtopics: string[];
    extractedConcepts: string[];
    extractedDiagrams: string[];
  }[];
}

function isTocOrIndexLine(line: string): boolean {
  const trimmed = line.trim();
  // Dotted leaders or trailing page numbers (e.g. "1.2 Photosynthesis ........ 18" or "Roots, 14, 22")
  if (/\.{3,}\s*\d*\s*$/.test(trimmed)) return true;
  if (/\s+\d{1,4}\s*$/.test(trimmed) && /^(chapter|unit|lesson|\d+\.\d+)/i.test(trimmed)) return true;
  if (/^(table of contents|contents|index|references|bibliography|glossary)\s*$/i.test(trimmed)) return true;
  return false;
}

function isTopicHeading(line: string, chapterTitle: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || isTocOrIndexLine(trimmed)) return null;
  if (trimmed.toLowerCase().includes(chapterTitle.toLowerCase())) return null;

  // 1. Numbered or labeled headings: "1.1 Roots", "2.3.1 Leaf", "Topic: ...", "Section 2: ..."
  const numbered = trimmed.match(
    /^(?:\d+\.\d+(?:\.\d+)?\s+|topic\s*\d*[:.\-]\s*|section\s*\d*[:.\-]\s*)([A-Za-z][^\n]{2,70})$/i
  );
  if (numbered) {
    return numbered[1].replace(/\.+$/, '').trim();
  }

  // 2. Ordinary unnumbered textbook headings: 4..65 chars, no ending sentence punctuation (.!?),
  //    starts with capital letter, 1..8 words, and not a diagram caption or page marker
  if (
    trimmed.length >= 4 &&
    trimmed.length <= 65 &&
    /^[A-Z]/.test(trimmed) &&
    !/[.!?,;:]$/.test(trimmed) &&
    !/^(diagram|fig\.?|figure|page|table)\b/i.test(trimmed) &&
    trimmed.split(/\s+/).length <= 8
  ) {
    return trimmed;
  }

  return null;
}

function extractRealTopicsFromChapterText(
  chapterBody: string,
  chapterTitle: string
): ParsedChapter['topics'] {
  const lines = chapterBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !isTocOrIndexLine(l));

  const detectedTopics: ParsedChapter['topics'] = [];
  const seenTopics = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const heading = isTopicHeading(lines[i], chapterTitle);
    if (!heading) continue;

    // Confirm at least 1 prose line follows this heading before the next heading
    const followingProse: string[] = [];
    for (let j = i + 1; j < Math.min(lines.length, i + 7); j++) {
      if (isTopicHeading(lines[j], chapterTitle)) break;
      if (lines[j].length >= 15) {
        followingProse.push(lines[j]);
      }
    }
    if (followingProse.length === 0) continue;

    const key = heading.toLowerCase();
    if (seenTopics.has(key)) continue;
    seenTopics.add(key);

    detectedTopics.push({
      title: heading,
      subtopics: followingProse.slice(0, 3).map((s) => s.slice(0, 80)),
      extractedConcepts: followingProse.slice(0, 4).map((s) => s.slice(0, 80)),
      extractedDiagrams: lines
        .filter((l) => /^(diagram|fig\.?|figure)\s+\d+/i.test(l))
        .slice(0, 3),
    });
  }

  // Do NOT fabricate arbitrary fallback topics from random lines
  return detectedTopics.slice(0, 10);
}

export async function extractTextbookContent(filePath: string, subject: string): Promise<{
  pageCount: number;
  rawText: string;
  chapters: ParsedChapter[];
}> {
  const dataBuffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(dataBuffer);
  const rawText = (parsed.text || '').replace(/\u0000/g, '').trim();
  const pageCount = parsed.numpages || 1;

  if (rawText.length < 60) {
    throw new AppError(
      'Could not extract sufficient readable text from this PDF (it may be a scanned image PDF or empty). Please upload a text-based PDF.',
      400
    );
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const chapterMatches = lines.filter(
    (l) => /^(chapter|unit|lesson)\s+\d+/i.test(l) && !isTocOrIndexLine(l)
  );

  const uniqueChapterTitles: string[] = [];
  const seenLower = new Set<string>();
  for (const chLine of chapterMatches) {
    const cleanTitle = chLine.replace(/^(chapter|unit|lesson)\s+\d+[:.\-\s]*/i, '').trim() || chLine;
    const key = cleanTitle.toLowerCase();
    if (!seenLower.has(key)) {
      seenLower.add(key);
      uniqueChapterTitles.push(cleanTitle);
    }
  }

  if (uniqueChapterTitles.length > 0) {
    const chapters: ParsedChapter[] = uniqueChapterTitles.slice(0, 12).map((cleanTitle, idx) => {
      let chapterBody = '';
      try {
        chapterBody = sliceChapterBody(rawText, cleanTitle, 8000);
      } catch {
        chapterBody = '';
      }

      return {
        number: idx + 1,
        title: cleanTitle,
        topics: chapterBody ? extractRealTopicsFromChapterText(chapterBody, cleanTitle) : [],
      };
    });

    return { pageCount, rawText, chapters };
  }

  const fallbackTitle = lines[0]?.slice(0, 60) || `${subject} Textbook Content`;
  return {
    pageCount,
    rawText,
    chapters: [
      {
        number: 1,
        title: fallbackTitle,
        topics: extractRealTopicsFromChapterText(rawText.slice(0, 8000), fallbackTitle),
      },
    ],
  };
}

function findBodyMatchIndex(text: string, needle: string): number {
  const cleanNeedle = needle.trim();
  if (cleanNeedle.length < 3) return -1;

  const lowerText = text.toLowerCase();
  const lowerNeedle = cleanNeedle.toLowerCase();
  const candidates: number[] = [];
  let pos = lowerText.indexOf(lowerNeedle);
  while (pos !== -1) {
    candidates.push(pos);
    pos = lowerText.indexOf(lowerNeedle, pos + lowerNeedle.length);
  }

  for (const idx of candidates) {
    const lineStart = text.lastIndexOf('\n', idx) + 1;
    const lineEnd = text.indexOf('\n', idx);
    const fullLine = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim();
    if (isTocOrIndexLine(fullLine)) continue;

    // Skip if inside Index or References section near the end of book
    const precedingWindow = text.slice(Math.max(0, idx - 400), idx);
    if (/\n\s*(?:index|references|bibliography)\s*\n/i.test(precedingWindow)) continue;

    const after = text.slice(idx + cleanNeedle.length, idx + cleanNeedle.length + 220);
    const nextHeadingSoon = /\n\s*(?:chapter|unit|lesson)\s+\d+[:.\-\s]/i.test(after);
    if (nextHeadingSoon && after.trim().length < 100) continue;

    return idx;
  }

  return -1;
}

function sliceChapterBody(rawText: string, chapterTitle: string, maxChars = 12000): string {
  const cleanRaw = rawText.trim();
  const cleanChapter = chapterTitle.replace(/^(chapter|unit|lesson)\s+\d+[:.\-\s]*/i, '').trim();

  const startIdx = findBodyMatchIndex(cleanRaw, cleanChapter);
  if (startIdx === -1) {
    throw new AppError(
      `Could not reliably identify chapter "${cleanChapter}" in the uploaded PDF body (skipping Table of Contents/Index). Please verify your chapter selection.`,
      400
    );
  }

  const afterHeading = cleanRaw.slice(startIdx + Math.max(cleanChapter.length, 15));
  const nextChapterMatch = afterHeading.match(
    /\n\s*(?:(?:chapter|unit|lesson)\s+\d+[:.\-\s]|index\s*$|references\s*$|bibliography\s*$)/im
  );
  const sliceLen = nextChapterMatch?.index
    ? Math.min(maxChars, Math.max(cleanChapter.length, 15) + nextChapterMatch.index)
    : maxChars;

  return cleanRaw.slice(startIdx, startIdx + sliceLen).trim();
}

/**
 * Identifies BOTH the selected chapter AND the selected topic inside that chapter,
 * returning the topic's actual textbook content along with chapter context.
 */
export function extractRelevantChapterContext(
  rawText: string,
  chapterTitle: string,
  topicTitle: string,
  maxChars = 6000
): string {
  const cleanChapter = chapterTitle.replace(/^(chapter|unit|lesson)\s+\d+[:.\-\s]*/i, '').trim();
  const chapterBody = sliceChapterBody(rawText, cleanChapter, 14000);

  const cleanTopic = topicTitle.trim();
  if (!cleanTopic) {
    throw new AppError('Please select a valid topic before generating activities.', 400);
  }

  // Locate the selected topic inside the verified chapter body
  const topicIdx = findBodyMatchIndex(chapterBody, cleanTopic);
  if (topicIdx === -1) {
    throw new AppError(
      `Could not reliably locate topic "${cleanTopic}" inside chapter "${cleanChapter}". Please choose another extracted topic.`,
      400
    );
  }

  // Narrow slice from the selected topic heading up to the next topic heading in this chapter
  const linesAfterTopic = chapterBody.slice(topicIdx).split(/\r?\n/);
  const collected: string[] = [linesAfterTopic[0]];
  let charTotal = linesAfterTopic[0].length;

  for (let i = 1; i < linesAfterTopic.length; i++) {
    const line = linesAfterTopic[i];
    if (i > 1 && isTopicHeading(line, cleanChapter)) {
      break; // Stop at the next topic heading
    }
    if (charTotal + line.length + 1 > maxChars) break;
    collected.push(line);
    charTotal += line.length + 1;
  }

  const topicContent = collected.join('\n').trim();
  if (topicContent.length < 40) {
    throw new AppError(
      `Extracted content for topic "${cleanTopic}" is too short (${topicContent.length} chars). Please choose another topic.`,
      400
    );
  }

  return `Chapter: ${cleanChapter}\nTopic: ${cleanTopic}\n\n${topicContent}`;
}
