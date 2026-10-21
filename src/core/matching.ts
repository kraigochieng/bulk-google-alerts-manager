import { normaliseQuery } from "src/core/query-normaliser";
import type { LiveAlert } from "src/shared/models";

export type Similarity = "exact" | "same_words" | "similar";

/** Smallest word overlap (Jaccard) that counts as similar. Tune with the fixture. */
export const SIMILARITY_THRESHOLD: number = 0.75;

const OPERATOR_WORDS: ReadonlySet<string> = new Set(["or", "and"]);

function wordsOf({ query }: { query: string }): Set<string> {
  const words: string[] = normaliseQuery({ query })
    .replace(/["()]/g, " ")
    .split(" ")
    .filter((word: string) => word !== "" && !OPERATOR_WORDS.has(word));
  return new Set(words);
}

function overlap({ first, second }: { first: Set<string>; second: Set<string> }): number {
  const shared: number = [...first].filter((word: string) => second.has(word)).length;
  const combined: number = new Set([...first, ...second]).size;
  return combined === 0 ? 0 : shared / combined;
}

/** Compare two queries. Return null when they are not alike. */
export function compareQueries({
  first,
  second,
}: {
  first: string;
  second: string;
}): Similarity | null {
  if (normaliseQuery({ query: first }) === normaliseQuery({ query: second })) {
    return "exact";
  }
  const firstWords: Set<string> = wordsOf({ query: first });
  const secondWords: Set<string> = wordsOf({ query: second });
  if (firstWords.size === 0 || secondWords.size === 0) {
    return null;
  }
  const score: number = overlap({ first: firstWords, second: secondWords });
  if (score === 1) {
    return "same_words";
  }
  return score >= SIMILARITY_THRESHOLD ? "similar" : null;
}

/** An alert that is alike a query, and how alike. */
export interface AlertMatch {
  readonly alert: LiveAlert;
  readonly similarity: Similarity;
}

/** Find the live alerts that are alike a query. Exact matches come first. */
export function findMatches({
  query,
  liveAlerts,
}: {
  query: string;
  liveAlerts: readonly LiveAlert[];
}): AlertMatch[] {
  const rank: Record<Similarity, number> = { exact: 0, same_words: 1, similar: 2 };
  return liveAlerts
    .flatMap((alert: LiveAlert): AlertMatch[] => {
      const similarity: Similarity | null = compareQueries({ first: query, second: alert.query });
      return similarity === null ? [] : [{ alert, similarity }];
    })
    .sort((left: AlertMatch, right: AlertMatch) => rank[left.similarity] - rank[right.similarity]);
}
