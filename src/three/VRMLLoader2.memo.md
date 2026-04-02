
DirectionalLight、PointLight、SpotLightを実装したけど、
VRMLとThree.jsでピッタリ整合性があるわけではないので、
色々ごまかした感じだけど、それなりに見れる感じには
なったと思う。どのへんごまかしたかはVRMLLoader2.jsの
コメントに残しておいた。

-----

VRMLのBackgroundノードにはtopUrlとかbottomUrlとかのプロパティ
で画像を指定することで6面のスカイボックスを実現する仕様になって
いるけど、もともとのVRMLLoader.jsは、その実装は省略されていた。
これを使いたかったので自分で実装してみたけど、上手くいった。
ただ、ここで指定する画像は縦横比が1で正方形でないといけないっぽい。
この制限は仕様書には書いてないみたいなのでもうひと手間加えた方が、
よいのかもしれないけど、力尽きた。

そして、もともとのVRMLLoader.jsにバグがあったようで、VRMLの
データにBackgroundノードが入っていてgroundColorで指定された色が
1色の時にエラーが発生する。keyColorの方のプログラムを参考に、
同じようにプログラムしたらエラーは取れたけど、表示はうまくいってない
これも改善した方が良いのだが力尽きた。気力が出たらやりたい
けど、優先順位は低いかな。

-----

仕様上VRMLで透過PNGをテクスチャに使う場合には
Materialを追加して`transparency 0`の設定をするべきという
ことだけど、`transparency 0`は不透明ということで、Three.jsの
VRMLLoaderは`transparency > 0`の時だけmaterial.transparent=trueの
設定をし、`transparency 0`の時は何もしなくてfalseになる。
この影響でVRMLの仕様通りに書くと透過PNGをテクスチャに使っても
透明にならない。だからと言ってVRMLLoaderの判定を
`transparency >= 0`とするとテクスチャを使わない透明でない
物も透明扱いになる可能性がある。特に、昔自分がBlenderから
exportしたVRMLは無駄に`transparency 0`を付けてるところが多い
から透明でないのに透明扱いになる所が多数出てくる。
その結果、透明扱いになると描画順序などに影響して変なことに
なるはず。

理想を言うとテクスチャにアルファチャンネルがあることを確認
するなどのプログラムを入れて対処するのが良いが、難しそう。

とりあえずはVRMLの記述の方で`transparency 0.001`と書いておくことで
対処することにする。

でももし、後でやる気が出た時にはbuildAppearanceNode()関数の最後
あたり(VRMLLoader2.js.originalで言うと10251行)にプログラムを追加
するのが良さそう。

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
