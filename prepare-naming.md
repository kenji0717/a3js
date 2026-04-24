# a3js リネーム作業リスト

> naming-advice.md の「採用」列をもとにまとめたリネーム一覧

---

## クラス名

| 変更前 | 変更後 |
|--------|--------|
| `Image` | `ImagePlane` |
| `HTML` | `Html3D` |
| `ThreeJS` | `ThreeObject` |
| `ViewBase` | `BaseView` |
| `ControllerBase` | `BaseController` |
| `GeneralCamera` | `ThreeCamera` |
| `Test` | `SampleObject` |
| `AvatarController` | `AvatarPositionController` |
| `AvatarController2` | `AvatarVelocityController` |
| `CharacterTransformer` | `KinematicCharacterTransformer` |
| `CharacterTransformer2` | `DynamicCharacterTransformer` |
| `InterpolationBillboardTransformer` | `SmoothBillboardTransformer` |
| `InterpolationTransformer` | `SmoothTransformer` |
| `FixedTransformer` | `StaticTransformer` |

※ `Canvas`・`Window` は `a3.Canvas` / `a3.Window` の使用を推奨し、クラス名は変更しない。  
※ `InterpolationTransformer` 系のリネームに合わせて `ObjectA3` の mode 定数も同様に変更する。

---

## メソッド名

### 位置・回転・スケール

| 変更前 | 変更後 |
|--------|--------|
| `setLocation(...)` | `setPosition(...)` |
| `setLocationNow(...)` | `snapPosition(...)` |
| `setQuatNow(...)` | `snapQuat(...)` |
| `setScaleNow(...)` | `snapScale(...)` |

※ `setQuat(...)` はそのまま変更しない。

### 物理

| 変更前 | 変更後 |
|--------|--------|
| `setLinvel(...)` | `setLinearVelocity(...)` |
| `getLinvel(...)` | `getLinearVelocity(...)` |
| `setAngvel(...)` | `setAngularVelocity(...)` |
| `getAngvel(...)` | `getAngularVelocity(...)` |
| `rapierDebug(debug)` | `setPhysicsDebugMode(enabled)` |

### その他

| 変更前 | 変更後 |
|--------|--------|
| `mulScale(...)` | `scaleBy(...)` |
| `addLocation(...)` | `translate(...)` |
| `setBalloon(message)` | `setSpeechBubble(message)` |
| `setHeadLightEnable(b)` | `enableHeadLight(b)` |
| `calcNDC(loc)` | `worldToNDC(loc)` |
| `morph(name, value)` | `setMorph(name, value)` |

※ `mulQuat(...)` はそのまま変更しない。

### CarControl

| 変更前 | 変更後 |
|--------|--------|
| `handle(h)` | `steer(angle)` |
| `accelerator(a)` | `accelerate(value)` |

※ `brake(b)` はそのまま変更しない。

---

## プロパティ名・ゲッター名

| 変更前 | 変更後 |
|--------|--------|
| `loc` | `position` |
| `trans` | `transform` |
| `object` | `object3D` |
| `billboard` | `isBillboard` |
| `preMouse` | `lastMousePosition` |
| `leftClick` | `isLeftDown` |
| `rightClick` | `isRightDown` |
| `nowTime` | `currentTime` |
| `firstTrans` | `startTransform` |
| `lastTrans` | `endTransform` |
| `morphsOverwrite` | `overwriteMorphs` |

※ `quat` ゲッターはそのまま変更しない。  
※ `haltActionNo` / `walkActionNo` / `runActionNo` はそのまま変更しない。

---

## 型・インターフェース名

| 変更前 | 変更後 |
|--------|--------|
| `ACOptions` | `AvatarPositionControllerOptions` |
| `AC2Options` | `AvatarVelocityControllerOptions` |
| `CharacterTransOptions` | `KinematicCharacterTransformerOptions` |
| `CharacterTrans2Options` | `DynamicCharacterTransformerOptions` |
| `ColliderKind` | `ColliderType` |
| `MeshColliderKind` | `MeshColliderType` |
| `Shape` | `Figure` |

---

## 関数名

| 変更前 | 変更後 |
|--------|--------|
| `getQuatOfLookAt(...)` | `getLookAtQuaternion(...)` |
| `vec3EulerToQuat(...)` | `eulerToQuaternion(...)` |
| `regenerateGLTFLoader()` | `recreateGLTFLoader()` |
