# 影を表示する方法

影の描画は処理が重いため、デフォルトではオフになっています。
影を表示するには、以下の4つの設定をすべて行う必要があります。

1. `view.setShadowMap(true);` — Viewの影の描画を有効にする
2. `light.setLightShadow(true,opt);` — ライトが影を作るようにする
3. `obj.setCastShadow(true);` — オブジェクトが影を**落す**ようにする
4. `field.setReceiveShadow(true);` — 床などが影を**受けて描画**する
   ようにする

どれか1つでも欠けると影は表示されません。以下のサンプルで
4つの設定がそろった状態を確認できます（ライトが動くのに合わせて
影も動きます）。

<<< @/public/samples/shadow-basic.js{js}

<A3Runner src="shadow-basic.js" />

## `View.setShadowMap()`

Viewのレンダラが影の計算（シャドーマップ）を行うようにします。
影を使うページ全体のスイッチです。なお、上のサンプルでは
ヘッドライトの光が影の表示の邪魔をしないようにヘッドライトを
消して、代わりに[StandardLights](../AboutLight/StandardLights)を
使っています。

## `ObjectA3.setLightShadow()`

ライトを含むオブジェクトに対して「このライトが影を作る」ことを
設定します。第2引数のオプションで、影の計算に使うカメラの範囲と
シャドーマップの解像度を指定できます。

* `left`/`right`/`top`/`bottom` — DirectionalLight（平行光）の場合の
  影を計算する範囲。デフォルトは±20。
* `angle` — SpotLightの場合の角度。デフォルトは`Math.PI/6`。
* `near`/`far` — 影を落とせる距離の範囲。デフォルトは0.1〜100。
* `shadowMapWidth`/`shadowMapHeight` — シャドーマップの解像度。
  デフォルトは1024×1024。

範囲を広くしたのに解像度がそのままだと影の輪郭が粗くなり、
解像度を上げると処理が重くなります。**影を計算する範囲は
必要最小限にするのがきれいで速い影のコツ**です（上のサンプルでは
±5に絞っています）。

範囲の調整には`light.setDebugMode(true);`が便利です。影の計算に
使われるカメラの範囲が表示されるので、「影が途中で切れる」ときは
この範囲からはみ出していないか確認してください（詳しくは
[その他の機能](../OtherFunctions/)）。

上のサンプルでもデバッグ表示をONにしてあります。表示される範囲と
影の関係をよく観察すると、ライトが動いて`near`の境界（範囲の
ライト側の面）がオブジェクトにかかったときに、影の表示が
影響を受ける様子もわかります。`left`/`right`/`top`/`bottom`
だけでなく`near`/`far`も影が正しく出る範囲を決めていることを
確認してみてください。

## `ObjectA3.setCastShadow()`

そのオブジェクトが**影を落す**ようにします。中に含まれる全ての
メッシュに設定が適用されます。

## `ObjectA3.setReceiveShadow()`

そのオブジェクトの表面に、他のオブジェクトの**影が描画される**
ようにします。地面や床、壁などに設定します。

なお、1つのオブジェクトに`setCastShadow(true)`と
`setReceiveShadow(true)`の両方を設定することもできます
（自分も影を落し、他の影も受ける）。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/ObjectA3.html)を
参照してください。
