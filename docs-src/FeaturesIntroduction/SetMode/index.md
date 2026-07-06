# モードについて

## モードとは

a3jsのオブジェクト（`ObjectA3`）は、`setMode()`で「モード」を
切り替えることで、位置・回転・拡大率をどう制御するかを変更でき
ます。第2引数にはモードごとのオプションを渡せます。

```js
obj.setMode('SimplePhysics',{rigidBody:'fixed'});
```

モードは大きく2つのグループに分かれます。

**プログラムで動きを決めるモード** — `setPosition()`などで指定した
通りに（またはそれを加工して）動きます。

* [Defaultモード](./Default) — 指定した値を即座に反映します
  （初期モード）。
* [Smoothモード](./Smooth) — 指定した値へ約1秒かけてなめらかに
  補間します。
* [Followモード](./Follow) — 別のオブジェクトを追従します。
* [Billboardモード](./Billboard) — 常にターゲットの方向を向きます。
* [SmoothBillboardモード](./SmoothBillboard) — なめらかにターゲット
  方向を向きます。

**物理エンジンで動きを決めるモード** — 重力や衝突などの物理演算で
動きます。

* [SimplePhysicsモード](./SimplePhysics) — 剛体物理演算で動きます。
* [KinematicCharacterモード](./KinematicCharacter) — カプセル
  コライダーによるキネマティックキャラクター制御です。
* [DynamicCharacterモード](./DynamicCharacter) — カプセル
  コライダーによる動的キャラクター制御です。

## 物理演算の基本

a3jsの物理演算には[Rapier](https://rapier.rs/)という物理エンジンを
使っています。物理系のモードを使う前に、必ず物理エンジンの
初期化が必要です。

```js
await a3.initPhysics();
```

知っておくと役立つポイントをまとめます。

* 物理演算の世界（物理ワールド）は
  [Sceneごとに独立](../Scene/)しています。重力はデフォルトで
  下向き9.81m/s²です。
* 物理系のモードのオブジェクトを`setPosition()`で動かすことは
  できません。位置を強制的に変更するには`setPositionNow()`などの
  Nowがついたメソッドを使います（詳しくは
  [移動・回転・拡大縮小について](../MoveRotateScale/)）。
* 衝突を検知して処理を書くこともできます（詳しくは
  [当たり判定](../CollisionDetection/)）。
* 車の物理シミュレーションには専用の
  [CarControlクラス](../OtherFunctions/CarControl)があります。
* コライダー（衝突判定の形状）の様子は
  `scene.setPhysicsDebugMode(true);`で可視化できます。
