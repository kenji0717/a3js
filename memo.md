

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
