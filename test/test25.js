// HTMLのテスト。HTMLの要素を3D空間に入れられる。
// 最初KaTeXも対応させたかったけど、WebComponentの
// Shadow DOMの中に入れることにしたのであきらめた。
// KaTeX使いたい人そんなにいないだろうから。
import * as a3 from 'a3js';

const template = document.createElement('template');
template.innerHTML = `
<div>
  <style>p {color:red;}</style>
  <p>HTMLの要素</p>
</div>
`;

const view = new a3.Window(600,300);
const html = new a3.HTML(template.content.firstElementChild);
view.scene.add(html);

let t = 0;
while (true) {
  await view.waitForRender();
  html.setLocation(Math.cos(t),Math.sin(t),0);
  t += 0.01;
}

