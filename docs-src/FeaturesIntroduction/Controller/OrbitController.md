# OrbitControllerクラス

`a3.OrbitController`は、マウスやタッチで視点（カメラ）を操作する
コントローラーです。`Window`・`Canvas`・`GameCanvas`に
**デフォルトで設定されている**ので、何もしなくても以下の操作が
使えます。

* **左ドラッグ** — 注視点を中心にカメラを回転します。
* **左ドラッグ + Ctrlキー** — カメラを平行移動します。
* **マウスホイール** — カメラを前後にズームします。

コンストラクタの引数で注視点（回転の中心）を指定できます。
デフォルトは原点`(0,0,0)`です。

```js
// 注視点を(0,1,0)にする(キャラクターの顔の高さなど)
view.setController(new a3.OrbitController(0,1,0));
```

このページを含む各ページのサンプルの3D表示は、すべて
OrbitControllerでグリグリ動かせます（例えば
[はじめよう](../../GettingStarted)のサンプルで試してみて
ください）。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/OrbitController.html)を
参照してください。
