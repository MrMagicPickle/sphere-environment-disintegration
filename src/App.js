import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import { useEffect } from 'react'
import { BufferAttribute, SphereGeometry, Vector3 } from 'three'

/**
 * TODOs:
 * [] Load image, enlarge sphere and place image on sphere
 */
function MyBufferGeometry() {
  const scale = 1;
  const geom = new SphereGeometry(1 * scale, 32 * scale, 32 * scale).toNonIndexed();
  geom.scale(-1, 1, 1);
  const geometryRef = useRef(null)

  useEffect(() => {
    const count = geometryRef.current.attributes.position.count
    console.log(geometryRef.current, '<<');
    let randoms = new Float32Array(count)
    const centers = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 3) {
      const r = Math.random() * scale;
      randoms[i] = r
      randoms[i + 1] = r
      randoms[i + 2] = r

      const x1 = geometryRef.current.attributes.position.array[i * 3];
      const y1 = geometryRef.current.attributes.position.array[i * 3 + 1];
      const z1 = geometryRef.current.attributes.position.array[i * 3 + 2];

      const x2 = geometryRef.current.attributes.position.array[i * 3 + 3];
      const y2 = geometryRef.current.attributes.position.array[i * 3 + 4];
      const z2 = geometryRef.current.attributes.position.array[i * 3 + 5];

      const x3 = geometryRef.current.attributes.position.array[i * 3 + 6];
      const y3 = geometryRef.current.attributes.position.array[i * 3 + 7];
      const z3 = geometryRef.current.attributes.position.array[i * 3 + 8];

      const center = new Vector3(x1, y1, z1).add(new Vector3(x2, y2, z2)).add(
        new Vector3(x3, y3, z3)
      ).divideScalar(3);

      centers.set([center.x, center.y, center.z], i*3);
      centers.set([center.x, center.y, center.z], (i+1)*3);
      centers.set([center.x, center.y, center.z], (i+2)*3);
    }

    geometryRef.current.setAttribute('aRandom', new BufferAttribute(randoms, 1));
    geometryRef.current.setAttribute('aCenter', new BufferAttribute(centers, 3));
  }, []);

  return <primitive object={geom} ref={geometryRef}/>
}

function DisintegrationMesh() {
  const texture = useTexture('/env.jpg');

  const shaderRef = useRef(null)
  const uniforms = {
    uTime: {
      value: 0.0
    },
    uTexture: {
      value: texture,
    }
  }

  const vertexShader = `
    varying vec2 vUv;
    attribute float aRandom;
    attribute vec3 aCenter;
    uniform float uTime;
    varying float vSinValue;

    mat4 rotation3d(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;

      return mat4(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
        0.0,                                0.0,                                0.0,                                1.0
      );
    }

    vec3 rotate(vec3 v, vec3 axis, float angle) {
      return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
    }

    float easeIn(float k) {
      return pow(k, 5.);
    }

    void main() {
      vUv = uv;

      // As progress increases, our geom fades,
      // As progress decreases, our geom reconstructs.
      float progress = sin(uTime * .5);

      float prog = (position.y + 1.)/2.;
      float locprog = clamp((progress - 0.8*position.y)/0.2, 0., 1.);

      // Normalize by subtracting center
      vec3 finalPosition = (position - aCenter);

      // Move triangles
      finalPosition += 3.*normal * aRandom * locprog;

      // Invert position.
      // As locprog increases, the vertex positions will shrink to 0,
      // hiding the geometry
      finalPosition *= (1. - locprog);

      // Add center back to reform original geom shape
      finalPosition += aCenter;

      // Rotate triangles
      finalPosition = rotate(finalPosition, vec3(0., 1., 0.), aRandom * locprog * 3.14 * 3.);

      vec4 modelViewPosition = modelViewMatrix * vec4(finalPosition, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `

  const fragmentShader = `
    varying vec2 vUv;
    uniform float uTime;
    uniform sampler2D uTexture;
    varying float vSinValue;

    float easeIn(float k) {
      return pow(k, 10.);
    }

    void main() {
      float opacity = 1.;
      opacity -= easeIn(abs(sin(vSinValue))) ;

      vec4 color = texture2D(uTexture, vUv);
      // gl_FragColor = vec4(vUv, 1., 1.);
      gl_FragColor = vec4(1., 0., 0., 1.);
      // gl_FragColor = vec4(color.rgb, opacity);
      gl_FragColor = vec4(color);

    }
  `

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    shaderRef.current.uniforms.uTime.value = time
  })
  return (
    <>
      <mesh>
        <MyBufferGeometry/>
        <shaderMaterial
          ref={shaderRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>
    </>
  )
}

export default function App() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 3]
      }}
    >
      <ambientLight intensity={0.5} />
      <DisintegrationMesh />
      <OrbitControls />
    </Canvas>
  )
}
