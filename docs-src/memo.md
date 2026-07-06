
2026,07/06: ドキュメントに必要なもの。

ドキュメントのサンプルプログラムでは`import * as a3 from 'a3js';`の
形式でインポートしてa3.Windowのような形で使用する形で書く。
可能なかぎり、各ページに1つサンプルプログラムを書いて、
「実行」ボタンで実行できるようにする。a3jsのクラスやインタフェース
についての解説ページには、API Documentのページへのリンクを張る。

以下のリストで「ファイル名.html（ページタイトル）」の形式で
書いてあるものは独立したページで、そこにぶら下がっている
項目はそのページに含めておくべき内容か、下の階層のページ。
「<https://...>: title」の形式の物はすでに作ってあるページ。

GettingStarted.htmlのページに書く4行のサンプルプログラムとは
以下のもの。

    import * as a3 from 'a3js';
    const view = new a3.Window(600,300);
    const obj = new a3.SampleObject();
    view.scene.add(obj);

### ドキュメントの内容

* index.html
    * a3jsの簡単な紹介
    * GettingStarted.html（はじめよう）
        + ページ内の4行のサンプルプログラムを「実行」ボタンで
          実行してみよう。
        + WindowとSampleObjectの4行サンプルの解説
        + WindowというViewにSceneやCameraが含まれている。
          Cameraにはヘッドライトがついている
        + a3.Canvas, a3.GameCanvas,などのa3.Viewの簡単な紹介と
          解説ページへのリンク
        + モードの解説
        + 移動、回転のサンプルへのリンク
        + 物理モードの解説と
        + playgroundを使って試す方法の解説
        + `<script type="importmap">`を用いたHTMLでの方法
            - CSSでデザインする方法
        + node.jsを使った方法
            - TypeScriptでの作成
    * <https://kenji0717.github.io/a3js/playground/index.html>: a3js Playground
    * <https://kenji0717.github.io/a3js/api/index.html>: API Document
    * FeaturesIntroduction.html（各種機能紹介）
        + View.html（3Dの表示形式）
            - Window.html（Windowクラス）
            - Canvas.html（Canvasクラス）
            - GameCanvas.html（GameCanvasクラス）
            - VRView.html（VRViewクラス）
            - ARView.html（ARViewクラス）
        + ActionObject.html（ActionObjectについて）
            + ActionObjectの解説
            + StateとEmoteの説明
            + GLTF.html（GLTFクラス）
                - glTF2.0フォーマットの簡単な解説
                - morphの扱い
            + Acerola3D.html（Acerola3Dクラス）
                - Acerola3Dフォーマットの簡単な解説
                - Acerola3Dのページの紹介: <https://kenji0717.github.io/acerola3d/>
            + ActionObject内のAction, Figure, Motionについて軽く触れる
        + SetMode.html（モードについて）
            - モードの簡単な解説
            - 物理演算について
            - Default.html（Defaultモード）
            - Smooth.html（Smoothモード）
            - Follow.html（Followモード）
            - Billboard.html（Billboardモード）
            - SmoothBillboard.html（SmoothBillboardモード）
            - SimplePhysics.html（SimplePhysicsモード）
            - KinematicCharacter.html（KinematicCharacterモード）
            - DynamicCharacter.html（DynamicCharacterモード）
        + MoveRotateScale.html（移動・回転・拡大縮小について）
            - モードによって移動などの効果が変化する件
            - 特に物理系のモードではsetPositionNow()などの
              Nowがついたメソッドで移動させる
        + AboutSound.html（サウンドについて）
            - サウンドの初期化が必要な理由
            - サウンドの初期化方法
            - サウンドの種類
            - Acerola3Dで'footfalls.a3'のサウンド再生サンプル
            - Sound.html（Sound）
        + Scene.html（Sceneの使用方法）
            - スタート画面、ゲームのメイン画面などの切り替え
        + AboutLight.html（ライトについて）
            - Cameraにはヘッドライトがついている。
            - StandardLights.html
            - Acerola3Dのライトについて
        + Controller.html（Controllerについて）
            - Controllerの説明
            - OrbitController.html（OrbitControllerクラス）
            - AvatarPositionController.html（AvatarPositionControllerクラス）
            - AvatarVelocityController.html（AvatarVelocityControllerクラス）
        + CollisionDetection.html（当たり判定）
            - ObjectA3のhandleCollision()メソッドを使う方法
            - SceneのsetCollisionListener()を使う方法
        + ClickAndTap.html（クリック(タップ)イベント処理）
            - 簡単なサンプルプログラム
        + Shadow.html（影を表示する方法）
            - view.setShadowMap(true);
            - light.setLightShadow(true,opt);
            - obj.setCastShadow(true);
            - field.setReceiveShadow(true);
        + AutoDirectionAndAction.html（向きとアクションの自動制御）
            - ObjectA3.setAutoDirection(true);
            - ActionObject.setAutoAction(true);
        + OtherFunctions.html（その他の機能）
            - プリミティブ
            - Text3D.html
            - ImagePlane.html
            - CarControl.html
            - Scene.setPhysicsDebugMode();
            - StandardLights.setDebugMode();
            - ObjectA3.add(obj);
        + Joint.html（複雑な物理シミュレーション）
            - 各種JointなどのConstraintを使う複雑な
              物理演算を使用したい場合、ActionObject内の
              Motionの仕組みを使う方法を推奨。
            - 将来は各種Jointを適用したシミュレーションを
              簡単にする方法を準備中
    * SamplePrograms.html（サンプルプログラム）
        + サンプルプログラムについて
        + CarRace.html（カーレースサンプルプログラム）
        + TPS.html（TPSのサンプルプログラム）

2026,07/06: ページへのサンプルプログラムの追加方法。

VitePressのMarkdown内の`<script>`タグはVue SFCのscriptブロックと
して解釈されるため、`<script type="importmap">`をページに直接
書くことはできない。そのため、importmap入りのHTMLをiframeの
srcdocに流し込んで実行するA3Runnerコンポーネントを用意した
（playgroundと同じ方式）。

関連ファイル:

* .vitepress/theme/index.js
    - A3Runnerコンポーネントをグローバル登録している。
* .vitepress/theme/components/A3Runner.vue
    - 「実行」「停止」ボタン付きのiframeコンポーネント。
      「実行」でpublic/samples/のサンプルをfetchし、
      importmap入りのHTMLテンプレートに埋め込んでsrcdocで実行する。
    - importmap（CDNのURLやバージョン）は
      public/playground/playground.jsのテンプレートと重複して
      いるので、変更するときは両方更新すること。
* public/samples/*.js
    - サンプルプログラムの置き場所。

各ページへのサンプルの追加手順:

1. サンプルプログラムをpublic/samples/にjsファイルとして置く。
   （例: public/samples/window-basic.js）
2. Markdownにソースコードを表示する。VitePressのスニペット機能で
   同じファイルをそのまま表示できる。

        <<< @/public/samples/window-basic.js{js}

3. 実行用のコンポーネントを書く。srcはpublic/samples/以下の
   ファイル名。heightは省略可（デフォルト345px）。

        <A3Runner src="window-basic.js" height="500" />

表示と実行が1つのjsファイルを共有するので、サンプルの修正は
両方に反映される。

動作確認は`npx vitepress dev docs-src`を起動して
`http://localhost:5173/a3js/`で行う。なお起動時にViteの依存
スキャンがplayground.jsのcodemirror import（importmapで解決
される前提のもの）を解決できない旨のエラーを出すが、ページの
表示・サンプル実行には影響しない。
