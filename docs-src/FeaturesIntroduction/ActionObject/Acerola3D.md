# Acerola3Dクラス

`a3.Acerola3D`はAcerola3D形式（`.a3`）のファイルを読み込んで
表示するクラスです。

## Acerola3Dフォーマット

Acerola3D（`.a3`）は、VRMLの形状とBVHアニメーション、サウンド
などをZIP形式で1つにまとめた独自フォーマットです。CATALOG.XMLに
記述された複数のアクションを持ち、glTFと同じように`setState()`や
`setEmote()`でアニメーションを切り替えられます。

glTFと違う特徴として、アクションに以下のものを含められます。

* サウンド — アクションの再生に合わせて音を鳴らせます（足音など）。
  サウンドを含むモデルを使うときは、事前にサウンドの初期化が
  必要です。詳しくは[サウンドについて](../AboutSound/)を参照して
  ください。
* 背景テクスチャ・フォグ — シーンの背景（SkyBox）や霧を
  切り替えられます。SkyBoxの`.a3`ファイルをシーンに追加するだけで
  背景を設定できます。

```js
const sky = await new a3.Acerola3D('./SkyBox01.a3').ready;
view.scene.add(sky);
```

## 使用例

<<< @/public/samples/acerola3d-vesma.js{js}

<A3Runner src="acerola3d-vesma.js" />

読み込みは非同期なので`await obj.ready`で完了を待ちます。
アクション名の一覧は`getActionNames()`で取得できます（上の
サンプルではコンソールに出力しています）。

## [Acerola3Dのページ](https://kenji0717.github.io/acerola3d/)

Acerola3Dフォーマットの詳しい情報は
[Acerola3Dのページ](https://kenji0717.github.io/acerola3d/)を
参照してください。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/Acerola3D.html)を
参照してください。
