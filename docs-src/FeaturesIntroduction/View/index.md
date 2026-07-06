# 3Dの表示形式

a3jsで3Dを表示するクラスを「View」と呼びます。Viewには用途に
応じて以下の5種類があります。

* [Windowクラス](./Window) — タイトルバー付きの浮動ウィンドウ。
  `new`するだけで表示されるので一番手軽です。
* [Canvasクラス](./Canvas) — 自分でページに配置するHTML要素。
  CSSで自由にデザインできます。
* [GameCanvasクラス](./GameCanvas) — ジョイスティックUI付きの
  ゲーム向けView。スマホでもPCでも操作できます。
* [VRViewクラス](./VRView) — ヘッドマウントディスプレイ(HMD)での
  VR表示用のView。
* [ARViewクラス](./ARView) — スマートフォンなどでのAR表示用のView。

## Viewの共通機能

どのViewも共通の`View`インターフェースを実装しており、生成した
直後から表示できる状態で作られます。内部に以下のものを持っています。

* `view.scene` — 表示するオブジェクトを追加するシーン。
* `view.camera` — シーンを映すカメラ。初期位置は`(0, 0, 3)`で、
  ヘッドライトがついています。
* `view.controller` — 入力を処理するコントローラー。デフォルトは
  マウスやタッチで視点を回転できる`OrbitController`です。

共通のメソッドとして以下のものがあります。

* `replaceScene(newScene)` — 表示するシーンを切り替えます。
  スタート画面とゲーム画面の切り替えなどに使います。詳しくは
  [Sceneの使用方法](../Scene/)を参照してください。
* `setController(controller)` — コントローラーを切り替えます。
  詳しくは[Controllerについて](../Controller/)を参照してください。
* `waitForRender()` — 次のフレームが描画されるまで待ちます。
  ループと組み合わせてアニメーションを作るのに使います。
* `setShadowMap(true)` — 影の描画を有効にします。詳しくは
  [影を表示する方法](../Shadow/)を参照してください。
* `worldToScreen()`・`screenToWorld()`・`cameraToScreen()`・
  `screenToCamera()` — ワールド座標・カメラ座標と画面上の
  ピクセル座標を相互に変換します。

詳細は[APIドキュメント](https://kenji0717.github.io/a3js/api/interfaces/View.html)を
参照してください。
