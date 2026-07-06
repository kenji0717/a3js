# TPSのサンプルプログラム

キャラクターを三人称視点（TPS: Third Person Shooter）で操作して、
歩き回るロボットの敵を弾丸で倒すゲームです。敵を全部（10体）倒すと
クリア、敵にぶつかられてLIFEが0になるか、フィールドから落ちると
ゲームオーバーです。ときどき出現するアヒルの回復アイテムを取ると
LIFEが回復します。

**<a href="../samples/TPS.html" target="_blank">▶ TPSを実行する</a>**
（ソースを見るにはページを開いてブラウザの「ページのソースを表示」を
使うか、リンク先を保存してください）

## 操作方法

* PC — W/A/S/Dキーで移動、矢印キーで方向転換、Spaceキーでジャンプ、
  Enterキーで弾丸発射。マウスでも方向転換（PointerLock中）と
  クリックで発射ができます。
* スマホ — 左ジョイスティックで移動、右ジョイスティックで方向転換、
  「L」ボタンでジャンプ、「R」ボタンで弾丸発射。

## このプログラムの特徴

### DynamicCharacterモードのプレイヤー

プレイヤー（`vesma9.a3`）は`DynamicCharacter`モードで動かして
います。毎フレームの`update(dt)`で、ジョイスティックの入力から
速度ベクトルを組み立てて`setLinearVelocity()`で移動、
`setAngularVelocity()`で方向転換しています。
`getUnitVecX()`/`getUnitVecZ()`で「自分の向きから見た前後左右」の
ベクトルが取れるので、キャラクターの向き基準の移動が簡単に書けます。

ジャンプは`isGrounded()`（接地判定）と自前の上方向速度の組み合わせで
実現しています。

```js
this.upSpeed += (-9.8*dt);       // 重力
if (this.isGrounded()) {
  this.upSpeed = 0;              // 着地したらリセット
  if (view.leftButton) this.upSpeed = 5.0; // ジャンプ
}
```

また`setAutoAction(true)`により、移動速度に応じて止まる・歩く・
走るのアニメーションが自動で切り替わります（詳しくは
[向きとアクションの自動制御](../FeaturesIntroduction/AutoDirectionAndAction/)）。

### クラスごとに役割を持たせた敵・弾丸・アイテム

* 敵（`RobotExpressive.glb`、`DynamicCharacter`モード）は、
  フィールドの境界で跳ね返りながら歩き回ります。
  `setAutoDirection(true)`で進行方向を自動で向きます。
  弾丸が当たると消えてスコアが100点入ります。
* 弾丸（`bullet.a3`、`SimplePhysics`モード）は発射時に
  `setLinearVelocity()`で前方斜め上に打ち出され、あとは物理演算で
  放物線を描いて飛びます。何かに当たるか地面より下に落ちると
  消えます。
* 回復アイテムのアヒル（`Duck.glb`）はメインループの中で毎フレーム
  1000分の2の確率で出現し、一定時間で消えます。プレイヤーが
  触れるとLIFEが100回復します。

いずれも衝突時の処理は各クラスの`handleCollision()`に書かれて
います。`obj instanceof Bullet`のように相手のクラスで処理を
分けるのがポイントです（詳しくは
[当たり判定](../FeaturesIntroduction/CollisionDetection/)）。

### マウスによる視点操作（PointerLock）

ゲーム開始時に`requestPointerLock()`でマウスカーソルを画面に
固定し、マウスの移動量（`e.movementX`/`movementY`）から
プレイヤーの向きとカメラの高さを変えています。FPS/TPSでよく使われる
操作方法です。

### そのほか

* フィールドは`grass-ground2.glb`を`meshCollider: 'tri_mesh'`・
  `rigidBody: 'fixed'`の固定地形にしています。
* カメラは`Follow`モードでプレイヤーを追いかけます。
* LIFEとSCOREの表示はHTMLの要素に毎フレーム書き込んでいます。
* BGM・効果音: [魔王魂](https://maou.audio)
