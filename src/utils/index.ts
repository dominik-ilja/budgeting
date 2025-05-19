import { fileURLToPath } from "url";
import { dirname } from "path";

/**
 * @example
 * getFilename(import.meta.url)
 */
export function getFilename(metaUrl: string) {
  return fileURLToPath(metaUrl);
}

/**
 * @example
 * getDirname(import.meta.url)
 */
export function getDirname(metaUrl: string) {
  return dirname(getFilename(metaUrl));
}
