# その他の機能

## プリミティブ

3Dモデルファイルを用意しなくても、簡単な形のオブジェクト
（プリミティブ）をすぐに表示できます。

* `a3.Box` — 直方体。数値を渡すと幅・高さ・奥行き、文字列を渡すと
  色（CSSカラー文字列）を指定できます。
* `a3.Sphere` — 球体。数値を渡すと半径・水平セグメント数・
  垂直セグメント数、文字列を渡すと色を指定できます。

```js
const box1 = new a3.Box();                 // 1×1×1の灰色の箱
const box2 = new a3.Box(2,1,1,'red');      // 幅2の赤い箱
const ball1 = new a3.Sphere();             // 半径1の灰色の球
const ball2 = new a3.Sphere(0.5,'blue');   // 半径0.5の青い球
```

このほか、three.jsの`Object3D`をそのまま表示できる
`a3.ThreeObject`もあります。three.jsの機能をフルに使いたいときに
便利です。

## [Text3Dクラス](./Text3D)

3D空間に立体的な文字を表示するクラスです。

## [ImagePlaneクラス](./ImagePlane)

3D空間に画像を表示するクラスです。

## [CarControlクラス](./CarControl)

本格的な車の物理シミュレーションを行うクラスです。

## `Scene.setPhysicsDebugMode()`

物理演算のデバッグ表示を有効にすると、コライダー（衝突判定の形状）の
輪郭線が3D空間に表示されます。「当たっているはずなのに当たらない」
「なぜか弾き飛ばされる」といった物理演算のトラブルの原因調査に
とても役立ちます。

```js
view.scene.setPhysicsDebugMode(true);
```

## `StandardLights.setDebugMode()`

[StandardLightsクラス](../AboutLight/StandardLights)のデバッグ表示を
有効にすると、影の計算に使われるライトのカメラ（シャドーカメラ）の
範囲が直方体で表示されます。「影が途中で切れる」「影が出ない」
といったトラブルの原因調査に役立ちます。影については
[影を表示する方法](../Shadow/)を参照してください。

```js
light.setDebugMode(true);
```

## `ObjectA3.add()`

オブジェクトには`add()`で別のオブジェクトを子として取り付けられ
ます。子の位置・回転は親からの相対になり、親を動かすと子も
一緒に動きます。ロボットアームのような多関節の構造や、
キャラクターへのアイテムの持たせなどに使えます。
取り外すときは`remove()`です。

以下はプリミティブを`add()`でつないだ2関節のアームのサンプルです。

<<< @/public/samples/box-sphere-add.js{js}

<A3Runner src="box-sphere-add.js" />
