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

-----

コードを一通り確認しました。以下の点が曖昧または不明です。

1. TransformMode の文字列値（最重要）
prepare-naming.md には「InterpolationTransformer 系のリネームに合わせて mode 定数も同様に変更する」とありますが、具体的な新しい文字列値が書かれていません。現在の定義：


type TransformMode = "Default" | "Interpolation" | "Billboard" | "InterpolationBillboard" | "SimplePhysics";
これは想定通りでしょうか？

"Interpolation" → "Smooth"
"InterpolationBillboard" → "SmoothBillboard"
残りの "Default", "Billboard", "SimplePhysics" はそのまま
2. ファイル名の変更
クラス名と同名のファイルが複数あります。ファイル名もリネームしますか？

変更前ファイル	変更後候補
src/three/Image.ts	ImagePlane.ts
src/three/HTML.ts	Html3D.ts
src/three/ThreeJS.ts	ThreeObject.ts
src/core/GeneralCamera.ts	ThreeCamera.ts
src/core/Test.ts	SampleObject.ts
src/rapier/CharacterTransformer.ts	KinematicCharacterTransformer.ts
src/rapier/CharacterTransformer2.ts	DynamicCharacterTransformer.ts
3. Transform.loc の扱い
loc → position のリネーム対象について確認です。loc プロパティは ObjectA3 のゲッターだけでなく、LinearMath.ts の Transform クラスにも同名プロパティがあります（Transform はパブリックAPIとして export されています）。


// LinearMath.ts
export class Transform {
  loc: Vec3;  // これも position に変えますか？
  ...
}
4. デフォルト値変数の扱い
以下の変数はリネームリストに含まれていませんが、クラス名が変わるため一貫性の観点で変えるかどうか確認です：

defaultACOptions → 変更しない？（対応する型 ACOptions → AvatarPositionControllerOptions は変更対象）
defaultCharacterTransOptions → 変更しない？
defaultCharacterTrans2Options → 変更しない？
以上4点を確認できれば、作業に入れます。


１．のTransformModeの文字列地については提案してもらった通りの変更をしてください。２．はファイル名もクラス名同様に変更をお願いします。３．については後で検討しようと思っていたいので、今は変更しないでください。４．についてはピックアップしてもらった３つについて他の変更に合わせて理ネームしてください。この回答に従って作業に入ってください。
