# Billboardモード

常にターゲットの方向を**向き続ける**モードです。回転だけが自動制御
され、位置は`setPosition()`で自由に動かせます。

```js
obj.setMode('Billboard',{target: view.camera});
```

* `target` — 向き続ける対象のオブジェクト。通常はカメラを指定
  します。
* `up` — 上方向ベクトル。省略時は`(0,1,0)`。

「ビルボード（billboard）」は看板という意味で、3DCGでは
「常にカメラの方を向く平面」を指す定番のテクニックです。
平面の画像（[ImagePlaneクラス](../OtherFunctions/ImagePlane)）と
組み合わせて、木や群衆などを軽量に表示するのに使われます。

以下は動き回る画像を常にカメラの方に向かせるサンプルです。
マウスでカメラを動かしても、画像は常にこちらを向きます。

<<< @/public/samples/imageplane-billboard.js{js}

<A3Runner src="imageplane-billboard.js" />

向きの変化をなめらかにしたい場合は
[SmoothBillboardモード](./SmoothBillboard)を使ってください。
