// Shared types for the CPAP parser plug-in framework.
//
// The architecture is intentionally simple so new machine-specific parsers can
// be added without changing the runner: each parser is an object that knows
// how to *detect* whether a folder of files looks like its supported format,
// and how to *parse* it into a normalised set of NightSummary rows.
//
// Parsers MUST NOT throw on unrecognised input — they should return null from
// detect() and let another parser try.

export interface NightSummary {
  date: string;                  // ISO date YYYY-MM-DD
  usageMinutes?: number | null;
  ahi?: number | null;
  obstructiveIndex?: number | null;
  centralIndex?: number | null;
  hypopneaIndex?: number | null;
  reraIndex?: number | null;
  leakMedian?: number | null;
  leak95?: number | null;
  pressureMedian?: number | null;
  pressure95?: number | null;
  notes?: string | null;
}

export interface ParseResult {
  nights: NightSummary[];
  parserName: string;
  message?: string;
}

export interface CpapParser {
  name: string;
  /**
   * Return true if this parser believes it can read the files at the given
   * root directory. Should be cheap — a filename / structure check, not a
   * full read.
   */
  detect(rootDir: string, allFiles: string[]): boolean;
  /**
   * Parse the files into a normalised NightSummary[]. Implementations should
   * be tolerant of partial / malformed data and skip rows rather than throw.
   */
  parse(rootDir: string, allFiles: string[]): Promise<ParseResult>;
}
