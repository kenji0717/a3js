// HTMLのテスト。やってみたかっただけ。
import * as a3 from 'a3js';
import katex from 'https://cdn.jsdelivr.net/npm/katex@0.16.28/+esm';

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css';
document.head.appendChild(link);

const div = document.createElement('div');
katex.render('E=mc^2',div,{throwOnError: false, displayMode: true});
div.style.color = 'white';

const view = new a3.Window(600,300);
const html = new a3.HTML(div);
view.scene.add(html);

let t = 0;
while (true) {
  await a3.asyncSleep(1000/60);
  html.setLocation(Math.cos(t),Math.sin(t),0);
  t += 0.01;
}

