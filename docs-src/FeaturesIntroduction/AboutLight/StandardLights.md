# StandardLightsクラス

`a3.StandardLights`は、太陽光に相当する平行光
（`THREE.DirectionalLight`）と、全体を均一に照らす環境光
（`THREE.AmbientLight`）を組み合わせた、一番手軽なライトです。
シーンに追加するだけで自然な陰影がつきます。

```js
const lights = new a3.StandardLights();
view.scene.add(lights);
```

## 生成オプション

* `direction` — 平行光の光の方向ベクトル。デフォルトは
  `{x:-1, y:-1, z:-1}`（左上奥から差す光）。
* `colorDL` — 平行光の色。デフォルトは`0xffffff`。
* `intensityDL` — 平行光の強さ。デフォルトは`1.0`。
* `colorAL` — 環境光の色。デフォルトは`0xffffff`。
* `intensityAL` — 環境光の強さ。デフォルトは`0.4`。

以下は夕日っぽいオレンジの平行光と、青みがかった環境光を
組み合わせたサンプルです。ヘッドライトを消しているので、
ライトの色と向きの効果がよくわかります。

<<< @/public/samples/standardlights-basic.js{js}

<A3Runner src="standardlights-basic.js" />

## 影の設定

`setLightShadow(true,opt)`で平行光が影を作るようになります。
影の設定全般については[影を表示する方法](../Shadow/)を参照して
ください。影の計算範囲の確認には`setDebugMode(true)`が使えます。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/StandardLights.html)を
参照してください。
