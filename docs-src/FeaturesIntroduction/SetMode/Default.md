# Defaultモード

すべてのオブジェクトの初期モードです。`setPosition()`・
`setRotation()`・`setScale()`で指定した値が**即座に**反映されます。

```js
obj.setMode('Default'); // 他のモードから戻すとき
```

オプションはありません。

毎フレーム少しずつ値を変えれば、そのままアニメーションになります。
以下は`waitForRender()`のループで回転と位置を毎フレーム更新する
サンプルです。

<<< @/public/samples/rotate-box.js{js}

<A3Runner src="rotate-box.js" />

ゆっくり動かしたいだけなら、毎フレーム自分で計算する代わりに
[Smoothモード](./Smooth)を使う方法もあります。
