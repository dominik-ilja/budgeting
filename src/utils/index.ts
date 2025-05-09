import { fileURLToPath } from "url";
import { dirname } from "path";

export function getFilename(metaUrl: string) {
  return fileURLToPath(metaUrl);
}

export function getDirname(metaUrl: string) {
  return dirname(getFilename(metaUrl));
}
