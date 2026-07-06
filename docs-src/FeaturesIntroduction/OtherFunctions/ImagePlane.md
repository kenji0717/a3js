# ImagePlaneクラス

`a3.ImagePlane`は3D空間に画像を表示するクラスです。
1×1の平面に指定した画像をテクスチャとして貼り付けて表示します。

```js
const img = new a3.ImagePlane('image.png');
view.scene.add(img);
```

平面のサイズは1×1固定なので、画像の縦横比に合わせたいときは
`setScale()`で調整してください。

```js
img.setScale(1.5,1,1); // 横長の画像に合わせる例
```

## Billboardモードとの組み合わせ

画像は平面なので、横から見ると見えなくなってしまいます。
[Billboardモード](../SetMode/Billboard)と組み合わせて常にカメラの
方を向かせると、どこから見ても画像が見えるようになります。
木や人物の看板のような使い方ができます。

<<< @/public/samples/imageplane-billboard.js{js}

<A3Runner src="imageplane-billboard.js" />

サンプルでは画像が3D空間をぐるぐる動き回りますが、Billboardモードの
おかげで常にこちらを向いています。マウスでカメラを動かして
確認してみてください。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/ImagePlane.html)を
参照してください。
