# Canvasクラス

`a3.Canvas`は通常のHTML要素としてページに配置するタイプの
3D表示クラスです。HTMLカスタム要素`<canvas-a3>`として使用できます。
`a3.Window`と違って自動ではページに追加されないので、自分で
配置場所を決めます。そのぶんCSSでサイズ・位置・枠線などを自由に
デザインできます。

## 使用例

JavaScriptから生成してページに追加する方法と、HTMLにタグを書く
方法があります。

```js
// JavaScriptでの使用例
const view = new a3.Canvas();
view.style.cssText = 'width:600px;height:300px;';
document.body.appendChild(view);
```

```html
<!-- HTMLでの使用例 -->
<canvas-a3 style="width: 600px; height: 300px;"></canvas-a3>
```

以下は角丸の枠線をCSSでつけた例です。

<<< @/public/samples/canvas-basic.js{js}

<A3Runner src="canvas-basic.js" />

## 生成オプション

`new a3.Canvas(options)`のオプションには以下のものがあります。

* `antialias` — `true`にすると描画品質が上がりますが処理が
  重くなります。デフォルトは`false`。
* `transparent` — `true`にすると3Dキャンバスの背景が透明になり、
  ページの背景が透けて見えます。デフォルトは`false`。
* `camera` — 使用するカメラ。省略時はデフォルトの透視投影カメラが
  使用されます。

```js
const view = new a3.Canvas({antialias: true, transparent: true});
```

## `alert()`・`prompt()`・click3dイベント

[Windowクラス](./Window)と同様に、`alert()`/`prompt()`の
ダイアログ機能と`click3d`イベントが使えます。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/Canvas.html)を
参照してください。
