// ResMed-style detection stub.
//
// Real ResMed AirSense / AirCurve cards contain proprietary EDF and crypted
// summary files (STR.edf, EVE.edf, BRP.edf, SAD.edf inside DATALOG/yyyymmdd/).
// Parsing those properly is a substantial project on its own — this MVP only
// *detects* the structure and returns an explanatory message so the user
// understands why no dashboard appeared.
//
// When a real ResMed parser is added, drop it in here behind the same
// CpapParser interface — nothing else in the system needs to change.

import path from "path";
import { CpapParser, ParseResult } from "./types";

export const resmedParser: CpapParser = {
  name: "resmed",

  detect(_rootDir, allFiles) {
    const lowers = allFiles.map(f => path.basename(f).toLowerCase());
    const hasDatalog = allFiles.some(f => f.toLowerCase().includes("/datalog/"));
    const hasStrEdf = lowers.includes("str.edf") || lowers.some(f => f.endsWith(".edf"));
    const hasIdentity = lowers.includes("identification.tgt") ||
                        lowers.includes("identification.crc");
    return (hasDatalog && hasStrEdf) || hasIdentity;
  },

  async parse(): Promise<ParseResult> {
    return {
      nights: [],
      parserName: "resmed",
      message:
        "ResMed CPAP data was detected, but the ResMed binary parser is not yet " +
        "available in this MVP. For now, please export your data from OSCAR as " +
        "CSV and upload that ZIP instead.",
    };
  },
};
