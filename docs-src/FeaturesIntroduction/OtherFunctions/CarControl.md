# CarControlクラス

`a3.CarControl`は本格的な車の物理シミュレーションを行うクラスです。
Rapier物理エンジンの`DynamicRayCastVehicleController`
（レイキャスト車両コントローラー）を使っていて、サスペンションの
伸び縮みやタイヤのグリップを含めた車の挙動を再現できます。
実際に遊べる例は
[カーレースサンプルプログラム](../../SamplePrograms/CarRace)を
参照してください。

## 使用例

`CarControl`は単体のオブジェクトではなく、`Acerola3D`や`GLTF`の
モデルに「組み込んで」使います。事前に`a3.initPhysics()`が
必要です。

```js
const kart = await new a3.Acerola3D('kart.a3').ready;
const cc = new a3.CarControl(options);
kart.setTransformer(cc.trans);              // 車体の動きを差し替え
kart.getAction('default').motion = cc.motion; // タイヤの動きを差し替え
kart.setState('default');
view.scene.add(kart);
```

`cc.trans`が車体（シャーシ）の位置・回転を物理演算で制御する
Transformerで、`cc.motion`がサスペンションに合わせてタイヤの
表示を動かすMotionです。

## 運転の操作

運転は毎フレーム、以下のメソッドを呼んで行います。

* `cc.accelerate(force)` — アクセル。正の値で前進、負の値で後退。
* `cc.steer(angle)` — ハンドル。前輪の切れ角（ラジアン）。
* `cc.brake(force)` — ブレーキ。
* `cc.reset(loc, quat)` — 指定した位置・向きに瞬間移動して速度を
  ゼロにします。コースアウトからの復帰などに使います。

## 自動走行のサンプル

5秒ごとに前進・後退を切り替えて自動走行するサンプルです。
オプション（`stk_kart`）でシャーシの寸法・タイヤの位置や半径・
サスペンションの特性などをモデルに合わせて設定しています。

<<< @/public/samples/carcontrol-auto.js{js}

<A3Runner src="carcontrol-auto.js" />

オプションを省略するとデフォルト値（シャーシ2×1×4mなど）が
使われます。全オプションは
[APIドキュメント](https://kenji0717.github.io/a3js/api/interfaces/CarControlOptions.html)を
参照してください。

## 注意点・コツ

* **スポーン位置は路面から少し浮かせる** — シャーシのコライダーが
  路面にめり込んだ状態で生成されると、貫通解消の力で勢いよく
  弾き飛ばされます。シャーシの底面が路面より確実に上になる高さから
  落として着地させてください。
* **質量は10kg程度がおすすめ** — RapierのDynamicRayCastVehicle
  Controllerは未完成なところがあり、質量が小さいとブレーキが
  うまく効きません。デフォルトの`mass`は`10.0`にしてあります。
* **空気抵抗（`aerodynamicDrag`）** — 空気抵抗がないと速度が
  いくらでも出てしまうため、速度の2乗に比例する空気抵抗を
  設定できます。ただし大きくすると挙動が不安定になることがある
  ため、デフォルトは`0`（無効）です。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/CarControl.html)を
参照してください。
