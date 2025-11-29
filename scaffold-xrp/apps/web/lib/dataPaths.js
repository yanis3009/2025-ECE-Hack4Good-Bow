import fs from "fs";
import path from "path";

// Helper to resolve data files in a few common development cwd layouts.
// Returns the first existing candidate path, or a reasonable default.
export function dataFilePath(filename) {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "data", filename),
    path.join(cwd, "apps", "web", "data", filename),
    path.join(cwd, "scaffold-xrp", "apps", "web", "data", filename),
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {
      // ignore
    }
  }

  // Fallback to the first candidate so caller can at least attempt to read it
  return candidates[0];
}
