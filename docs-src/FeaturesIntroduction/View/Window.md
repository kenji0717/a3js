# Windowクラス

`a3.Window`はタイトルバー付きの浮動ウィンドウとして使用できる
3D表示クラスです。`new`するだけで自動的にページ
（`document.body`）に追加されるので、一番手軽に使い始められます。

* タイトルバーをドラッグして移動できます。
* ウィンドウの端をドラッグしてリサイズできます。
* 「×」ボタンで閉じることができます。

## 使用例

```js
const view = new a3.Window(600,300);
```

第1引数が幅、第2引数が高さ（ともにピクセル、デフォルトは600×300）です。

<<< @/public/samples/window-basic.js{js}

<A3Runner src="window-basic.js" />

## `alert()`と`prompt()`

ウィンドウ内にメッセージを表示するダイアログ機能があります。
ブラウザの`alert()`/`prompt()`と似ていますが、ウィンドウの内側に
表示され、`Promise`を返すので`await`で待てます。

```js
await view.alert('こんにちは');
const name = await view.prompt('名前を入力してください');
```

第2引数にはOKボタンがクリックされたときに呼ばれる関数を渡せます。
サウンドの初期化のように「ユーザーの操作をきっかけに実行する
必要がある処理」に便利です。

```js
await view.alert('音がなります。', a3.initSound);
```

## click3dイベント

3Dオブジェクトがクリック(タップ)されたときに`click3d`イベントが
発生します。詳しくは
[クリック(タップ)イベント処理](../ClickAndTap/)を参照してください。

```js
view.addEventListener('click3d',(e)=>{console.log(e.detail.value);});
```

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/Window.html)を
参照してください。
