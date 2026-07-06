# Followモード

別のオブジェクトを**追従する**モードです。一番よく使うのは、
カメラをプレイヤーに追従させる使い方です（TPS視点）。

```js
view.camera.setMode('Follow',{target:player, lookFrom:{x:0,y:3,z:-5}});
```

* `target` — 追従する対象のオブジェクト。
* `lookFrom` — 対象から見た相対位置（対象をどこから見るか）。
  省略時は`{x:0, y:5, z:-10}`（後方上方）。
* `smoothness` — なめらかさ。0に近いほどすぐに追従し、1に近いほど
  ゆっくり追従します。0以上1未満で指定します。省略時は`0.9`。

以下は`lookFrom`に渡した`Vec3`を後から書き換えて、カメラの
視点をぐるぐる動かすサンプルです。`lookFrom`は「ターゲットから
見た相対位置」なので、ターゲットが動いてもカメラは同じ位置関係を
保ちます。

<<< @/public/samples/follow-camera.js{js}

<A3Runner src="follow-camera.js" />

カメラ以外にも使えます。例えばペットやドローンをプレイヤーに
ついてこさせるような使い方ができます。実戦的な使用例は
[カーレースサンプルプログラム](../../SamplePrograms/CarRace)や
[TPSのサンプルプログラム](../../SamplePrograms/TPS)を参照して
ください。
