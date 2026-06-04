
APIの心配ごと

* ObjectA3のsetTransformMode()をsetMode()に簡略化したくなった。
* CameraのsetHeadLightEnable()をsetHeadLight()に簡略化したくなった。

-----

StandardLightsのフィールドでirectionalLight?: THREE.DirectionalLight;
などがdeclareの宣言が必要な理由が難解だったので気をつけないと。

-----

* a3.Text3Dは手抜きすぎる。色、マテリアルを指定できるようにするべし。
* a3.SmoothTransformerのコンストラクタにもオプション引数を付けるべし。
* GLTFLoaderの読み込みでキャッシュを有効にするために
  `THREE.Cache.enabled = true;`を試してみたけど。ブラウザの
  コンソールにThree.jsのインスタンスが複数作られてる警告が
  出たので、a3js内部でやんないとダメからも。そして、
  これはネットワーク層のキャッシュっぽい
  のだが、自分でGLTFLoaderで読み込み来んだやつのキャッシュを
  Mapで作るとさらに良いかもしれない。その時は単純なclone()で
  なくて、SkeletonUtils.clone()でないとダメかも。

-----

setTransformMode('Smooth');
してみたらsetPosition()とかtranslate()が変かも
(game01.html)

-----

SmoothTransformer, BillboardTransformer, SmoothBillboardTransformerの
コンストラクタにオプション引数を追加してオプションのデフォルトも追加すべし。
追加したらObjectA3#setTransformModeにも対応すべし。そして
TransformModeには'User'モードも必要だと思う。

-----

Claudeに意見をもらってクラス名やメソッド名などを大幅に変更した。
互換性ないのでメジャーバージョンアップするべきところだけど、まだ
ネーミングには問題あるし、Vec3などを使い捨てない方向性のメソッド
追加したいし、テスト中だし・・・ということで0.0.Xを続ける。

-----

サウンドのループをどうするか迷い中。
setState()、setEmote()を使うことにしたので、
Acerola3Dのアクションのloop情報は意味を失ったけど、
サウンドのループにおいては、どのように処理するかを
決める上で使用するのが良さそう。まだ考えがまとまってない。

-----

「影」のこと考えてなかった。影の描写は基本的に、光源から深度
のみのレンダリングをして、その情報を使って本番レンダリングの
時に、色を調整するというアルゴリズム。光源が複数あれば、それぞれの
光源ごとにレンダリングしなきゃならないので重くなる。

影の描画を有効にするには、影を作る物体では`obj.castShadow=true;`、
影が落る物体では`obj.receiveShadow=true;`の設定がいる。
忘れがちなのが、`renderer.shadowMap.enabled=true;`の設定。
その次に忘れがちなのが、`light.castShadow=true;`。
影を落せる光源にはカメラが内蔵されているので、それの設定も
適切でないといけない。DirectionalLightだったら正射影カメラで、
どこでクリップするかの設定が必要。そして、その処理の重さは
シャドウマップの解像度がポイントで、Three.jsのAPIでは、
`light.shadow.mapSize.set(1024,1024);`という感じ。
その調整もできるようにしておきたい。

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

DynamicRayCastVehicleControllerのブレーキの実装が、
車体重量1kgから10kgぐらいでないと上手く動作しない
んじゃないかという疑惑。とりあえず、ここについては
深追いしないことにする。

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


やっぱりMotionをRootMotionとPoseMotionに分けることにした。
PoseMotionの方はChatGPTからアイデアをもらって、Pose
インターフェースという型を作って、それでポーズの情報を
受け渡しすればMixerから脱却できて、物理演算との統合も楽に
なりそうな感じ。だいぶ改変した後の状態だけど、ChatGPTからの
アイデアを、ここにメモ。

Poseインターフェースは以下。ここが抽象的な情報になって
いるところがポイントの一つ。

type Pose = Record<string,Transform>;
class Transform {
  loc: Vec3; quat: Quat; scale: Vec3;
}

次にPoseMotionインターフェースの大事なところは、

interface PoseMotion {
  update(dt: number): Pose;
}

ここが拡張性の要。PoseMotionにObject3Dとかを触らせずに
済ますのがポイント。これを実装するにあたり、AnimationClipの
中にあるKeyframeTrackにあるcreateInterpolant()の機能を使う
と良い。物理エンジンでもRigidBodyの値を使えばOK。

そして、Mixer使わなくても以下の関数書けばブレンドが可能。

function blendPose(a: Pose, b: Pose, weight: number): Pose;

Quatはslerpで、Vec3の方はlerp使えばOK。
作ったPoseをThree.jsに反映させるためには、
applyPoseToSkeleton(pose, skeleton)みたいな関数作って、
そのの中で

skeleton.bones[???].position.copy(...);

のような感じで全てのboneに対して繰り返し処理するだけ。

またブランチを作った`feature/motion2`。また大変だ。

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
