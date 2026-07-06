# SimplePhysicsモード

Rapier物理エンジンによる**剛体物理演算**で動くモードです。重力で
落ちる、ぶつかって跳ね返る、転がる、といった動きが自動で
計算されます。使う前に`await a3.initPhysics();`が必要です。

```js
await a3.initPhysics();
obj.setMode('SimplePhysics',{rigidBody:'fixed'});
```

以下は固定した床の上に箱を落とすサンプルです。

<<< @/public/samples/physics-box.js{js}

<A3Runner src="physics-box.js" />

## rigidBody（剛体の種類）

一番重要なオプションです。

* `dynamic` — 重力や衝突などの力で動く剛体（デフォルト）。
  落ちる物・転がる物に使います。
* `fixed` — 動かない固定剛体。地面・壁・建物などに使います。
* `kinematic` — プログラムで直接位置を制御する剛体。力の影響は
  受けませんが、dynamicな剛体を押すことができます。動く床や
  障害物などに使います。位置は`setPositionNow()`で動かします。

なお、Rapierのデフォルトではkinematic同士の衝突は検知されませんが、
a3jsではkinematic同士も衝突（衝突イベントの検知）するように
なっています。

## コライダーのオプション

* `collider` — `'solid'`（物理的に衝突する。デフォルト）または
  `'sensor'`（衝突イベントは発生するが物理的な衝突はしない）。
  センサーはゴール判定やアイテム取得などに便利です（使用例は
  [カーレースサンプルプログラム](../../SamplePrograms/CarRace)）。
* `meshCollider` — メッシュ形状からコライダーを作る方法。
  `'convex_hull'`（凸包。高速で、動く物体にも使える。デフォルト）
  または`'tri_mesh'`（三角メッシュ。複雑な形状に対応するが、
  動く物体には非推奨）。地形には`'tri_mesh'`と`rigidBody:'fixed'`の
  組み合わせが定番です。

```js
field.setMode('SimplePhysics',{meshCollider:'tri_mesh', rigidBody:'fixed'});
```

## その他のオプション

* `mass` — 質量（kg）。デフォルトは`1.0`。
* `friction` — 摩擦係数（0.0〜1.0）。デフォルトは`0.5`。
* `restitution` — 反発係数（0.0〜1.0）。0で全く弾まず、1に近いほど
  よく弾みます。デフォルトは`0.5`。
* `collisionDetection` — `true`にすると衝突の検知が有効になります
  （デフォルトは`false`）。詳しくは
  [当たり判定](../CollisionDetection/)。
* `membership`/`filter` — 衝突グループのビットマスク。「この
  グループとだけ衝突する」といった制御ができます。

コライダーの形や位置を確認したいときは
`scene.setPhysicsDebugMode(true);`が便利です。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/interfaces/SimplePhysicsOptions.html)を
参照してください。
