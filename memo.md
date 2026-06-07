
APIの心配ごと

* ObjectA3のsetTransformMode()をsetMode()に簡略化したくなった。
* CameraのsetHeadLightEnable()をsetHeadLight()に簡略化したくなった。

-----

StandardLightsのフィールドでirectionalLight?: THREE.DirectionalLight;
などがdeclareの宣言が必要な理由が難解だったので気をつけないと。

-----

* a3.Text3Dは手抜きすぎる。マテリアルを指定できるようにするべし。
* GLTFLoaderの読み込みでキャッシュを有効にするために
  自分でGLTFLoaderで読み込み来んだやつのキャッシュを
  Mapで作るとさらに良いかもしれない。その時は単純なclone()で
  なくて、SkeletonUtils.clone()でないとダメかも。

-----

モードが'Smooth','SmoothBillboard'の時の速度計算が変かも。

-----

サウンドのループをどうするか迷い中。
setState()、setEmote()を使うことにしたので、
Acerola3Dのアクションのloop情報は意味を失ったけど、
サウンドのループにおいては、どのように処理するかを
決める上で使用するのが良さそう。まだ考えがまとまってない。

-----

View.setShadowMap();ObjectA3.setLightShadow();ObjectA3.setReceiveShadow();
ObjectA3.setCastShadow();で「影」は付けれるようになったけど、
現在Lightのカメラのクリップ(描画範囲)と解像度を指定する方法が無い。
ObjectA3.setLightShadow(true,専用オプション);とするしかないかな？

DirectionalLightだったら正射影カメラで、
どこでクリップするかの設定が必要。そして、その処理の重さは
シャドウマップの解像度がポイントで、Three.jsのAPIでは、
`light.shadow.mapSize.set(1024,1024);`という感じ。

-----

「着せ替え」のことも考えてなかった。Acerola3Dだけの機能になるかな。
前は、どうやってたっけ？test/assets/A3/DressUp/の中が使えるか？

-----

RapierのユーザガイドにもDynamicRayCastVehicleControllerは
書いてないので、まだ未完成なところがあるんだと思う。ブレーキ
が上手く効かないし、計算誤差なのか少し揺れる。ブレーキの件は
車の質量を1kgから10kgぐらいにしておくことで、ちょうど良くなる
のでそうしておく。というかThree.jsのサンプルなどでも、車の
質量の設定をしてないっぽいので、そうするのが正解なのかもしれない
けど、質量は設定できるように準備だけはしておきたい。それと、
車に空気抵抗を付けてあげないと、いくらでもスピードが出るので、
速度の二乗に比例する空気抵抗の力をシャーシーに加えることにしたけど、
それをすると結構不安定になるので色々と工夫はしてある。でも、完璧に
安定にすることはできないので、空気抵抗のデフォルト値は0にして0の
時は空気抵抗の処理は全部スキップすることにしている。

RapierのDynamicRayCastVehicleControllerが改善されたら、余計な
部分は取り除きたいところ。

-----

### DynamicCharactorTransformerの手抜き箇所

DynamicCharactorTransformer.tsのisGroundedの処理において、
Rayを下に飛して地面の判定をしているのだけど、
castRayの6番目の引数は除外対象で自分自身のColliderを設定。
これ重要！第3引数のtrueは中空でないと仮定するもの。
だから最初から建物やドームの中にいる時にはバグるかも。
ChatGPTには、今のRayの前後左右にcapsuleRadius*0.6ぐらい
ずらした4箇所からも下にRayを飛して、さらに全てのRayについて
hitの中に入っているnormalを調べて、地面が急角度だったら
接地してないことにするという追加の処理を入れるように言われた
けど、面倒だからやってない。あと、たぶん真横から見ると浮いて
見えるかもしれない。微調整も必要だと思う。

-----

skeletonが入っていないのに、アニメーションがある
glTFファイルある(例えば`Parrot.glb`)。その他、
アニメーション情報の中にモーフィングの情報も入って
いて、これも扱わないといけないことも判明したし、
THREE.AnimationClipの中に入っていないのに並進移動を
(0,0,0)と仮定してはいけないとかあるので、下に書いて
あることには、少し変更が必要だった。その他、Skeleton
の中のboneInversesとかが何かも不明で理解できてない。
THREE.Object3D.updateMatrixWorld()とか、skeleton.update()
とかも不明。

----------------------------------------

Mixer使わなくても以下の関数書けばブレンドが可能。

function blendPose(a: Pose, b: Pose, weight: number): Pose;

Quatはslerpで、Vec3の方はlerp使えばOK。
作ったPoseをThree.jsに反映させるためには、
applyPoseToSkeleton(pose, skeleton)みたいな関数作って、
その中で

skeleton.bones[???].position.copy(...);

のような感じで全てのboneに対して繰り返し処理するだけ。

-----

* Motion
    + 独立して生成して気軽に取り替えられるようにする
    + AnimationClipのみをMotionに持たせて、それ以外は
      GLTFやAcerola3Dの方に持たせるというのが良さそう。
      そのためには、GLTFやAcerola3Dの方にskeleton由来の
      情報を持たせることになる。
    + controlMotion()
        - メソッド名がしっくりこない。
        - 引数をどうにかしたい
* AsyncInitRequiredを実装したObject3Dのオブジェクトに
  traverseでuserData['a3js'] = { objectA3: this };するの忘れそう。
  それとthis.motion.setObject(this);も同じく忘れそう。さらに、
  AsyncInitRequiredでない時の上の処理が無駄になる。
* Acerola3D.vrmlsやAcerola3D.bvhsに弱参照使えないか？
* Object3D.initDefaultPhysics()のメソッド名はもっと良いのがある気がする。

-----

### ObjectA3に追加したいメソッドメモ

* ラベル表示
    + setLabel
    + setLabelOffset スクリーン座標で
* 吹き出し表示
    + setSpeechBubble
    + setSpeechBubbleOffset
* 強調表示系
    + setSelected
    + (setSelected3D)
    + (emphasize,unemphasize)
    + (polygonize,unpoligonize)
    + (setVisible(boolean))

### Sceneに追加したいメソッドメモ

* アバター
    + setAvatar
* (背景)
    + (setBackground)

### Viewに追加したいメソッドメモ

* ピック
    + pick(rayを指定して)

-----

Rapierでは慣性モーメントは自動で計算されるっぽい。
TriMeshは例外、でもConvexHullはちゃんと計算してくれる
らしい。

-----

a3js.ControlModeの"physics"を、さらに分類した方が良いかも
しれない。あるいは、まったく独立した別の分類になるか？

RigidBodyの設定が3種類(Dynamic,Kinematic,Fixed)、
Colliderの設定が2種類(通常Collider、センサーCollider)。
組合せで6種類考えられるけど、あまり使わない組合せもある。
KinematicとFixedの違いがわからなかったけど、基本的には
Kinematicはメッチャ動かす、Fixedはめったに動かさないという差。
Fixedも動かせば動かせるけど、Fixedで「動く床」とか作ると
上にのってるキャラクタが上手く動かなかったりするんだと思う。
センサーColliderというのは、当たり判定はするけど、他の物を
押し返したりしなくて、すりぬけるので、チェックポイント
通過確認用とかに使う感じ。どう整理するか・・・

-----

`webgl_animation_skinning_morph.html`のコード見るとアクション(Action)の
扱いがかなりきめこまやかに書いてある。実装するかどうかは別として
メモしておく。

* アクションをstateとEmoteに分けている
    + stateの方は持続して再生されるアニメーション
    + Emoteはstateの再生中に1度だけ再生されるアニメーションで
      1度再生がすめば元のstateのアニメーションに戻る
        - それを実現するためにEmoteのアニメーションが終了した
          時にmixerから発生する'finished'イベントをリッスン
          している
* アクションの切り替えはスムーズにやってる
    + fadeToAction(name,duration)という関数で
      アニメーションの切り替えをスムーズにつなげている。
      そのためにpreviousActionとactiveActionを管理している
    + もともとアクションに色々な機能が付いてる
        - reset,setEffectiveTimeScale,setEffectiveWeight,
          fadeIn,play,fadeOut
* 1回だけ再生のアクションの場合、アクションのロパティで
  設定する。clampWhenFinished=true,loop=THREE.LoopOnce
* 前に気がついてたことだけど、アクションは複数同時に
  再生可能で、重みで合成されてるんだと思う。

少なくとも1回だけ再生のアクションの設定とかは実装しないとだめだな。
