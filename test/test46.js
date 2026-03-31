// Acerola3DのSkyBoxテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = await new a3.Acerola3D('./assets/SkyBox01.a3').ready;
view.scene.add(obj);
