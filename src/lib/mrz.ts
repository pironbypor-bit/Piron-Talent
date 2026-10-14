// Machine-readable zone checks, the same rules as the database trigger in migration 0016. The browser uses this for
// instant feedback while typing; the database result is the one the reviewer sees.

export type MrzResult = "ok" | "bad_checksum" | "mismatch" | "unreadable";

/** ICAO 9303 check digit: weights 7,3,1 repeating; digits as value, A-Z as 10..35, filler '<' as 0. */
export function mrzCheckDigit(s: string): number {
  const w = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const v = c >= "0" && c <= "9" ? Number(c) : c >= "A" && c <= "Z" ? c.charCodeAt(0) - 55 : 0;
    sum += v * w[i % 3];
  }
  return sum % 10;
}

export const normaliseMrz = (line: string) => line.toUpperCase().replace(/\s/g, "");
export const normaliseNumber = (n: string) => n.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Passport second line (44) or ID-card first line (30), compared with the typed number and birth date (YYYY-MM-DD). */
export function checkMrz(line: string, idNumber: string, dateOfBirth: string): MrzResult {
  const m = normaliseMrz(line);
  const num = normaliseNumber(idNumber);
  if (!/^[A-Z0-9<]+$/.test(m)) return "unreadable";
  const cd = (s: string, at: number) => String(mrzCheckDigit(s)) === m[at - 1];
  if (m.length === 44) {
    const pn = m.slice(28, 42);
    const empty = pn === "<".repeat(14);
    const ok =
      cd(m.slice(0, 9), 10) &&
      cd(m.slice(13, 19), 20) &&
      cd(m.slice(21, 27), 28) &&
      (empty ? m[42] === "<" || m[42] === "0" : cd(pn, 43)) &&
      cd(m.slice(0, 10) + m.slice(13, 20) + m.slice(21, 43), 44);
    if (!ok) return "bad_checksum";
    const doc = m.slice(0, 9).replace(/<+$/, "");
    const dob = dateOfBirth ? dateOfBirth.slice(2, 4) + dateOfBirth.slice(5, 7) + dateOfBirth.slice(8, 10) : null;
    if (doc !== num || (dob && m.slice(13, 19) !== dob)) return "mismatch";
    return "ok";
  }
  if (m.length === 30) {
    if (!cd(m.slice(5, 14), 15)) return "bad_checksum";
    const doc = m.slice(5, 14).replace(/<+$/, "");
    return doc === num ? "ok" : "mismatch";
  }
  return "unreadable";
}
