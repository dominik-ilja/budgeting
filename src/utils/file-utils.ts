import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * @example
 * getFilename(import.meta.url)
 */
export function getFilename(url: string | URL) {
  return fileURLToPath(url);
}

/**
 * @example
 * getDirname(import.meta.url)
 */
export function getDirname(url: string | URL) {
  return dirname(getFilename(url));
}
