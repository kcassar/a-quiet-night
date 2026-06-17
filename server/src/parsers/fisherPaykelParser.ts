// Fisher & Paykel (SleepStyle / Icon) detection stub. See notes in
// resmedParser.ts.
import path from "path";
import { CpapParser, ParseResult } from "./types";

export const fisherPaykelParser: CpapParser = {
  name: "fisher-paykel",

  detect(_rootDir, allFiles) {
    const names = allFiles.map(f => path.basename(f).toLowerCase());
    return names.some(n => n.startsWith("infosmart") || n === "sleepstyle.dat");
  },

  async parse(): Promise<ParseResult> {
    return {
      nights: [],
      parserName: "fisher-paykel",
      message:
        "Fisher & Paykel data was detected, but the F&P parser is not yet " +
        "available in this MVP. Please export from OSCAR as CSV instead.",
    };
  },
};
