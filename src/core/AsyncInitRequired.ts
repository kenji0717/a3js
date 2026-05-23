

/**
 * 非同期初期化が必要なオブジェクトに実装されるインターフェースです。
 *
 * このインターフェースを実装するクラスは、コンストラクタ内で非同期処理を開始し、
 * 完了を `ready` プロパティ（Promise）で通知します。
 * `scene.add()` や `play()` など、初期化完了後にのみ有効なメソッドを呼び出す前に
 * `await obj.ready` で初期化の完了を待ってください。
 *
 * @example
 * ```ts
 * const gltf = new GLTF('model.glb');
 * await gltf.ready; // 読み込み完了を待つ
 * scene.add(gltf);
 * ```
 */
export interface AsyncInitRequired<T> {
  /** 非同期初期化の完了を表す Promise。解決されたら初期化完了です。 */
  readonly ready: Promise<T>;
}
