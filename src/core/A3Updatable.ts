

export interface A3Updatable {
  readonly isA3Updatable: true;
  update(dt: number): void;
}

export function isA3Updatable(obj: any): obj is A3Updatable {
  return obj?.isA3Updatable === true;
}
