# GLTFクラス

`a3.GLTF`はglTF形式の3Dモデルを読み込み、表示・アニメーション
再生するクラスです。

## glTF2.0フォーマット

glTF2.0はKhronos Groupが策定した3Dモデルの標準フォーマットで、
「3DのJPEG」とも呼ばれます。Blenderなどの多くの3Dツールから
出力でき、インターネット上で配布されているモデルも豊富です。
ファイルには2つの形式があります。

* `.glb` — 1つのファイルにすべてをまとめたバイナリ形式。
  配布・読み込みに便利なのでこちらが主流です。
* `.gltf` — JSONテキスト形式。テクスチャなどが別ファイルに
  なることがあります。

`a3.GLTF`はDRACO・KTX2・Meshoptの各圧縮形式にも対応しています。

## 使用例

glTFファイルにアニメーションが含まれている場合、各アニメーション名が
自動的にアクション名として登録されます。読み込みは非同期なので
`await obj.ready`で完了を待ちます。

<<< @/public/samples/gltf-robot.js{js}

<A3Runner src="gltf-robot.js" />

アクション名の一覧は`getActionNames()`で取得できます（上の
サンプルではコンソールに出力しています）。アクションの切り替え方法
（`setState()`/`setEmote()`）は
[ActionObjectについて](./index)を参照してください。

## morphの扱い

glTFのモデルにはモーフターゲット（表情や形状の変化）が含まれて
いることがあります。モーフ名の一覧は`getMorphNames()`で取得でき、
`setMorph(name, value)`で0〜1の値を設定します。

モーションがモーフの値を使っている場合、`setMorph()`で設定した
値がモーションに上書きされてしまうことがあります。
`setMorphsOverwrite(true)`を呼んでおくと、モーションによる
上書きを防いで自分で設定した値を維持できます。

```js
const obj = await new a3.GLTF('/a3js/assets/RobotExpressive.glb').ready;
console.log(obj.getMorphNames());
obj.setMorphsOverwrite(true);
obj.setMorph('Head_4.Surprised',1); // 驚いた表情にする
```

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/GLTF.html)を
参照してください。
