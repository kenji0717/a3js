# ActionObjectについて

## ActionObjectとは

`ActionObject`は複数のアクション（アニメーション）を持つ
3Dオブジェクトの基底クラスです。3Dモデルファイルを読み込む
[GLTFクラス](./GLTF)と[Acerola3Dクラス](./Acerola3D)は、
このクラスを継承しています。

アクションは名前で管理されていて、`getActionNames()`で
一覧を取得できます。

モデルファイルの読み込みは非同期で行われるので、
`await obj.ready`で読み込み完了を待ってからシーンに追加します。

```js
const obj = await new a3.GLTF('/a3js/assets/RobotExpressive.glb').ready;
console.log(obj.getActionNames()); // アクション名の一覧を表示
view.scene.add(obj);
```

## StateとEmote

アクションの再生方法には2種類あります。

* `setState(name)` — アクションを**ループ再生**します。歩く・走る
  など、続けるアニメーションに使います。
* `setEmote(name)` — アクションを**一度だけ再生**します。再生が
  終わると`setState()`で設定していたアクションに自動的に戻ります。
  ジャンプ・手を振るなど、一回きりの動作に使います。

```js
obj.setState('Walking'); // 歩き続ける
obj.setEmote('Jump');    // 一度ジャンプして、歩きに戻る
```

以下のサンプルで動きを確認できます（3秒歩いた後にジャンプして、
また歩きに戻ります）。

<<< @/public/samples/gltf-robot.js{js}

<A3Runner src="gltf-robot.js" />

## [GLTFクラス](./GLTF)

glTF形式（`.glb`/`.gltf`）の3Dモデルを読み込むクラスです。

## [Acerola3Dクラス](./Acerola3D)

Acerola3D形式（`.a3`）のファイルを読み込むクラスです。

## Action・Figure・Motion

`ActionObject`が持つ1つ1つのアクションは`Action`クラスで
表されます。`Action`は以下の2つをセットで管理しています。

* `Figure` — 3Dモデルの形状（ルートの`Object3D`とボーン・
  スケルトン情報）。
* `Motion` — モーション（アニメーション）。再生位置や終了リスナー
  などを持ちます。

アクションは`getAction(name)`で取り出したり、`removeAction(name)`で
取り外したり、`addAction(name, action)`で別の名前で取り付けたり
できます。

```js
const action = obj.removeAction('Running');
obj.addAction('走る', action);
obj.setState('走る');
```

`Motion`の仕組みは、各種Jointなどを使った複雑な物理演算にも
利用できます。詳しくは
[複雑な物理シミュレーション](../Joint/)を参照してください。

また、移動速度に応じて止まる・歩く・走るのアクションを自動で
切り替える機能もあります。詳しくは
[向きとアクションの自動制御](../AutoDirectionAndAction/)を
参照してください。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/ActionObject.html)を
参照してください。
