# AvatarVelocityControllerクラス

`a3.AvatarVelocityController`は、キーボードでアバター
（キャラクター）を操作するコントローラーです。キー操作は
[AvatarPositionControllerクラス](./AvatarPositionController)と
同じです。

* **W/A/S/D** — 前後左右に移動します。
* **←→ 矢印キー** — 左右に回転します。
* **Space** — ジャンプします。

こちらは`setLinearVelocity()`で速度を指定する方式のため、
**周囲の剛体と物理的に相互作用できる**（箱を押せる・押される）のが
特徴です。[DynamicCharacterモード](../SetMode/DynamicCharacter)の
アバターと組み合わせて使います。接地判定は
AvatarPositionControllerより不正確なので、安定した接地判定が
必要な場合はそちらを使ってください。

```js
view.setController(new a3.AvatarVelocityController(player));
```

## 生成オプション

第2引数でオプションを指定できます。

* `speed` — 移動速度（m/秒）。デフォルトは`5.0`。
* `angSpeed` — 回転速度（ラジアン/フレーム）。デフォルトは`0.3`。
* `jumpSpeed` — ジャンプ速度（m/秒）。デフォルトは`15.0`。

## サンプル

DynamicCharacterモードのロボットをW/A/S/Dキーで動かすサンプル
です。赤い箱（dynamicな剛体）を押せることを確認してください
（キーが効かないときは一度3D表示部分をクリックしてください）。

<<< @/public/samples/dynamic-character.js{js}

<A3Runner src="dynamic-character.js" />

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/AvatarVelocityController.html)を
参照してください。
