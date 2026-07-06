# DynamicCharacterモード

[KinematicCharacterモード](./KinematicCharacter)と同じく
キャラクター用のモードですが、こちらはカプセルコライダーを
**dynamicな剛体**として物理演算します。
使う前に`await a3.initPhysics();`が必要です。

```js
await a3.initPhysics();
player.setMode('DynamicCharacter');
```

このモードの特徴は以下の通りです。

* `setLinearVelocity()`で速度を指定して動かします。重力も物理演算で
  かかります。
* 物理演算の剛体なので、**周囲の剛体を押したり押されたりする
  相互作用**ができます。
* 速度の情報が得られるので、
  [向きとアクションの自動制御](../AutoDirectionAndAction/)
  （`setAutoDirection()`/`setAutoAction()`）が使えます。
* 接地判定はKinematicCharacterモードより不正確です。安定した
  接地判定が必要ならKinematicCharacterモードを使ってください。

キーボード操作には
[AvatarVelocityControllerクラス](../Controller/AvatarVelocityController)
がそのまま使えます。以下はロボットをW/A/S/Dキーで動かすサンプル
です。`setAutoAction()`も有効にしてあるので、動き出すと自動で
アニメーションが切り替わります。赤い箱を押すこともできます
（キーが効かないときは一度3D表示部分をクリックしてください）。

<<< @/public/samples/dynamic-character.js{js}

<A3Runner src="dynamic-character.js" />

## モードのオプション

* `auto` — `true`のとき、メッシュ形状からカプセルの高さと半径を
  自動計算します（デフォルト）。
* `height`/`radius` — カプセルの高さ・半径（`auto:false`のとき使用）。
* `mass` — 質量（kg）。デフォルトは`1.0`。
* `friction`/`restitution`/`membership`/`filter`/
  `collisionDetection` — [SimplePhysicsモード](./SimplePhysics)と
  同様です。

実戦的な使用例は[TPSのサンプルプログラム](../../SamplePrograms/TPS)を
参照してください（プレイヤーと敵の両方がDynamicCharacterモード
です）。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/interfaces/DynamicCharacterTransformerOptions.html)を
参照してください。
