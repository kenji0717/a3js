# SmoothBillboardモード

[Billboardモード](./Billboard)のなめらか版です。ターゲットの
方向を向き続けますが、向きの変化がなめらかに補間されます。

```js
obj.setMode('SmoothBillboard',{target: view.camera, duration: 1.0});
```

* `target` — 向き続ける対象のオブジェクト。
* `up` — 上方向ベクトル。省略時は`(0,1,0)`。
* `duration` — 補間時間（秒）。省略時は`1.0`。

以下はBillboardモード（左）とSmoothBillboardモード（右）の
比較サンプルです。赤い球（ターゲット）を2枚の画像が追いますが、
左は即座に向きが変わるのに対して、右は少し遅れてなめらかに
ついていきます。

<<< @/public/samples/smoothbillboard-compare.js{js}

<A3Runner src="smoothbillboard-compare.js" />

キャラクターが「プレイヤーの方をゆっくり振り向く」ような演出にも
使えます。
