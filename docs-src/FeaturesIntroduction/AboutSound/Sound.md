# Soundクラス

`a3.Sound`は音声ファイルを読み込んで再生するクラスです。
`ObjectA3`を継承しているので、シーンや他のオブジェクトに
`add()`して3D空間内に配置します。

読み込みは非同期なので`await sound.ready`で完了を待ってから
`play()`を呼び出します。再生前に`a3.initSound()`による初期化が
必要です（[サウンドについて](./index)を参照）。

```js
const bgm = new a3.Sound('bgm.mp3', { loop: true });
await bgm.ready;
view.scene.add(bgm);
bgm.play();
```

再生は`play()`（再生中なら最初から再生し直します）、停止は
`stop()`です。

## 生成オプション

`new a3.Sound(file, options)`のオプションには以下のものがあります。

* `type` — サウンドの種類。`'audio'`または`'positional'`。
  デフォルトは`'audio'`。
* `autoplay` — `true`のとき、読み込み完了後に自動再生します。
  デフォルトは`false`。
* `loop` — `true`のとき、ループ再生します。デフォルトは`false`。
* `volume` — 音量。0.0〜1.0の範囲。デフォルトは`1.0`。
* `positional` — `'positional'`タイプのときの詳細オプション
  （後述）。

## positionalタイプのサンプル

`type: 'positional'`にすると、3D空間内の音源の位置とカメラ
（リスナー）の位置関係で音量や左右の定位が変化します。音源を
オブジェクトに`add()`すると、オブジェクトと一緒に音源も動きます。

<<< @/public/samples/sound-positional.js{js}

<A3Runner src="sound-positional.js" />

`positional`オプションで距離による減衰を調整できます。

* `refDistance` — 音量が基準値になる距離。これより近いと最大音量。
  デフォルトは`1`。
* `maxDistance` — 音が聞こえなくなる最大距離。デフォルトは`1000`。
* `rolloffFactor` — 距離による音量の減衰率。デフォルトは`1`。

## 指向性コーン（音の出る方向の限定）

`positional.directional`オプションで、音が出る方向を円錐（コーン）
状に限定できます。スピーカーやキャラクターの声のように、向いている
方向にだけ音を出したい場合に使います。

```js
const directional = { coneInnerAngle:30, coneOuterAngle: 90, coneOuterGain: 0.1 };
const opt = { type: 'positional', loop: true, positional: { directional } };
const sound = await new a3.Sound('/a3js/assets/maou_bgm_8bit29.ogg',opt).ready;
```

* `coneInnerAngle` — 内側コーン角度（度）。この範囲内では最大音量。
  デフォルトは`360`（全方向）。
* `coneOuterAngle` — 外側コーン角度（度）。デフォルトは`360`。
* `coneOuterGain` — 外側コーンの外での音量係数（0で無音）。
  デフォルトは`0`。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/Sound.html)を
参照してください。

（このページのサンプルのBGM: [魔王魂](https://maou.audio)）
