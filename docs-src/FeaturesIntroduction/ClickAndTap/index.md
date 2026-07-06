# クリック(タップ)イベント処理

3Dのオブジェクトがクリック（スマホではタップ）されたときの処理を
書くことができます。方法は2つあります。

## `ObjectA3.setClickListener()`

一番簡単なのは、オブジェクトに`setClickListener()`でリスナーを
登録する方法です。以下のサンプルでは、オブジェクトをクリックすると
大きさが切り替わります。

<<< @/public/samples/click-object.js{js}

<A3Runner src="click-object.js" />

リスナーにはクリックされたオブジェクト自身が渡されます。
サウンドの初期化（`a3.initSound()`）のようにユーザー操作が必要な
処理をここで行うこともできます。

## Viewのclick3dイベント

もう1つは、Viewの`click3d`イベントを使う方法です。Viewは
HTML要素なので、通常のDOMイベントと同じように
`addEventListener()`で登録します。

```js
view.addEventListener('click3d',(e)=>{
  console.log(e.detail.value); // クリック位置にあるオブジェクトの配列
});
```

`e.detail.value`にはクリックされた位置にあるオブジェクト
（`ObjectA3`）の配列が入ります。手前のオブジェクトの後ろに
別のオブジェクトが重なっている場合もまとめて取得できるので、
「一番手前だけ」でない処理を書きたいときはこちらを使ってください。
