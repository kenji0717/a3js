# AvatarPositionControllerクラス

`a3.AvatarPositionController`は、キーボードでアバター
（キャラクター）を操作するコントローラーです。

* **W/A/S/D** — 前後左右に移動します。
* **←→ 矢印キー** — 左右に回転します。
* **Space** — ジャンプします。

`setPosition()`で位置を指定する方式のため、**接地判定が正確で
安定している**のが特徴です。
[KinematicCharacterモード](../SetMode/KinematicCharacter)または
[DynamicCharacterモード](../SetMode/DynamicCharacter)のアバターと
組み合わせて使います。周囲の剛体を押したり押されたりする相互作用が
必要な場合は
[AvatarVelocityControllerクラス](./AvatarVelocityController)を
使ってください。

```js
view.setController(new a3.AvatarPositionController(player));
```

## 生成オプション

第2引数でオプションを指定できます。

* `speed` — 移動速度（1フレームあたりの移動距離）。デフォルトは
  `0.1`。
* `angSpeed` — 回転速度（1フレームあたりのラジアン）。デフォルトは
  `0.01`。

## サンプル

KinematicCharacterモードのロボットをW/A/S/Dキーで動かすサンプル
です（キーが効かないときは一度3D表示部分をクリックしてください）。

<<< @/public/samples/kinematic-character.js{js}

<A3Runner src="kinematic-character.js" />

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/AvatarPositionController.html)を
参照してください。
