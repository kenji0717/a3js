

ChatGPTによればVRMLで透過PNGをテクスチャに使う場合には
Materialを追加して`transparency 0`の設定をするべきという
ことだけど、`transparency 0`は不透明ということで、Three.jsの
VRMLLoaderは`transparency > 0`の時だけmaterial.transparent=trueの
設定をする。これがどこに影響するかわからないけど
`transparency >= 0`とするべきなのかもしれない。ただし、これだと
不透明な物にもmaterial.transparent=trueの設定をすることになる
かもしれない。でも実験した限りではtransparencyを設定しなければ
material.transparent=falseのままみたいだし、ChatGPTを信じるなら
`transparency >= 0`方が良い気もするけど、とりあえずは
VRMLの記述の方で`transparency 0.001`と書いておくことで
対処することにする。後でちゃんとVRMLの仕様を調べた方が良いと
思うけど、昔自分がBlenderからexportしたVRMLは無駄に`transparency 0`を
付けてるところが多いから`transparency >= 0`にすると処理が
無駄に重くなったりするかもしれない。でももし気がかわって
変えるならばVRMLLoader2.js.originalの方で言えば
`buildAppearanceNode( node )`関数内の1158行のところ。

それと、ChatGPTによればgeometryの設定で`solid FALSE`の設定を
して両面が描画されるようにし方が良いということだが、ちょっと
テストした感じではどちらでもかわらないっぽい。というか、
`solid TRUE`にしても両面から見えるのはOKなのか？ちゅうか
片面だけからしか見えない方がありがたいのだが。

-----

DEFとUSEの所が何かおかしいのはわかってたけど、ChatGPTと一緒に
原因をさぐったらImageTextureをDEFしてUSEした時だけおかしくなる
っぽいことが判明。DEFとUSEはnodeMapという辞書で管理されていて、
ImageTextureの場合DEFは処理されるけどUSEが処理されていないことが
わかった。さらに詳しく見ていくと`buildAppearanceNode( node )`関数
の中のswich文で`case 'texture':`の所で問題発見。textureNode.nameが
'ImageTexture'と'PixelTexture'の時しか処理されていない。ここで、
textureNode.USEに値が入ってる時はUSEなので、その時はgetNode()関数で
処理するという処理を追加。これで上手くいくようになった。
行数で言うと1181行目あたり。
