# VRViewクラス

`a3.VRView`はヘッドマウントディスプレイ(HMD)へのVR表示を行う
3D表示クラスです。WebXRの"immersive-vr"セッションを使用します。
HTMLカスタム要素`<vr-view-a3>`として使用できます。

ページに追加すると「VRに入る」ボタンが自動的に`document.body`に
追加されます。要素自体は非表示で、表示はすべてVRデバイス側で
行われます。

## 使用例

<<< @/public/samples/vrview-basic.js{js}

<A3Runner src="vrview-basic.js" />

「実行」を押すと「VRに入る」ボタンが表示されますが、VRセッションを
開始できるのはWebXR対応のブラウザ・デバイス（HMDなど）だけです。
（このページ内の埋め込み実行がHMDのブラウザで正しく動作するかは
不明。動作しない場合は上記プログラムを単独のHTMLで実行して
ください。）

## 生成オプション

* `optionalFeatures` — XRセッションに要求するオプション機能の配列。
  デフォルトは`['local-floor']`です。
* `requiredFeatures` — XRセッションに必須の機能の配列。セッション
  開始時にこれらの機能が利用できない場合はエラーになります。
* `antialias` — アンチエイリアスを有効にするかどうか。
  デフォルトは`false`。
* `camera` — 使用するカメラ。省略時はデフォルトの`XRCamera`が
  使用されます。

```js
const view = new a3.VRView({optionalFeatures: ['local-floor','hand-tracking']});
```

VRコントローラーからの入力の取得方法などの詳しい使用方法は不明。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/classes/VRView.html)を
参照してください。
