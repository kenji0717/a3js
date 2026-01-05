/**
  * 3D空間内に配置されるオブジェクトやカメラを
  * まとめるインターフェース。Three.jsで言うところの
  * Object3Dに近い。
  */
export interface A3Transform {
  setLoc(x: number, y: number, z:number): void;
}
