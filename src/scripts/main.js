import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createEdge, getColorOfPoint } from './CreateGradientCube.js';
import { createLine } from './CreateLine.js';
import { bezierPointAtTime } from './BezierCurve.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );



const gui = new dat.GUI();

const options = {
    OrbitControl: false,
    t: 0,
    GroundTruth: false,
    EstimateBezier: false,
    n: 200,
    ShowLerps: false,
    EstimateBezierPoints: true,
    ShowVertices: true
};


let purpleHex = 0xbb00bb
let blueHex = 0x0000ff
let whiteHex = 0xffffff
let cyanHex = 0x00bbbb
let redHex = 0xff0000
let blackHex = 0x000000
let yellowHex = 0xbbbb00
let greenHex = 0x00ff00

let c000 = [-10, -10, -10]
let c100 = [10, -10, -10]
let c110 = [10, 10, -10]
let c010 = [-10, 10, -10]
let c001 = [-10, -10, 10]
let c101 = [10, -10, 10]
let c111 = [10, 10, 10]
let c011 = [-10, 10, 10]

const cubeCoords = [c000, c001, c010, c011, c100, c101, c110, c111]
const cubeHexes = [blueHex, blackHex, purpleHex, redHex, cyanHex, greenHex, whiteHex, yellowHex]

function VEC3FromCoord(coord) {
  return new THREE.Vector3(coord[0], coord[1], coord[2])
}

const cubeConfig = [
  {vertex: VEC3FromCoord(c000), color: blueHex, colorTHREE: new THREE.Color(blueHex)},
  {vertex: VEC3FromCoord(c100), color: cyanHex, colorTHREE: new THREE.Color(cyanHex)},
  {vertex: VEC3FromCoord(c110), color: whiteHex, colorTHREE: new THREE.Color(whiteHex)},
  {vertex: VEC3FromCoord(c010), color: purpleHex, colorTHREE: new THREE.Color(purpleHex)},
  {vertex: VEC3FromCoord(c001), color: blackHex, colorTHREE: new THREE.Color(blackHex)},
  {vertex: VEC3FromCoord(c101), color: greenHex, colorTHREE: new THREE.Color(greenHex)},
  {vertex: VEC3FromCoord(c111), color: yellowHex, colorTHREE: new THREE.Color(yellowHex)},
  {vertex: VEC3FromCoord(c011), color: redHex, colorTHREE: new THREE.Color(redHex)},
]

const squareEdges = []
const possibleNeighbors = [1, 2, 4]

function differByOneBit(num1, num2) {
  let xorResult = num1 ^ num2;
  return (xorResult & (xorResult - 1)) === 0 && xorResult !== 0;
}

for (let i = 0; i < 8; i += 1) {
  for (let j in possibleNeighbors) {
    let neighbor = i + possibleNeighbors[j]
    if (neighbor < 8 && differByOneBit(i, neighbor)) {
      squareEdges.push(createEdge(cubeCoords[i], cubeCoords[neighbor], new THREE.Color(cubeHexes[i]), new THREE.Color(cubeHexes[neighbor]), 'x'))
    }
  }
}

squareEdges.forEach(e => scene.add(e))


function getRandomInt(min, max) {
  return Math.floor(min + (max - min) * Math.random());
}

let draggableObjects = [];
const coords = [
  new THREE.Vector3( -8, 0, 2 ),
  new THREE.Vector3( -5, 8, 5 ),
  new THREE.Vector3( 7, 5, 4 ),
  new THREE.Vector3( 4, 0, 8 )
];

const curve = new THREE.CubicBezierCurve3(...coords);
let curveGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(100));
let material = new THREE.LineBasicMaterial({ color: 0xff0000 });
let curveObject = new THREE.Line(curveGeometry, material);
curveObject.visible = options.GroundTruth
scene.add(curveObject);



// Layer 1 Lerping

const lerpLayer1Coords = [
  coords[0],
  coords[1],
  coords[2]
]

const lerp1Geometry = new THREE.SphereGeometry(0.3, 10, 10);
const lerp1Material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const lerp1 = new THREE.Mesh(lerp1Geometry, lerp1Material);
lerp1.position.copy(coords[0]);
scene.add(lerp1);

const lerp2Geometry = new THREE.SphereGeometry(0.3, 10, 10);
const lerp2Material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const lerp2 = new THREE.Mesh(lerp2Geometry, lerp2Material);
lerp2.position.copy(coords[1]);
scene.add(lerp2);

const lerp3Geometry = new THREE.SphereGeometry(0.3, 10, 10);
const lerp3Material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const lerp3 = new THREE.Mesh(lerp3Geometry, lerp3Material);
lerp3.position.copy(coords[2]);
scene.add(lerp3);

function updateVertexOfLine(line, vertex, whichOne) {
  let positionAttribute = line.geometry.getAttribute('position')
  positionAttribute.setX(whichOne, vertex.x)
  positionAttribute.setY(whichOne, vertex.y)
  positionAttribute.setZ(whichOne, vertex.z)
  positionAttribute.needsUpdate = true
}

let line4 = createLine(coords[0], coords[1], 0xff00ff)
scene.add(line4)

let line5 = createLine(coords[1], coords[2], 0xff00ff)
scene.add(line5)

// Layer 2 lerping

const lerpLayer2Coords = [
  lerpLayer1Coords[0],
  lerpLayer1Coords[1],
]

const lerp4Geometry = new THREE.SphereGeometry(0.3, 10, 10);
const lerp4Material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const lerp4 = new THREE.Mesh(lerp4Geometry, lerp4Material);
lerp4.position.copy(lerpLayer1Coords[0]);
scene.add(lerp4);

const lerp5Geometry = new THREE.SphereGeometry(0.3, 10, 10);
const lerp5Material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const lerp5 = new THREE.Mesh(lerp5Geometry, lerp5Material);
lerp5.position.copy(lerpLayer1Coords[1]);
scene.add(lerp5);

let line6 = createLine(lerpLayer1Coords[0], lerpLayer1Coords[1], 0xfffff0)
scene.add(line6)

// Layer 3 lerping
const lerp6Geometry = new THREE.SphereGeometry(0.3, 10, 10);
const lerp6Material = new THREE.MeshBasicMaterial({ color: 0xf00f00 });
const lerp6 = new THREE.Mesh(lerp6Geometry, lerp6Material);
lerp6.position.copy(lerpLayer2Coords[0]);
scene.add(lerp6);

const lerpPoints = [lerp1, lerp2, lerp3, lerp4, lerp5, lerp6]
const lerpLines = [line4, line5, line6]

function toggleLerpVisibility(v) {
  lerpPoints.forEach(e => e.visible = v)
  lerpLines.forEach(e => e.visible = v)
}

toggleLerpVisibility(options.ShowLerps)

function updateLerpPositions() {
  lerp1.position.lerpVectors(coords[0], coords[1], options.t)
  lerp1.position.needsUpdate = true

  lerp2.position.lerpVectors(coords[1], coords[2], options.t)
  lerp2.position.needsUpdate = true

  lerp3.position.lerpVectors(coords[2], coords[3], options.t)
  lerp3.position.needsUpdate = true

  lerpLayer1Coords[0] = lerp1.position
  lerpLayer1Coords[1] = lerp2.position
  lerpLayer1Coords[2] = lerp3.position

  updateVertexOfLine(line4, lerp1.position, 0)
  updateVertexOfLine(line4, lerp2.position, 1)
  updateVertexOfLine(line5, lerp2.position, 0)
  updateVertexOfLine(line5, lerp3.position, 1)

  lerp4.position.lerpVectors(lerpLayer1Coords[0], lerpLayer1Coords[1], options.t)
  lerp4.position.needsUpdate = true

  lerp5.position.lerpVectors(lerpLayer1Coords[1], lerpLayer1Coords[2], options.t)
  lerp5.position.needsUpdate = true

  lerpLayer2Coords[0] = lerp4.position
  lerpLayer2Coords[1] = lerp5.position

  updateVertexOfLine(line6, lerp4.position, 0)
  updateVertexOfLine(line6, lerp5.position, 1)

  lerp6.position.lerpVectors(lerpLayer2Coords[0], lerpLayer2Coords[1], options.t)
  lerp6.position.needsUpdate = true
}

const draggableVertices = []
coords.forEach(coord => {
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.copy(coord);
  sphere.userData.limit = {
    min: new THREE.Vector3(-10, -10, -10),
    max: new THREE.Vector3(10, 10, 10)
  };
  sphere.userData.update = function(){
    sphere.position.clamp(sphere.userData.limit.min, sphere.userData.limit.max);
  }
  let distanceBasedColor = getColorOfPoint(cubeConfig, coord)
  sphere.material.color.setHex(distanceBasedColor)
  scene.add(sphere);
  draggableVertices.push(sphere)
  draggableObjects.push(sphere);
});


let line1 = createLine(coords[0], coords[1], 0xffffff)
scene.add(line1)

let line2 = createLine(coords[1], coords[2], 0xffffff)
scene.add(line2)

let line3 = createLine(coords[2], coords[3], 0xffffff)
scene.add(line3)

draggableVertices.push(line1)
draggableVertices.push(line2)
draggableVertices.push(line3)
function updateVisibilityOfDraggableVertices() {
  draggableVertices.forEach(e => e.visible = options.ShowVertices)
}

const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
dragControls.addEventListener('drag', function(event) {
  event.object.userData.update()
  const sphere = event.object;
  const index = draggableObjects.indexOf(sphere);
  let spherePos = sphere.position
  let distanceBasedColor = getColorOfPoint(cubeConfig, spherePos)
  sphere.material.color.setHex(distanceBasedColor)
  // coords[index] = spherePos
  if (index == 0) {
    // Change line1
    updateVertexOfLine(line1, spherePos, 0)
  } else if (index == 1) {
    updateVertexOfLine(line1, spherePos, 1)
    updateVertexOfLine(line2, spherePos, 0)
  } else if (index == 2) {
    updateVertexOfLine(line2, spherePos, 1)
    updateVertexOfLine(line3, spherePos, 0)
  } else if (index == 3) {
    updateVertexOfLine(line3, spherePos, 1)
  }
  updateLerpPositions()
  coords[index].copy(sphere.position);
  curve.updateArcLengths();
  curveGeometry.setFromPoints(curve.getPoints(100));
  renderer.render(scene, camera);
  reestimate()

});

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enabled = options.OrbitControl
// const pPointGeometry = new THREE.SphereGeometry(0.3, 10, 10);
// const pPointMaterial = new THREE.MeshBasicMaterial({ color: 0xf00f00 });
// const pPoint = new THREE.Mesh(pPointGeometry, pPointMaterial);
// pPoint.position.copy(coords[0]);
// scene.add(pPoint);



function generateBezierPointForNIntervals(n) {
  const positionsList = []
  for (let i = 0; i <= n; i += 1) {
    let tn = i / n
    
    const newPos = bezierPointAtTime(tn, coords)
    positionsList.push(newPos)
  }
  return positionsList
}

const approximateBezierMaterial = new THREE.LineBasicMaterial({
	color: 0x0000ff
});

let approximateBezierPoints = generateBezierPointForNIntervals(200)

let approxBezierPoints = []
for (let p in approximateBezierPoints) {
  
  let coord = approximateBezierPoints[p]
  let approxPointGeometry = new THREE.SphereGeometry(0.1, 10, 10);
  let approxPointMaterial = new THREE.MeshBasicMaterial({ color: getColorOfPoint(cubeConfig, coord) });
  let approxPoint = new THREE.Mesh(approxPointGeometry, approxPointMaterial);
  approxPoint.position.copy(coord)
  approxPoint.name = "BEZIER_APPROX_P" + p
  scene.add(approxPoint);
  approxBezierPoints.push(approxPoint)
}

function reGeneratePoints() {
  for (let p in approximateBezierPoints) {
    let coord = approximateBezierPoints[p]
    approxPointGeometry = new THREE.SphereGeometry(0.1, 10, 10);
    approxPointMaterial = new THREE.MeshBasicMaterial({ color: getColorOfPoint(cubeConfig, coord) });
    approxPoint = new THREE.Mesh(approxPointGeometry, approxPointMaterial);
    approxPoint.position.copy(coord)
    approxPoint.name = "BEZIER_APPROX_P" + p
    approxPoint.visible = options.EstimateBezierPoints
    scene.add(approxPoint);
    approxBezierPoints.push(approxPoint)
    
  }
}

function setEstimationPointsVisibility() {
  approxBezierPoints.forEach(e => e.visible = options.EstimateBezierPoints)
}


let approximateBezierGeometry = new THREE.BufferGeometry().setFromPoints( approximateBezierPoints );

let approximateBezierLine = new THREE.Line( approximateBezierGeometry, approximateBezierMaterial );
approximateBezierLine.name = "BEZIER_APPROX"
scene.add( approximateBezierLine );
approximateBezierLine.visible = options.EstimateBezier

function regenerateEstimationCurve() {
  approximateBezierGeometry = new THREE.BufferGeometry().setFromPoints( approximateBezierPoints );

  approximateBezierLine = new THREE.Line( approximateBezierGeometry, approximateBezierMaterial );
  approximateBezierLine.name = "BEZIER_APPROX"
  scene.add( approximateBezierLine );
  approximateBezierLine.visible = options.EstimateBezier

  animate()
}

function removeEstimationObjects() {
  // Remove old points
  for (let p in approximateBezierPoints) {
    let selectedObject = scene.getObjectByName("BEZIER_APPROX_P" + p)
    scene.remove(selectedObject)
  }

  // Remove old lines
  let selectedObject = scene.getObjectByName("BEZIER_APPROX")
  scene.remove(selectedObject)
}

function reestimate() {
  // Remove old points
  removeEstimationObjects()

  // regenerateEstimationCurve
  approximateBezierPoints = generateBezierPointForNIntervals(Math.ceil(options.n))


  regenerateEstimationCurve()
  reGeneratePoints()
}

const displayLerpsFolder = gui.addFolder("Lerps Display")
displayLerpsFolder.add(options, 'ShowLerps').name("Show Lerps").onChange(function (e) {
  toggleLerpVisibility(options.ShowLerps)
  if (options.ShowLerps) {
    updateLerpPositions()
  }
})

displayLerpsFolder.add(options, 't', 0.0, 1.0).onChange(function(e) {
  if (options.ShowLerps) {
    updateLerpPositions()
  }
})
displayLerpsFolder.open()

const estimateFolder = gui.addFolder("Estimates Display")
estimateFolder.add(options, 'n', 1, 200).onChange(function(e) {
  reestimate()
})
estimateFolder.add(options, 'EstimateBezier').name("Curve").onChange(function(e){
  approximateBezierLine.visible = options.EstimateBezier
});

estimateFolder.add(options, 'EstimateBezierPoints').name("Points").onChange(function(e){
  setEstimationPointsVisibility()
});
estimateFolder.open()

const controlsFolder = gui.addFolder("Controls")

controlsFolder.add(options, 'OrbitControl').name("Orbit Control").onChange(function(e){
    orbit.enabled = options.OrbitControl
}).listen();

controlsFolder.add(options, 'GroundTruth').name("Ground Truth").onChange(function(e){
  curveObject.visible = options.GroundTruth
});


controlsFolder.add(options, 'ShowVertices').name("Show Vertices").onChange(function(e){
  updateVisibilityOfDraggableVertices()
}).listen();

controlsFolder.open()





camera.position.set(0, 15, 40);
camera.lookAt(curveObject.position);


function animate() {
  requestAnimationFrame(animate);
  orbit.update()
  renderer.render(scene, camera);
}

animate();
