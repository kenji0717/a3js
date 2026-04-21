# a3js 命名アドバイス

> Claude による命名レビュー（2026-04-21）

---

## クラス名

| 現在 | 提案 | 理由 |
|------|------|------|
| `Canvas` | `A3Canvas` or `CanvasView` | ブラウザ組み込みの `HTMLCanvasElement` / `OffscreenCanvas` と紛らわしい |
| `Window` | `A3Window` or `WindowView` | ブラウザ組み込みの `window` グローバルと紛らわしい |
| `Image` | `ImagePlane` or `Sprite` | ブラウザ組み込みの `Image` (= `HTMLImageElement`) と完全に衝突する |
| `HTML` | `HtmlOverlay` or `Html3D` | 何を表すか一目でわかりにくい |
| `ThreeJS` | `NativeObject3D` or `RawObject3D` | "ThreeJS" はライブラリ名であって型の意味を伝えない |
| `ViewBase` | `BaseView` | 英語では形容詞→名詞の順が自然（同様に `ControllerBase` → `BaseController`） |
| `GeneralCamera` | `DefaultCamera` or `StandardCamera` | "General" は意味が曖昧 |
| `Test` | `TestObject` or `DebugCube` | 他の "Test" クラスや関数と混同しやすい |
| `AvatarController2` | `AvatarVelocityController` or `AvatarPhysicsController` | `2` は何が違うのか伝わらない |
| `CharacterTransformer2` | `DynamicCharacterTransformer` | 同上。`CharacterTransformer` がキネマティック、`CharacterTransformer2` がダイナミックなら名前に出す |
| `InterpolationBillboardTransformer` | `SmoothBillboardTransformer` | 長すぎる。`Interpolation` を `Smooth` か `Lerp` に縮める |
| `FixedTransformer` | `StaticTransformer` | 3DCG 用語として `Static` の方が一般的 |

---

## メソッド名

### `Now` サフィックスについて

`setLocationNow` / `setQuatNow` などの `Now` パターンは動く仕組みとしては理解できますが、英語ライブラリとしては珍しい。よくある表現：

| 現在 | 提案 |
|------|------|
| `setLocation(...)` / `setLocationNow(...)` | `setPosition(...)` / `teleport(...)` or `setPositionImmediate(...)` |
| `setQuat(...)` / `setQuatNow(...)` | `setQuaternion(...)` / `setQuaternionImmediate(...)` |

`setLocation` より `setPosition` の方が Three.js の世界観とも一致します。

### その他メソッド名

| 現在 | 提案 | 理由 |
|------|------|------|
| `setLinvel(...)` / `getLinvel(...)` | `setLinearVelocity(...)` / `getLinearVelocity(...)` | Rapier 内部の略称を API に出さない方がよい |
| `setAngvel(...)` / `getAngvel(...)` | `setAngularVelocity(...)` / `getAngularVelocity(...)` | 同上 |
| `mulQuat(...)` | `applyRotation(...)` or `rotateBy(...)` | `mul` は数学記法すぎる |
| `mulScale(...)` | `scaleBy(...)` | 同上 |
| `addLocation(...)` | `translate(...)` or `move(...)` | "addLocation" は直訳的 |
| `setBalloon(message)` | `setSpeechBubble(message)` or `setLabel(message)` | "Balloon" は日本語でよく使う語だが英語では "speech bubble" が一般的 |
| `setHeadLightEnable(b)` | `enableHeadLight(b)` or `setHeadLightEnabled(b)` | `Enable` は動詞か形容詞か曖昧になる |
| `calcNDC(loc)` | `worldToNDC(loc)` | `calc` より変換の意図が明確 |
| `morph(name, value)` | `setMorph(name, value)` | 他の setter と統一 |
| `rapierDebug(debug)` | `setPhysicsDebugMode(enabled)` | 内部エンジン名を表に出さない方が良い |

### `CarControl` のメソッド

| 現在 | 提案 |
|------|------|
| `handle(h)` | `setSteeringAngle(angle)` or `steer(angle)` |
| `accelerator(a)` | `setAccelerator(value)` |
| `brake(b)` | `setBrake(value)` |

動詞単体だと「呼ぶと何かが起きる」のか「値をセットする」のかわかりにくい。

---

## プロパティ名・ゲッター名

| 現在 | 提案 | 理由 |
|------|------|------|
| `loc` (Vec3 ゲッター) | `position` | Three.js の `.position` と統一感が出る |
| `quat` (Quat ゲッター) | `quaternion` or `rotation` | 略称より完全形の方が初心者に優しい |
| `trans` (Transform ゲッター) | `transform` | 略称 |
| `object` (Three.js の Object3D) | `threeObject` or `object3D` | `object` は汎用的すぎて何のオブジェクトか不明 |
| `haltActionNo` / `walkActionNo` / `runActionNo` | `haltActionIndex` / `walkActionIndex` / `runActionIndex` | 英語で "No" = Number はやや日本語的。`Index` の方が一般的 |
| `billboard` (boolean) | `isBillboard` | boolean プロパティは `is` / `has` / `can` で始めるのが慣例 |
| `preMouse` | `prevMousePosition` or `lastMousePosition` | `pre` だけでは "previous" と分かりにくい |
| `leftClick` / `rightClick` (boolean) | `isLeftDown` / `isRightDown` | 状態を表すなら `is` を |
| `nowTime` | `elapsedTime` or `currentTime` | `now` は英語では瞬間を指す語として使いにくい |
| `firstTrans` / `lastTrans` | `startTransform` / `endTransform` | 略称＋意味が明確に |
| `morphsOverwrite` (boolean) | `overwriteMorphs` or `exclusiveMorphs` | boolean なのに名詞＋形容詞の語順が逆 |

---

## 型・インターフェース名

| 現在 | 提案 |
|------|------|
| `ACOptions` | `AvatarControllerOptions` |
| `AC2Options` | `AvatarVelocityControllerOptions`（クラス名変更に合わせて） |
| `CharacterTransOptions` | `CharacterTransformerOptions` |
| `CharacterTrans2Options` | `DynamicCharacterTransformerOptions` |
| `ColliderKind` | `ColliderType`（`Kind` より `Type` が一般的） |
| `MeshColliderKind` | `MeshColliderType` |
| `Shape` | `ObjectShape` or `MeshHierarchy`（三角形の「形状」と混同しやすい） |

---

## 関数名

| 現在 | 提案 |
|------|------|
| `getQuatOfLookAt(...)` | `getLookAtQuaternion(...)` |
| `vec3EulerToQuat(...)` | `eulerToQuaternion(...)` |
| `collisionMap(...)` | `createCollisionMap(...)` |
| `regenerateGLTFLoader()` | `resetGLTFLoader()` or `recreateGLTFLoader()` |

---

## まとめ・優先度

### 最重要（破壊的だが早いうちに直すべき）
- `Image` → `ImagePlane`（ブラウザ組み込みと衝突）
- `Canvas` → `A3Canvas`、`Window` → `A3Window`

### 重要（API の可読性に影響）
- `setLinvel` / `setAngvel` → `setLinearVelocity` / `setAngularVelocity`
- `loc` / `quat` / `trans` ゲッター → `position` / `quaternion` / `transform`
- `AvatarController2` / `CharacterTransformer2` の `2` を廃止

### 余裕があれば（磨き）
- `Now` サフィックスの統一
- boolean プロパティへの `is` プレフィックス
- `setBalloon` → `setSpeechBubble`
