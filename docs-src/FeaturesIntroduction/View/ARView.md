# ARViewクラス

`a3.ARView`はスマートフォンなどでのAR表示を行う3D表示クラスです。
WebXRの"immersive-ar"セッションを使用し、カメラ映像の上に
3Dオブジェクトが重畳表示されます。HTMLカスタム要素`<ar-view-a3>`
として使用できます。

ページに追加すると「ARに入る」ボタンが自動的に`document.body`に
追加されます。要素自体は非表示です。

## 使用例

<<< @/public/samples/arview-basic.js{js}

<A3Runner src="arview-basic.js" />

「実行」を押すと「ARに入る」ボタンが表示されますが、ARセッションを
開始できるのはWebXRのARに対応したブラウザ・デバイス
（ARCore対応のAndroid端末など）だけです。
（このページ内の埋め込み実行がAR対応端末で正しく動作するかは
不明。動作しない場合は上記プログラムを単独のHTMLで実行して
ください。）

## 生成オプション

* `optionalFeatures` — XRセッションに要求するオプション機能の配列。
  例: `['dom-overlay', 'light-estimation']`。デフォルトは
  `['local-floor']`です。
* `requiredFeatures` — XRセッションに必須の機能の配列。
  例: `['hit-test']`。セッション開始時にこれらの機能が利用できない
  場合はエラーになります。
* `antialias` — アンチエイリアスを有効にするかどうか。
  デフォルトは`false`。
* `camera` — 使用するカメラ。省略時はデフォルトの`XRCamera`が
  使用されます。

`hit-test`（現実の床や壁の検出）を要求した場合の検出結果の
取得方法は不明。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/ARView.html)を
参照してください。
