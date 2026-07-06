# Text3Dクラス

`a3.Text3D`は3D空間に立体的な文字を表示するクラスです。
ゲームのタイトルやスコア表示などに使えます。

## フォントの初期化

`Text3D`を使う前に、`a3.initFont()`でフォントを読み込んでおく
必要があります。フォントを初期化せずに`Text3D`を作ると、
代わりに赤いボックスが表示されます。

```js
await a3.initFont('/a3js/assets/M-PLUS-1_Bold.json.zip');
```

フォントファイルは、TTFファイルを
[facetype.js](https://gero3.github.io/facetype.js/)で変換した
three.js用のJSONファイルです。日本語フォントのようにファイルが
大きくなる場合は、JSONをZIP圧縮したファイル（`.json.zip`）も
そのまま使用できます（例: `zip abcdefg.json.zip abcdefg.json`）。

## 使用例

```js
const text = new a3.Text3D("日本語もOK",{color:0xff0000});
view.scene.add(text);
```

第1引数が表示する文字列、第2引数のオプションで色を数値
（`0xff0000`のような16進数）で指定できます。

<<< @/public/samples/text3d-hello.js{js}

<A3Runner src="text3d-hello.js" />

サンプルの`turnUp(1.0)`は毎フレーム1度ずつ上方向の軸で回転させる
メソッドで、タイトル文字をくるくる回す演出によく使えます
（[カーレースサンプルプログラム](../../SamplePrograms/CarRace)の
タイトル画面でも使っています）。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/Text3D.html)を
参照してください。
