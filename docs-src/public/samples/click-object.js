import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.SampleObject();

// オブジェクトがクリック(タップ)されたときの処理を登録
let big = false;
obj.setClickListener((o)=>{
  console.log('クリックされた！');
  big = !big;
  const s = big ? 1.5 : 1.0;
  o.setScale(s,s,s);
});

view.scene.add(obj);
