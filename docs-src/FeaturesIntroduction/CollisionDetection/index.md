# 当たり判定

物理系のモード（[SimplePhysics](../SetMode/SimplePhysics)・
[KinematicCharacter](../SetMode/KinematicCharacter)・
[DynamicCharacter](../SetMode/DynamicCharacter)）のオブジェクトは、
衝突したことを検知して処理を書くことができます。

使うためには、`setMode()`のオプションで`collisionDetection: true`を
指定しておく必要があります（デフォルトは`false`）。衝突する
**両方のオブジェクト**で有効にしてください。

```js
obj.setMode('SimplePhysics',{collisionDetection: true});
```

衝突を受け取る方法は2つあります。

## `ObjectA3.handleCollision()`

オブジェクトのクラスを継承して`handleCollision()`メソッドを
実装する方法です。「ぶつかったときにどうするか」をオブジェクト
自身に書けるので、ゲームのキャラクターやアイテムに向いています。

引数は、ぶつかった相手のオブジェクト、衝突の開始か終了か、
自分・相手のぶつかったパーツ番号の4つです。

以下はよく弾むボールを床に落とすサンプルです。バウンドのたびに
衝突の開始・終了がコンソールに表示されます。

<<< @/public/samples/collision-handle.js{js}

<A3Runner src="collision-handle.js" />

相手が誰かによって処理を分けたいときは、`instanceof`で相手の
クラスを調べるのが定番です。

```js
handleCollision(obj, started, myPartNo, yourPartNo) {
  if (!started) return;         // 衝突開始のときだけ処理
  if (obj instanceof Bullet) {  // 弾丸が当たったときだけ処理
    scene.remove(this);
  }
}
```

実戦的な使用例は[TPSのサンプルプログラム](../../SamplePrograms/TPS)を
参照してください。

## `Scene.setCollisionListener()`

シーンに1つのリスナーを登録して、シーン内で起きたすべての衝突を
まとめて受け取る方法です。衝突の組み合わせをまとめて管理したい
場合や、クラスを作らずに書きたい場合に向いています。

```js
view.scene.setCollisionListener((collisions)=>{
  for (const c of collisions) {
    console.log(c.objectA, c.objectB, c.started);
  }
});
```

リスナーにはそのフレームで起きた衝突（`Collision`）の配列が
渡されます。`Collision`は以下の情報を持っています。

* `objectA`/`objectB` — 衝突した2つのオブジェクト。
* `partOfA`/`partOfB` — それぞれのぶつかったパーツのコライダー番号。
* `started` — 衝突開始のとき`true`、衝突終了のとき`false`。

## センサー（物理的な衝突なしの検知）

`collider: 'sensor'`を指定すると、物理的な衝突（跳ね返り）を
起こさずに、通過したことだけを検知できます。ゴール判定や
アイテムの取得に便利です。詳しくは
[SimplePhysicsモード](../SetMode/SimplePhysics)と
[カーレースサンプルプログラム](../../SamplePrograms/CarRace)を
参照してください。
