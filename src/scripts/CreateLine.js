import * as THREE from 'three';

export function createLine(v1, v2, color) {
    const points = []
    points.push(v1)
    points.push(v2)
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const material = new THREE.LineBasicMaterial( { color: color } );
    const line = new THREE.Line( geometry, material );
    return line
}