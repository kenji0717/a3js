
TransformMotionをTransformerに、PoseMotionをMotionに
改名する。CarMotionをCarControl。
後でgrepでチェックしよう。

-----

Acerola3Dを検討してみて、この構成をObjectA3に導入して
しまうのが良い気がしてきた。GLTFはActionが無いけど
むしろ同じActionが複数あるとすればすっきりする。そう
しないとPoseMotionのprepare3D()とcleanup3D()を撲滅
できない。2026,03/05: DONE。

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

* 場所回転の更新
    + addLocation
    + mulQuat
    + mulRotation デグリー
    + mulScale
* 一人称移動
    + moveForward
    + moveBack
    + moveRight
    + moveLeft
    + moveUp
    + moveDown
* 一人称回転
    + turnUp デグリー
    + turnDown デグリー
    + turnRight デグリー
    + turnLeft デグリー
    + rollRight デグリー
    + rollLeft デグリー
* ラベル表示
    + setLabel
    + setLabelOffset スクリーン座標で
* 吹き出し表示
    + setBalloon
    + setBalloonOffset
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
