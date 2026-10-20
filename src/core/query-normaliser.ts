const CURLY_DOUBLE_QUOTES: RegExp = /[“”„‟«»]/g;
const CURLY_SINGLE_QUOTES: RegExp = /[‘’‚‛]/g;

/** Turn a query into the form that the code uses to compare queries. */
export function normaliseQuery({ query }: { query: string }): string {
  return query
    .normalize("NFKC")
    .replace(CURLY_DOUBLE_QUOTES, '"')
    .replace(CURLY_SINGLE_QUOTES, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
