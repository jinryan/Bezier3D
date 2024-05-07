import * as THREE from 'three';

export function bezierPointAtTime(t, points) {
    let coeff = [
        (-Math.pow(t, 3) + 3 * Math.pow(t, 2) - 3 * t + 1),
        (3 * Math.pow(t, 3) - 6 * Math.pow(t, 2) + 3 * t),
        (-3 * Math.pow(t, 3) + 3 * Math.pow(t, 2)),
        Math.pow(t, 3)
    ]

    let finalP = new THREE.Vector3()
    for (let i in coeff) {
        finalP.addScaledVector(points[i], coeff[i])
    }

    return finalP
}