export abstract class StoreBase<DTO extends object = object, Key extends string = string> {
  abstract getKey(): Key;
  toDto?(): DTO;
  hydrateFromDto?(_obj: DTO): Promise<void>;
}