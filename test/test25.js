// Html3Dのテスト。HTMLの要素を3D空間に入れられる。
// 最初KaTeXも対応させたかったけど、WebComponentの
// Shadow DOMの中に入れることにしたのであきらめた。
// KaTeX使いたい人そんなにいないだろうから。
import * as a3 from 'a3js';

const div = document.createElement('div');
div.innerHTML = `
<p>HTMLの要素: <span id="num">0</span></p>
`;
div.style='color:red;';

const view = new a3.Window(600,300);
const html = new a3.Html3D(div);
const span = div.querySelector('span');
view.scene.add(html);

let t = 0;
while (t<=6.28) {
  t += await view.waitForRender();
  html.setPosition(Math.cos(t),Math.sin(t),0);
  span.textContent = t.toFixed(2);
}

view.scene.remove(html);
