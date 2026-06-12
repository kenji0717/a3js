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
resizer.addEventListener('mouseleave', stopResizing);

function resizePanels(e) {
  if (!isResizing) return;

  // マウスの位置に応じて左パネルの幅を調整
  const containerRect = leftPanel.parentNode.getBoundingClientRect();
  const newLeftWidth = e.clientX - containerRect.left - resizer.getBoundingClientRect().width/2;

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

let dirty = false; // 編集されているか？
const editorDiv = document.querySelector('#editor_div');

const view = new EditorView({
  parent: editorDiv,
  doc: '',
  extensions: [
    basicSetup,
    javascript(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        dirty = true;
      }
    })
  ]
});

// CodeMirror 6のJavaScriptエディタを生成するコード、以上

// ###########################################################

// 以下、a3js Playgroundの機能実装のコード

const previewFrame = document.querySelector('#PreviewFrame');

const playPageTemplate = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>a3js Playground</title>
    <script type="importmap">
     {
       "imports": {
         "three": "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.min.js",
         "three/addons/": "https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/",
         "@dimforge/rapier3d-compat": "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.19.3/+esm",
         "fflate": "https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm",
         "meshoptimizer": "https://unpkg.com/meshoptimizer@1.0.1/meshopt_decoder.module.js",
         "a3js": "https://cdn.jsdelivr.net/npm/a3js@1/+esm"
       }
     }
    </script>
    <!-- "a3js": "https://cdn.jsdelivr.net/npm/a3js@latest/+esm" -->
  </head>
  <body>
    <script src="iframe.js"></script>
    <script type="module" src="THE_DATA_URL"></script>
  </body>
</html>

`;

let src = localStorage.getItem('a3js-playground');
if (!src) {
  src = `import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.SampleObject();
view.scene.add(obj);
`;
}

clearAndWriteToEditor(src);

// 保存ボタン
document.querySelector('#save_btn').addEventListener('click', async e=> {
  const src = view.state.doc.toString();
  const blob = new Blob([src], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = 'a3js.js';
  a.href = url;
  //document.body.appendChild(a);
  a.click();
  //document.body.removeChild(a);
  a.remove();
  URL.revokeObjectURL(url);
});

// 開くボタン
document.querySelector('#open_btn').addEventListener('click', async e=> {
  document.querySelector('#file_upload').click();
});
document.querySelector('#file_upload').addEventListener('change', async e=> {
  const f = document.querySelector('#file_upload').files[0];
  const fr = new FileReader();
  fr.addEventListener('load',function(e){
    clearAndWriteToEditor(fr.result);
  });
  fr.readAsText(f);
});

// 実行ボタン
document.querySelector('#play_btn').addEventListener('click',async e=>{
  document.querySelector('#console_pre').textContent = '';
  const input_pg = view.state.doc.toString();
  const data_url = await js2data_url(input_pg);
  const srcdoc = playPageTemplate.replace('THE_DATA_URL',data_url);
  previewFrame.setAttribute('srcdoc',srcdoc);
});

// 停止ボタン
document.querySelector('#stop_btn').addEventListener('click',e=>{
  const iframe = document.querySelector('#PreviewFrame');
  previewFrame.setAttribute('srcdoc','<!DOCTYPE html><html lang="ja"></html>');
});

// コンソールのクリアボタン
document.querySelector('#console_clear_btn').addEventListener('click',e=>{
  document.querySelector('#console_pre').textContent = '';
});

// JavaScriptのプログラム文字列をデータURLに変換する関数
async function js2data_url(js_program) {
  const blob = new Blob([js_program],{type:'text/javascript'});
  const data_url = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.addEventListener('load', (e) => {
      resolve(fr.result);
    });
    fr.readAsDataURL(blob);
  });
  return data_url;
}

// エディタにソースを書き込む
function clearAndWriteToEditor(src) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: src,
    }
  });
  dirty = false;
}

// ページのリロードや移動時に保存が必要だったらlocalStorageに保存
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    const src = view.state.doc.toString();
    localStorage.setItem('a3js-playground',src);
  }
});
