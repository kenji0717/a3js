# KinematicCharacterモード

プレイヤーやNPCなどの**キャラクター**を動かすためのモードです。
オブジェクトをカプセル型のコライダーで包み、Rapierの
キネマティックキャラクターコントローラーで制御します。
使う前に`await a3.initPhysics();`が必要です。

```js
await a3.initPhysics();
player.setMode('KinematicCharacter');
```

このモードの特徴は以下の通りです。

* `setPosition()`で位置を指定して動かします（キネマティック=
  プログラム主導）。壁にめり込まない・段差を登る・斜面を滑らない
  といったキャラクター特有の処理はRapierがやってくれます。
* 接地判定（`isGrounded()`）が正確で安定しています。
* 速度の情報が得られないため、
  [向きとアクションの自動制御](../AutoDirectionAndAction/)
  （`setAutoDirection()`/`setAutoAction()`）は使えません。
  周囲の剛体から押される相互作用が必要な場合も
  [DynamicCharacterモード](./DynamicCharacter)を使ってください。

キーボード操作には
[AvatarPositionControllerクラス](../Controller/AvatarPositionController)
がそのまま使えます。以下はロボットをW/A/S/Dキーで動かすサンプル
です（キーが効かないときは一度3D表示部分をクリックしてください）。

<<< @/public/samples/kinematic-character.js{js}

<A3Runner src="kinematic-character.js" />

## モードのオプション

* `auto` — `true`のとき、メッシュ形状からカプセルの高さと半径を
  自動計算します（デフォルト）。
* `height`/`radius` — カプセルの高さ・半径（`auto:false`のとき使用）。
* `offset` — コライダーと地面・壁との間に保持する最小隙間。
  デフォルトは`0.01`。
* `friction`/`restitution`/`membership`/`filter`/
  `collisionDetection` — [SimplePhysicsモード](./SimplePhysics)と
  同様です。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/interfaces/KinematicCharacterTransformerOptions.html)を
参照してください。
