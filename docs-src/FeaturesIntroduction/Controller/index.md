# Controllerについて

## Controllerとは

Controllerは、マウス・タッチ・キーボードなどの**入力を処理する**
役割を持つ部品です。各Viewには1つのControllerが設定されていて、
`setController()`で切り替えられます。

```js
view.setController(new a3.AvatarPositionController(player));
```

デフォルトでは、マウスやタッチで視点を回せる
[OrbitControllerクラス](./OrbitController)が設定されています。
入力処理が何もない状態にしたいとき（ゲームでカメラを勝手に
動かされたくないときなど）は、空実装の`BaseController`を
設定します。

```js
view.setController(new a3.BaseController());
```

独自の操作を作りたいときは、`BaseController`を継承して必要な
メソッド（`keyDown()`・`mouseMove()`・毎フレームの`update()`など）
だけをオーバーライドします。

なお、スマホ向けのジョイスティックUIは、Controllerではなく
[GameCanvasクラス](../View/GameCanvas)が提供しています。

## [OrbitControllerクラス](./OrbitController)

マウスやタッチで視点を回転・ズームできるコントローラー
（デフォルト）です。

## [AvatarPositionControllerクラス](./AvatarPositionController)

キーボードでキャラクターを動かすコントローラーです。位置指定
方式で、接地判定が安定しています。

## [AvatarVelocityControllerクラス](./AvatarVelocityController)

キーボードでキャラクターを動かすコントローラーです。速度指定
方式で、周囲の剛体と物理的に相互作用できます。
