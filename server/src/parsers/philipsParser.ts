// Philips Respironics (DreamStation) detection stub. See resmedParser.ts for
// the philosophy behind shipping a detector with a friendly "not yet supported"
// message in the MVP.
import path from "path";
import { CpapParser, ParseResult } from "./types";

export const philipsParser: CpapParser = {
  name: "philips",

  detect(_rootDir, allFiles) {
    const names = allFiles.map(f => path.basename(f).toLowerCase());
    const hasPSettings = names.includes("psettings.bin") ||
                         names.includes("settings.bin");
    const hasDreamMapper = allFiles.some(f =>
      f.toLowerCase().includes("/p-series/") ||
      f.toLowerCase().includes("/dreamstation/"));
    return hasPSettings || hasDreamMapper;
  },

  async parse(): Promise<ParseResult> {
    return {
      nights: [],
      parserName: "philips",
      message:
        "Philips Respironics data was detected, but the Philips parser is not " +
        "yet available in this MVP. Please export from OSCAR as CSV instead.",
    };
  },
};
