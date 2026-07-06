# はじめよう

## 4行のサンプルプログラムの実行

以下の4行のプログラムで3Dのオブジェクトを表示できます。

<<< @/public/samples/window-basic.js{js}

「実行」ボタンを押すと下の枠内でこのプログラムが実行されます。

<A3Runner src="window-basic.js" />

## 4行サンプルの解説

上のサンプルプログラムを1行ずつ見ていきましょう。

```js
import * as a3 from 'a3js';
```

a3jsライブラリを`a3`という名前で読み込みます。以降、a3jsの
クラスや関数は`a3.Window`のように`a3.`をつけて使用します。

```js
const view = new a3.Window(600,300);
```

幅600ピクセル、高さ300ピクセルの3D表示用ウィンドウを作ります。
`a3.Window`はタイトルバー付きの浮動ウィンドウで、`new`するだけで
自動的にページに追加されます。タイトルバーをドラッグして移動、
端をドラッグしてリサイズ、「×」ボタンで閉じることができます。

```js
const obj = new a3.SampleObject();
```

動作確認用のサンプルオブジェクト（回転する緑の立方体）を作ります。

```js
view.scene.add(obj);
```

作ったオブジェクトをウィンドウのシーンに追加します。シーンに
追加されたオブジェクトが画面に表示されます。

## Windowの中のSceneとCamera

`a3.Window`は「View」と呼ばれる3D表示クラスの1つで、内部に
以下のものを持っています。

* `view.scene` — 表示するオブジェクトを追加するシーン
* `view.camera` — シーンを映すカメラ
* `view.controller` — マウスやタッチの入力を処理するコントローラー

カメラにはヘッドライト（カメラと一緒に動く光源）がついているため、
ライトを用意しなくてもオブジェクトが見えます。ヘッドライトは
`view.camera.setHeadLight(false);`で消すことができます。
ライトについて詳しくは[ライトについて](./FeaturesIntroduction/AboutLight/)を
参照してください。

カメラの位置は`view.camera.setPosition(0,0,10);`のように変更できます。

## いろいろなView

Viewには`a3.Window`の他にも以下のものがあります。

* [Windowクラス](./FeaturesIntroduction/View/Window) —
  タイトルバー付きの浮動ウィンドウ。`new`するだけで表示されるので
  手軽に始められます。
* [Canvasクラス](./FeaturesIntroduction/View/Canvas) —
  通常のHTML要素として自分でページに配置するタイプのView。
  CSSで自由にデザインできます。
* [GameCanvasクラス](./FeaturesIntroduction/View/GameCanvas) —
  スマートフォン向けのジョイスティックUIがついたView。
  PCではW/A/S/Dキーや矢印キーで操作できます。
* [VRViewクラス](./FeaturesIntroduction/View/VRView) —
  ヘッドマウントディスプレイ(HMD)でのVR表示用のView。
* [ARViewクラス](./FeaturesIntroduction/View/ARView) —
  スマートフォンなどでのAR表示用のView。

詳しくは[3Dの表示形式](./FeaturesIntroduction/View/)を参照してください。

## モードの紹介

a3jsのオブジェクトは`setMode()`で「モード」を切り替えることで、
位置・回転・拡大率の制御方法を変更できます。

```js
obj.setMode('SimplePhysics');
```

モードには以下の8種類があります。

* `Default` — 位置・回転・拡大率を即座に反映します（初期モード）。
* `Smooth` — 約1秒かけてなめらかに補間しながら移動します。
* `Follow` — 別のオブジェクトを追従します。カメラをプレイヤーに
  追従させるときなどに使います。
* `Billboard` — 常にターゲット（通常はカメラ）の方向を向きます。
* `SmoothBillboard` — なめらかにターゲット方向を向きます。
* `SimplePhysics` — 物理エンジン(Rapier)による剛体物理演算で動きます。
* `KinematicCharacter` — カプセルコライダーによるキネマティック
  キャラクター制御を使います。
* `DynamicCharacter` — カプセルコライダーによる動的キャラクター
  制御を使います。

詳しくは[モードについて](./FeaturesIntroduction/SetMode/)を参照してください。

## 移動と回転のサンプル

`setPosition()`で移動、`setRotation()`で回転ができます。
回転の角度は度(°)で指定します。以下は青い箱を回転させながら
左右に往復させるサンプルです。

<<< @/public/samples/rotate-box.js{js}

<A3Runner src="rotate-box.js" />

`view.waitForRender()`は次の描画タイミングまで待つメソッドで、
このようにループと組み合わせてアニメーションを作れます。

移動・回転・拡大縮小について詳しくは
[移動・回転・拡大縮小について](./FeaturesIntroduction/MoveRotateScale/)を
参照してください。

## 物理モードの紹介

`SimplePhysics`などの物理系のモードを使うと、重力や衝突などの
物理演算でオブジェクトを動かせます。物理系のモードを使う前には
`await a3.initPhysics();`で物理エンジンを初期化する必要があります。

以下は固定した床(`rigidBody: 'fixed'`)の上に箱を落とすサンプルです。

<<< @/public/samples/physics-box.js{js}

<A3Runner src="physics-box.js" />

物理系のモードでは`setPosition()`ではなく、`setPositionNow()`の
ようにNowがついたメソッドで位置や回転を強制的に変更します。

詳しくは[SimplePhysicsモード](./FeaturesIntroduction/SetMode/SimplePhysics)を
参照してください。

## a3js Playgroundでの実行

ブラウザだけでa3jsのプログラムを書いて試せる
[a3js Playground](https://kenji0717.github.io/a3js/playground/index.html)を
用意しています。

* 左側のエディタにプログラムを書いて「実行」ボタンで実行、
  「停止」ボタンで停止できます。
* `console.log()`の出力やエラーはエディタ下のConsoleに表示されます。
* 「保存」ボタンでプログラムをファイルとしてダウンロード、
  「開く」ボタンでファイルを読み込めます。
* 編集中のプログラムはページを離れるときにブラウザに自動保存され、
  次に開いたときに復元されます。

## HTMLファイルでの利用（importmap）

自分のウェブページにa3jsのプログラムを組み込むには、importmapで
a3jsと依存ライブラリのCDNのURLを指定します。以下のHTMLファイルを
作ってブラウザで開くだけで、最初の4行のサンプルが動きます。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>a3js sample</title>
    <script type="importmap">
     {
       "imports": {
         "three": "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.min.js",
         "three/addons/": "https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/",
         "@dimforge/rapier3d-compat": "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.19.3/+esm",
         "fflate": "https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm",
         "meshoptimizer": "https://unpkg.com/meshoptimizer@1.0.1/meshopt_decoder.module.js",
         "a3js": "https://cdn.jsdelivr.net/npm/a3js@1/+esm"
       }
     }
    </script>
  </head>
  <body>
    <script type="module">
     import * as a3 from 'a3js';

     const view = new a3.Window(600,300);
     const obj = new a3.SampleObject();
     view.scene.add(obj);
    </script>
  </body>
</html>
```

### CSSでのデザイン

ページのデザインに合わせて3D表示を配置したい場合は、
`a3.Window`の代わりに`a3.Canvas`を使います。`a3.Canvas`は
通常のHTML要素（カスタム要素`<canvas-a3>`）なので、CSSで
サイズや位置を自由に指定でき、ページへの追加も自分で行います。

```js
import * as a3 from 'a3js';

const view = new a3.Canvas();
view.style.cssText = 'width:600px;height:300px;border:solid 1px;';
document.body.appendChild(view);
const obj = new a3.SampleObject();
view.scene.add(obj);
```

## node.jsでの利用

node.jsがインストールされていれば、[Vite](https://ja.vite.dev/)などの
開発ツールと組み合わせて使うこともできます。a3jsは
[npm](https://www.npmjs.com/package/a3js)で公開されています。

```sh
npm create vite@latest myapp -- --template vanilla
cd myapp
npm install
npm install a3js three @dimforge/rapier3d-compat fflate
```

`src/main.js`（テンプレートによっては`main.js`）の内容を以下に
置き換えます。

```js
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.SampleObject();
view.scene.add(obj);
```

開発サーバーを起動してブラウザで表示を確認します。

```sh
npm run dev
```

three.jsなどの依存ライブラリの推奨バージョンの組み合わせは不明。

### TypeScriptでの利用

a3jsには型定義ファイルが含まれているので、TypeScriptからも
そのまま使用できます。Viteのテンプレートに`vanilla-ts`を指定すると
TypeScriptのプロジェクトが作られます。

```sh
npm create vite@latest myapp -- --template vanilla-ts
```

あとはJavaScriptの場合と同じで、`src/main.ts`にプログラムを書きます。
`import * as a3 from 'a3js';`とすれば、エディタで補完や型チェックが
効くようになります。
