
DirectionalLight、PointLight、SpotLightを実装したけど、
VRMLとThree.jsでピッタリ整合性があるわけではないので、
色々ごまかした感じだけど、それなりに見れる感じには
なったと思う。どのへんごまかしたかはVRMLLoader2.jsの
コメントに残しておいた。

-----

もともとのVRMLLoaderにTextureTransformNodeに関するバグがあった。
VRMLLoader2.js.originalで言うと1509行目のrotationはnumber型でないと
いけないのに、THREE.Vector2型になってて`new Vector2()`が設定されて
いるけど、これは`0`だね。さらに1510行目のscaleの型がTHREE.Vector2型
なのはいいけど、初期値が「new Vector2()」だと(0,0)になるので、
「new Vector2(1,1)」が正解。

-----

VRMLファイルの中でIndexedFaceSetを使っているのに、
coord属性のところで、point属性が空のCoordinateが
指定されているものがあった。対処する義理はなさそうだけど、
buildGeometricNode()の中で簡単に対処できたのでやっといた。

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
透明にならない。

この問題に対処するために、読み込んだ画像にアルファチャンネルが
あって、さらにアルファ値が255未満のピクセルがある時は
無理やりmaterial.transparent=true;の設定をするプログラムを
追加した。位置はbuildAppearanceNode()関数の最後の方。
そのためにbuildImageTextureNode()関数の中の、実際に
画像を読み込む部分で細工をしておく必要があった。この辺は、
Three.jsの内部実装の部分に関係していると思うので、変更に
なったらまた別の対処が必要になるはず。そして、現段階では
上手くいく場合と、そうでない場合がある。DEFとUSEの問題かも
しれず、material.opaciityとかmaterial.alpha...とかかも
しれず、まだ調べられていない。

ちょっと処理として重くなりすぎるとも思ったけど、今のところ
動いてるので、そのまま使うことに

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
