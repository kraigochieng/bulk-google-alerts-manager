import { normaliseQuery } from "src/core/query-normaliser";
import type { RowIssue } from "src/shared/models";

/** Longest query that the extension accepts. The spike must confirm the page limit. */
export const MAXIMUM_QUERY_LENGTH: number = 500;

/** List the issues of each query. A repeated query is marked from its second use. */
export function findQueryIssues({
  queries,
  maximumQueryLength,
}: {
  queries: readonly string[];
  maximumQueryLength: number;
}): RowIssue[][] {
  const seenQueries: Set<string> = new Set();
  return queries.map((query: string): RowIssue[] => {
    const normalisedQuery: string = normaliseQuery({ query });
    if (normalisedQuery === "") {
      return ["empty"];
    }
    const issues: RowIssue[] = [];
    if (query.trim().length > maximumQueryLength) {
      issues.push("too_long");
    }
    if (seenQueries.has(normalisedQuery)) {
      issues.push("duplicate_in_file");
    }
    seenQueries.add(normalisedQuery);
    return issues;
  });
}
