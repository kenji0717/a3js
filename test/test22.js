// a3.ObjectA3のクリックリスナーテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.SampleObject();
obj.setClickListener(async (o)=>{
  alert('クリックされた！');
  console.log('ObjectA3: ',o);
  await a3.initSound(); // ChromeならOKっぽい
});
view.scene.add(obj);
