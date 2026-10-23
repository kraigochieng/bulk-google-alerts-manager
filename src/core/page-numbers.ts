/** One item of the page number row: a page index counted from 0, or a gap. */
export type PageNumberItem = number | "gap";

/**
 * List the page numbers to show. Always include the first page, the last page, and the pages next to
 * the current page. Replace each skipped run with one gap. Pure.
 */
export function pageNumbers({ page, pageCount }: { page: number; pageCount: number }): PageNumberItem[] {
  const wanted: Set<number> = new Set<number>([0, pageCount - 1, page - 1, page, page + 1]);
  const kept: number[] = [...wanted].filter((candidate: number) => candidate >= 0 && candidate < pageCount).sort((first, second) => first - second);
  const items: PageNumberItem[] = [];
  let previous: number = -1;
  for (const current of kept) {
    if (current - previous === 2) items.push(previous + 1);
    else if (current - previous > 2) items.push("gap");
    items.push(current);
    previous = current;
  }
  return items;
}
