# 移動・回転・拡大縮小について

オブジェクトの移動・回転・拡大縮小の基本メソッドは以下の3つです。

```js
obj.setPosition(x,y,z); // 移動
obj.setRotation(x,y,z); // 回転(各軸の角度を度で指定)
obj.setScale(x,y,z);    // 拡大縮小
```

このほかにも便利なメソッドがあります。

* `lookAt(x,y,z)` — 指定した位置の方を向きます。座標の代わりに
  `Vec3`やオブジェクトも渡せます。
* `moveForward(f)`/`moveRight(r)`/`moveUp(u)` — **自分の向きを基準**
  にした前・右・上方向への相対移動です。
* `turnLeft(l)`/`turnUp(u)`/`rollRight(r)` — 自分の向きを基準にした
  相対回転（度）です。ヨー・ピッチ・ロールに対応します。飛行機の
  ような操縦はこれで書けます（使用例は
  [フライトシミュレーターのサンプル](../../SamplePrograms/FlightSimulator)）。

以下は`setRotation()`と`setPosition()`を毎フレーム更新して
アニメーションさせるサンプルです。

<<< @/public/samples/rotate-box.js{js}

<A3Runner src="rotate-box.js" />

## モードによる効果の違い

同じ`setPosition()`でも、オブジェクトの
[モード](../SetMode/)によって効果が変わります。

* `Default`モード — 指定した値が**即座に**反映されます。
* `Smooth`モード — 指定した値へ**なめらかに補間**しながら変化
  します。
* `SimplePhysics`などの物理系モード — 位置や回転は物理エンジンが
  決めるので、`setPosition()`や`setRotation()`は**効きません**。
* `Billboard`/`SmoothBillboard`モード — 回転は自動制御されるので
  `setRotation()`は効きませんが、`setPosition()`は使えます。

## Nowが付くメソッド

移動・回転系のメソッドには、`setPositionNow()`のように**Nowが
付いたバージョン**が用意されています。Nowが付いたメソッドは
モードに関係なく、位置や回転を**強制的に即座に**変更します。

* 物理系モードのオブジェクトを配置したり瞬間移動させたりするには
  Nowメソッドを使います。

```js
ground.setMode('SimplePhysics',{rigidBody:'fixed'});
ground.setPositionNow(0,-3,0); // 床を配置
```

* `Smooth`モードで「最初の配置だけは補間せず一瞬で終わらせたい」
  ときにも使えます。

物理系モードのオブジェクトをNowメソッドで動かすときの注意点として、
移動先が他のコライダーにめり込んでいると、物理エンジンの貫通解消の
力で勢いよく弾き飛ばされることがあります。地面の上に配置するときは
少し浮かせた位置に置いて落とすのが安全です。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/ObjectA3.html)を
参照してください。
