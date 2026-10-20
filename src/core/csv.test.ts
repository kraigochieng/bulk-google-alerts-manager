import { describe, expect, it } from "vitest";

import { CsvParseError, parseCsv, writeCsv } from "src/core/csv";

describe("parseCsv", () => {
  it("reads quoted phrases with commas and doubled quotes", () => {
    const table = parseCsv({
      text: 'query,label\r\n"""Jane Doe"" OR ""Jane A. Doe""",people\r\n"a, b",x\r\n',
    });
    expect(table.headers).toEqual(["query", "label"]);
    expect(table.records).toEqual([
      ['"Jane Doe" OR "Jane A. Doe"', "people"],
      ["a, b", "x"],
    ]);
  });

  it("removes a byte order mark and skips empty lines", () => {
    const table = parseCsv({ text: "﻿query\n\nfoo\n  \nbar\n" });
    expect(table.headers).toEqual(["query"]);
    expect(table.records).toEqual([["foo"], ["bar"]]);
  });

  it("reads a quoted newline", () => {
    const table = parseCsv({ text: 'query\n"a\nb"\n' });
    expect(table.records).toEqual([["a\nb"]]);
  });

  it("throws a custom error for empty input", () => {
    expect(() => parseCsv({ text: "" })).toThrow(CsvParseError);
  });

  it("throws a custom error for a quoting error", () => {
    expect(() => parseCsv({ text: 'query\n"unclosed\n' })).toThrow(CsvParseError);
  });
});

describe("writeCsv", () => {
  it("round-trips hard values", () => {
    const table = {
      headers: ["query", "error"],
      records: [['"Jane Doe" OR "Jane A. Doe"', "a, b\nc"]],
    };
    expect(parseCsv({ text: writeCsv({ table }) })).toEqual(table);
  });
});
