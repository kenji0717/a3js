import * as THREE from 'three';
import { A3 } from 'a3js';

const a3 = new A3();
const txt: string = a3.txt;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<p>${a3.txt}</p>`;
