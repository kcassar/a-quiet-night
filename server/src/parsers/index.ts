// Parser runner: picks the first parser that detects a match.
//
// Order matters. We prefer the OSCAR CSV parser because it's the only fully
// implemented parser in the MVP — if a user happens to ship both an OSCAR
// CSV export *and* the underlying machine folder, the CSV is the friendlier
// path.
import { CpapParser, ParseResult } from "./types";
import { oscarCsvParser } from "./oscarCsvParser";
import { oscarHtmlParser } from "./oscarHtmlParser";
import { resmedParser } from "./resmedParser";
import { philipsParser } from "./philipsParser";
import { fisherPaykelParser } from "./fisherPaykelParser";
import { bmcG2sA20Parser } from "./bmcG2sA20Parser";
import { listFilesRecursive } from "../lib/zipExtractor";

// CSV first (most direct, simplest schema), then HTML reports, then the
// detection-only stubs for proprietary binary formats.
const PARSERS: CpapParser[] = [
  oscarCsvParser,
  oscarHtmlParser,
  resmedParser,
  philipsParser,
  fisherPaykelParser,
  bmcG2sA20Parser,
];

export async function runParsers(rootDir: string): Promise<ParseResult> {
  const files = listFilesRecursive(rootDir);

  for (const parser of PARSERS) {
    if (parser.detect(rootDir, files)) {
      return parser.parse(rootDir, files);
    }
  }

  return {
    nights: [],
    parserName: "unknown",
    message:
      "We extracted your ZIP successfully, but couldn't recognise the data " +
      "format. The easiest way to get a dashboard is to install the free " +
      "OSCAR app, open your data, then export the daily summary as CSV and " +
      "upload that ZIP instead.",
  };
}

export type { CpapParser, ParseResult } from "./types";
