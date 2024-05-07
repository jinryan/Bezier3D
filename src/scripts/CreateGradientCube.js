import * as THREE from 'three';

// Dim = x, y, z
// Color 1 and color2 has to be THREE.color
export function createEdge(vertex1, vertex2, color1, color2, dim) {

    const geometry = new THREE.BufferGeometry();

    // Define the vertices of the line
    const vertices = new Float32Array([...vertex1, ...vertex2]);

    // Define UV coordinates for the vertices
    const uvs = new Float32Array([
        0, 0,  // UV for the first vertex
        1, 0   // UV for the second vertex (gradient will be along the x-axis)
    ]);

    // Setting up vertex positions and UVs
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('customUV', new THREE.BufferAttribute(uvs, 2)); // Adding UV coordinates
    // Define your shader material
    const material2 = new THREE.ShaderMaterial({
        uniforms: {
            color1: { value: color1 },
            color2: { value: color2 }
        },
        vertexShader: `
            attribute vec2 customUV;
            varying vec2 vUv;

            void main() {
                vUv = customUV; // Pass UV to the fragment shader
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color1;
            uniform vec3 color2;
            varying vec2 vUv;

            void main() {
                gl_FragColor = vec4(mix(color1, color2, vUv.${dim}), 1.0);
                
            }
        `,
        wireframe: false
    });

    // Create the line using THREE.Line
    var line = new THREE.Line(geometry, material2);
    return line
}

// function distance(vertex1, vertex2) {
//     return Math.sqrt(Math.pow(vertex2[0] - vertex1[0], 2) + Math.pow(vertex2[1] - vertex1[1], 2) + Math.pow(vertex2[2] - vertex1[2], 2))
// }

function hexToRgb(hex) {
    return {
        r: (hex >> 16) & 0xFF,  // Extract the red component
        g: (hex >> 8) & 0xFF,   // Extract the green component
        b: hex & 0xFF           // Extract the blue component
    };
}

function rgbToHex(rgb) {
    return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
}


function interpolateColor(color1Hex, color2Hex, d) {
    let color1 = hexToRgb(color1Hex)
    let color2 = hexToRgb(color2Hex)

    let newColor = {
        r: Math.round(color1.r + (color2.r - color1.r) * d),
        g: Math.round(color1.g + (color2.g - color1.g) * d),
        b: Math.round(color1.b + (color2.b - color1.b) * d)
    };

    return rgbToHex(newColor)
}
function clamp(num, min, max) {
    return num <= min 
      ? min 
      : num >= max 
        ? max 
        : num
  }

  
export function getColorOfPoint(config, vertex) {
    let x = clamp((vertex.x + 10) / 20.0, 0, 1)

    let y = clamp((vertex.y + 10) / 20.0, 0, 1)
    let z = clamp((vertex.z + 10) / 20.0, 0, 1)
    let c00 = interpolateColor(config[0].color, config[1].color, x);
    let c01 = interpolateColor(config[3].color, config[2].color, x);
    let c10 = interpolateColor(config[4].color, config[5].color, x);
    let c11 = interpolateColor(config[7].color, config[6].color, x);
    let c0 = interpolateColor(c00, c01, y);
    let c1 = interpolateColor(c10, c11, y);

    // Interpolate along z
    let c = interpolateColor(c0, c1, z);
    return c

}