# 複雑な物理シミュレーション

## Motionの仕組みの利用（推奨）

物理エンジン(Rapier)には、剛体同士を「関節」でつなぐJoint
（RevoluteJoint・PrismaticJointなど）の機能があり、これを使うと
台車・振り子・ラグドールのような、複数の剛体が連動する複雑な
シミュレーションが作れます。

a3jsでこうした複雑な物理演算を使いたい場合は、
[ActionObject](../ActionObject/)の**Motionの仕組みを使う方法を
推奨**します。Motionは`addOneselfToPhysics()`/
`removeOneselfFromPhysics()`というメソッドを持っていて、
シーンへの追加・削除に合わせて複数のRigidBody・Collider・Jointを
物理ワールドへまとめて登録・解除できます。つまり「Jointでつながった
剛体の集まり」を1つのアクションとしてオブジェクトに閉じ込められる
ということです。

実装例はリポジトリの`test/test32.js`（プリミティブだけでJointを
使った台車を作る例）と`test/test33.js`（Acerola3Dの3Dモデルと
組み合わせた例）を参照してください。Rapierを直接操作するので、
[RapierのJavaScriptユーザーガイド](https://rapier.rs/docs/user_guides/javascript/joints)
の知識が必要です。

なお、[CarControlクラス](../OtherFunctions/CarControl)も内部では
この仕組み（車体のTransformerとタイヤのMotion）で実装されています。

## 将来の予定

現状の方法はRapierのAPIを直接使う必要があり、なかなか大変です。
将来は各種Jointを適用したシミュレーションをもっと簡単に作れる
方法を準備中です。
