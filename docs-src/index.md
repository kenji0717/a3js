
a3js docs
========================================

a3jsは、小学生から使いはじめられて、プログラミングが得意な
大学生でも簡単には飽きないレベルを目指しているTypeScript
(JavaScript)用の3DCGライブラリです。

```js
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.SampleObject();
view.scene.add(obj);
```

たった4行のプログラムで3Dのオブジェクトを表示できます。
PC、スマホ、タブレット、ヘッドマウントディスプレイ(HMD)の
ウェブブラウザ上で動作します。

[Three.js](https://threejs.org/)を基盤としており、3Dオブジェクトの
モードを切り替えることで、物理エンジン([Rapier](https://rapier.rs/))
を利用したシミュレーションも可能です。主にプログラミング教育での
利用を目的としていますが、3Dアプリのプロトタイプ作成にも利用できる
ようにしていきたいと思っています。

* [はじめよう](./GettingStarted.html) —
  上の4行のサンプルをブラウザで実行するところから始められます。
* [各種機能紹介](./FeaturesIntroduction/index.html) —
  a3jsの機能を分野ごとに紹介します。
* [サンプルプログラム](./SamplePrograms/index.html) —
  実際に遊べるゲームのサンプルと解説です。
* [API](./api/index.html){target="_self"} —
  全クラス・全メソッドのリファレンスです。
* [a3js Playground](./playground/index.html){target="_self"} —
  ブラウザだけでa3jsのプログラムを書いて試せます。
