import { Mapping } from "./mapping";

export class ImportProfile {
  id;
  name;
  mappings;

  constructor(id: number, name: string, mappings: Mapping[] = []) {
    this.id = id;
    this.name = name;
    this.mappings = mappings ?? [];
  }
}
