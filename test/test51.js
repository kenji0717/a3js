// ARのテスト
import * as a3 from 'a3js';

const view = new a3.ARView({requiredFeatures: ['hit-test']});
document.body.appendChild(view);
view.scene.add(new a3.SampleObject());
