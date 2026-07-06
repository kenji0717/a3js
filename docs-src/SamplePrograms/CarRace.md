# カーレースサンプルプログラム

物理エンジンでカートを走らせて、制限時間60秒以内にゴールの
ブロックに触れるとクリアになるゲームです。

**<a href="../samples/CarRace.html" target="_blank">▶ カーレースを実行する</a>**
（ソースを見るにはページを開いてブラウザの「ページのソースを表示」を
使うか、リンク先を保存してください）

## 操作方法

* PC — W/A/S/Dキーでアクセルとハンドル、Spaceキーでブレーキ、
  Enterキーで位置のリセット。
* スマホ — 左ジョイスティックでアクセルとハンドル、「L」ボタンで
  ブレーキ、「R」ボタンで位置のリセット。

## このプログラムの特徴

### CarControlによるカートの走行

主役のカートは[Acerola3Dクラス](../FeaturesIntroduction/ActionObject/Acerola3D)の
モデル（`stk_tux.a3`）に
[CarControlクラス](../FeaturesIntroduction/OtherFunctions/CarControl)を
組み合わせて作っています。`CarControl`はRapierの
レイキャスト車両コントローラーを使った本格的な車の物理シミュレーションで、
シャーシの寸法・ホイールの位置や半径・サスペンションの硬さ・
空気抵抗などを細かく設定できます（プログラム冒頭の`stk_kart`が
その設定です）。

走行は毎フレーム、ジョイスティックの値を`CarControl`のメソッドに
渡すだけです。

```js
kart.carControl.steer(-0.2*view.leftJoystick.x);      // ハンドル
kart.carControl.accelerate(10*view.leftJoystick.y);   // アクセル
kart.carControl.brake(view.leftButton ? 1000.0 : 0.0); // ブレーキ
```

コースアウトしたときのために、`carControl.reset()`で位置と向きを
リセットできるようにしています。

### センサーによるゴール判定

コース（`stk_racetrack.a3`）は`SimplePhysics`モードの
`meshCollider: 'tri_mesh'`・`rigidBody: 'fixed'`で、形状通りの
固定の地形にしています。

ゴールのブロックは`collider: 'sensor'`という設定がポイントです。
センサーにすると物理的な衝突（跳ね返り）は起きず、通過したことだけが
[当たり判定](../FeaturesIntroduction/CollisionDetection/)の
`handleCollision()`に通知されます。

```js
class Goal extends GameAcerola3D {
  constructor() {
    super('../assets/ClearBlocks.a3','SimplePhysics',
          {rigidBody:'kinematic',collider:'sensor',collisionDetection:true});
  }
  handleCollision(obj, started, myPartNo, yourPartNo) {
    if (obj instanceof Kart) {
      this.touched = true; // ゴールしたことを記録
      se1.play();          // 効果音を鳴らす
    }
  }
}
```

### カメラの追従

メイン画面ではカメラを`Follow`モードにして、カートの後方斜め上
（`lookFrom`）から追いかけさせています。

```js
view.camera.setMode('Follow',{target:kart,lookFrom:lookFrom});
```

### そのほか

* 残り時間の表示はHTMLの要素（`<span id="time">`）に毎フレーム
  書き込んでいます。3D表示とふつうのHTML/CSSは自由に組み合わせられます。
* スタート画面などのタイトル文字は
  [Text3Dクラス](../FeaturesIntroduction/OtherFunctions/Text3D)で
  表示し、`turnUp()`でくるくる回しています。
* BGM・効果音: [魔王魂](https://maou.audio)
