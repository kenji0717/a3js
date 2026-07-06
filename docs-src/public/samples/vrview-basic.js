import * as a3 from 'a3js';

const view = new a3.VRView();
document.body.appendChild(view);
view.scene.add(new a3.SampleObject());
