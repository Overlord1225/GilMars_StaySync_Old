import type { InquiryCategory } from "./types";

export interface Keyword {
  category: InquiryCategory;
  keyword: string;
  language: string;
  weight: number;
}

export interface CategorizeResult {
  category: InquiryCategory;
  score: number;
  matchedKeywords: string[];
  source: "auto";
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function categorize(
  message: string,
  keywords: Keyword[],
): CategorizeResult {
  const normalized = normalizeText(message);
  const scores = new Map<InquiryCategory, number>();
  const matched: string[] = [];

  for (const kw of keywords) {
    const normalizedKeyword = normalizeText(kw.keyword);
    if (normalizedKeyword && normalized.includes(normalizedKeyword)) {
      scores.set(kw.category, (scores.get(kw.category) ?? 0) + kw.weight);
      matched.push(kw.keyword);
    }
  }

  if (scores.size === 0) {
    return {
      category: "general_question",
      score: 0,
      matchedKeywords: [],
      source: "auto",
    };
  }

  let maxScore = 0;
  for (const score of scores.values()) {
    if (score > maxScore) maxScore = score;
  }

  const topCategories: InquiryCategory[] = [];
  for (const [category, score] of scores) {
    if (score === maxScore) topCategories.push(category);
  }

  // Tie or no single winner: default to general_question
  if (topCategories.length > 1) {
    return {
      category: "general_question",
      score: maxScore,
      matchedKeywords: [...new Set(matched)],
      source: "auto",
    };
  }

  return {
    category: topCategories[0] ?? "general_question",
    score: maxScore,
    matchedKeywords: [...new Set(matched)],
    source: "auto",
  };
}
