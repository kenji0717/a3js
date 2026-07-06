# Smoothモード

`setPosition()`・`setRotation()`・`setScale()`で指定した値へ、
**なめらかに補間しながら**変化するモードです。毎フレームの計算を
自分で書かなくても、目標の値を指定するだけでアニメーションに
なります。

```js
obj.setMode('Smooth',{duration: 1.0});
```

* `duration` — 移動にかける時間（秒）。デフォルトは`1.0`。

以下は2秒ごとに位置・回転・拡大率の目標値を切り替えるサンプル
です。値が一瞬で変わるのではなく、約1秒かけてなめらかに変化する
ことを確認してください。

<<< @/public/samples/smooth-box.js{js}

<A3Runner src="smooth-box.js" />

Smoothモードでは移動から速度が計算されるので、
[向きとアクションの自動制御](../AutoDirectionAndAction/)
（`setAutoDirection()`/`setAutoAction()`）も使えます。
ネットワーク越しに他のプレイヤーの位置が時々送られてくるような
アプリで、キャラクターをなめらかに動かすのにも便利です。
