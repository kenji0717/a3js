# 向きとアクションの自動制御

キャラクターを動かすとき、移動のたびに「進む方向に体を向ける」
「歩き/走りのアニメーションに切り替える」処理を自分で書くのは
面倒です。a3jsには、これを自動化する2つの機能があります。

* **自動向き調整**（`setAutoDirection(true)`）— 移動方向が正面に
  なるように回転を自動でコントロールします。
* **自動アクション切り替え**（`setAutoAction(true)`）— 現在の
  スピードに応じて、止まる・歩く・走るのアクションが自動で
  切り替わります。

## この機能が使える条件

どちらの機能もオブジェクトの**速度**（`getLinearVelocity()`）を
元に動作するため、速度の情報が得られるモードでしか機能しません。

`setAutoDirection()`が使える条件は以下の通りです。

* モードが`SimplePhysics`・`DynamicCharacter`・`Smooth`・
  `SmoothBillboard`・`Follow`のいずれかであること。
  `KinematicCharacter`モードは物理系ですが速度の情報が得られない
  ため使えません。`Default`などその他のモードでも機能しません。

`setAutoAction()`が使える条件は以下の通りです。

* `setAutoDirection()`の条件に加えて、ActionObject
  （GLTF・Acerola3D）のインスタンスであること。
* ActionObjectが持つ`haltActionName`・`walkActionName`・
  `runActionName`・`minWalkSpeed`・`minRunSpeed`プロパティが
  正しく設定されていること。一部のAcerola3Dフォーマットの
  3Dモデルはこれらの情報をメタデータで持っているので、
  自動で設定されます。

## `ObjectA3.setAutoDirection()`

移動方向（速度ベクトルの向き）が正面になるように、オブジェクトの
回転を毎フレーム自動調整します。上方向は`upVector`
（デフォルトはY軸）を基準にするので、地面の上を動き回る
キャラクターが自然に進行方向を向くようになります。

## `ActionObject.setAutoAction()`

現在のスピードに応じて`setState()`を自動で呼び出します。
切り替えのしきい値とアクション名はプロパティで変更できます。

* スピードが`minWalkSpeed`（デフォルト0.1m/s）未満 →
  `haltActionName`（デフォルト`'default'`）
* スピードが`minRunSpeed`（デフォルト1.0m/s）未満 →
  `walkActionName`（デフォルト`'walk'`）
* それ以上 → `runActionName`（デフォルト`'run'`）

```js
player.minRunSpeed = 2.0;        // 走りに切り替わる速さを変更
player.walkActionName = 'Walking'; // モデルのアクション名に合わせる
```

## サンプル

3秒ごとに停止（0m/s）→歩き（0.5m/s）→走り（4m/s）と速さを
変えながら円を描くように動くサンプルです。速さに応じて
アニメーションが切り替わり、常に進行方向を向くことを確認して
ください。

<<< @/public/samples/auto-direction-action.js{js}

<A3Runner src="auto-direction-action.js" />

実戦的な使用例は[TPSのサンプルプログラム](../../SamplePrograms/TPS)を
参照してください。プレイヤーに`setAutoAction()`、敵ロボットに
`setAutoDirection()`を使っています。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/ActionObject.html)を
参照してください。
