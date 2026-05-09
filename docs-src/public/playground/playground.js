// 以下、リサイズできる左右のパネルのためのコード

const resizer = document.querySelector('.resizer');
const leftPanel = document.querySelector('.left-panel');
const rightPanel = document.querySelector('.right-panel');

let isResizing = false;

resizer.addEventListener('mousedown', function(e) {
  isResizing = true;
  document.addEventListener('mousemove', resizePanels);
  document.addEventListener('mouseup', stopResizing);
});

function resizePanels(e) {
  if (!isResizing) return;

  // マウスの位置に応じて左パネルの幅を調整
  const containerRect = leftPanel.parentNode.getBoundingClientRect();
  const newLeftWidth = e.clientX - containerRect.left;

  // 最小幅をチェック
  if (newLeftWidth >= 100) {
    leftPanel.style.width = newLeftWidth + 'px';
  }
}

function stopResizing() {
  isResizing = false;
  document.removeEventListener('mousemove', resizePanels);
  document.removeEventListener('mouseup', stopResizing);
}

// リサイズできる左右のパネルのためのコード、以上

// ###########################################################

// 以下、CodeMirror 6のJavaScriptエディタを生成するコード

import { basicSetup, EditorView } from "codemirror/codemirror/dist/index.js"
import { javascript } from "codemirror/lang-javascript/dist/index.js"

const jsCode = `import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.SampleObject();
view.scene.add(obj);
`;

const view = new EditorView({
  doc: jsCode,
  extensions: [basicSetup, javascript()],
  parent: leftPanel
});

// CodeMirror 6のJavaScriptエディタを生成するコード、以上
