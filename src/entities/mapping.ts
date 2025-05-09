export type MappingType = "date" | "number" | "string";

export class Mapping {
  readonly column;
  readonly target;
  readonly type;

  constructor(column: string, target: string, type: MappingType) {
    this.column = column;
    this.target = target;
    this.type = type;
  }
}
