import assert from "node:assert";

import type { Mapping } from "./mapping";

function isEmptyOrWhitespace(s: string) {
  return s.length === 0 || s.trim().length === 0;
}

export class ImportProfile {
  id: number;
  name: string;
  mappings: Mapping[];

  constructor({ id, mappings, name }: { id: number; name: string; mappings: Mapping[] }) {
    assert(id > 0, `id must be greater than 0.`);
    assert(!isEmptyOrWhitespace(name), `name cannot be empty or contain only whitespace`);

    this.id = id;
    this.name = name;
    this.mappings = mappings;
  }
}
