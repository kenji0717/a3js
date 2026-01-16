
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
