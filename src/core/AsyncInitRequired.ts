

export interface AsyncInitRequired<T> {
  readonly ready: Promise<T>;
}
