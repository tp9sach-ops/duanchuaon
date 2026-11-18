// three.js GIẢ tối thiểu nhưng CÓ trạng thái (vị trí, xoay, tỉ lệ, cây cha-con) để test hình quái chạy hoạt ảnh thật. Dùng bởi tests/monstermodels.test.mjs (Phiên 232).
class V { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } setScalar(s) { return this.set(s, s, s); } copy(o) { return this.set(o.x, o.y, o.z); } }
export class Object3D { constructor() { this.position = new V(); this.rotation = new V(); this.scale = new V(1, 1, 1); this.children = []; this.visible = true; this.quaternion = {}; } add(...a) { for (const c of a) { c.parent = this; this.children.push(c); } return this; } clear() { this.children = []; return this; } }
export class Group extends Object3D {}
export class Mesh extends Object3D { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } }
const geom = (name) => class { constructor(...a) { this.type = name; this.args = a; } };
export const SphereGeometry = geom('Sphere'), CylinderGeometry = geom('Cylinder'), ConeGeometry = geom('Cone'), BoxGeometry = geom('Box'), DodecahedronGeometry = geom('Dodecahedron'), TorusGeometry = geom('Torus'), CircleGeometry = geom('Circle'), PlaneGeometry = geom('Plane'), RingGeometry = geom('Ring');
export class MeshStandardMaterial { constructor(o = {}) { Object.assign(this, o); this.color = { setHex: (h) => { this._c = h; } }; } }
export class MeshBasicMaterial extends MeshStandardMaterial {}
export const DoubleSide = 2, BackSide = 1;
