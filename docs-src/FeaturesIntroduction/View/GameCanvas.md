# GameCanvasクラス

`a3.GameCanvas`はゲーム向けのジョイスティックUIがついた
3D表示クラスです。HTMLカスタム要素`<game-canvas-a3>`として
使用できます。スマホでもPCでも同じプログラムで操作できるのが
特徴です。

* 画面左下に左ジョイスティック、右下に右ジョイスティックと
  L/Rボタンが表示されます。
* タッチ対応デバイスかどうかを自動判定し、PCではジョイスティックと
  ボタンは非表示になります。
* PCではW/A/S/Dキーが左ジョイスティック、矢印キーが
  右ジョイスティック、Spaceが左ボタン、Enterが右ボタンに対応します。

## 使用例

`a3.Canvas`と同じく、自分でページに追加して使います。

<<< @/public/samples/gamecanvas-joystick.js{js}

<A3Runner src="gamecanvas-joystick.js" />

このサンプルでは`touchDevice:true`を指定しているので、PCでも
ジョイスティックUIが表示され、マウスでドラッグして操作できます
（W/A/S/DキーやSpaceキーでも操作できます。キーが効かないときは
一度3D表示部分をクリックしてください）。

## 入力値の読み取り

ジョイスティックとボタンの状態はプロパティから読み取ります。
`waitForRender()`のループと組み合わせて毎フレーム参照するのが
基本の使い方です。

* `view.leftJoystick` / `view.rightJoystick` — `{x, y}`の形で、
  それぞれ-1〜1の値。中央が0、最大に倒すと±1です。
* `view.leftButton` / `view.rightButton` — 押されているとき`true`。
* `view.keys` — 現在押されているキーコードの集合(`Set`)。

## 生成オプション

* `touchDevice` — `true`でジョイスティックとボタンを表示します。
  省略時はタッチ対応デバイスかどうかで自動判定します。
* `width` / `height` — 要素の幅・高さをCSS文字列で指定します。
  デフォルトは`"600px"`と`"300px"`です。

```js
const view = new a3.GameCanvas({touchDevice:true,width:'1000px',height:'300px'});
```

## 全画面表示

ゲームでは全画面表示にしたいことが多いでしょう。全画面化は
ユーザーの操作をきっかけに行う必要があるので、`alert()`の
コールバックと組み合わせるのが便利です。

```js
await view.alert(`音声初期化、フルスクリーン、ゲームスタート。`, async ()=>{
  await a3.initSound();
  view.requestFullscreen();
});
```

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/GameCanvas.html)を
参照してください。
