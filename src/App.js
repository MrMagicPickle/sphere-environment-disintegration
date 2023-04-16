import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect } from 'react'
import { BufferAttribute } from 'three'

function DisintegrationMesh() {
  const geometryRef = useRef(null)
  const shaderRef = useRef(null)

  useEffect(() => {
    const count = geometryRef.current.attributes.position.count
    let randoms = new Float32Array(count)
    for (let i = 0; i < count; i += 3) {
      const r = Math.random()
      randoms[i] = r
      randoms[i + 1] = r
      randoms[i + 2] = r
    }
    geometryRef.current.setAttribute('aRandom', new BufferAttribute(randoms, 1))
  }, [])

  const uniforms = {
    uTime: {
      value: 0.0
    }
  }

  const vertexShader = `
    varying vec2 vUv;
    attribute float aRandom;
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
      float displacementFactor = 10.;
      vec3 offset = (aRandom * normal) * 2.;
      float sinValue = uTime * 0.5;
      vSinValue = sinValue;
      offset *= easeIn(abs(sin(sinValue))) * displacementFactor;

      vec3 finalPosition = position + offset;

      finalPosition = rotate(finalPosition, vec3(1., 1., 0.), (uTime * 0.5));
      vec4 modelViewPosition = modelViewMatrix * vec4(finalPosition, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `

  const fragmentShader = `
    varying vec2 vUv;
    uniform float uTime;
    varying float vSinValue;

    float easeIn(float k) {
      return pow(k, 10.);
    }

    void main() {
      float opacity = 1.;
      opacity -= easeIn(abs(sin(vSinValue))) ;
      gl_FragColor = vec4(vUv, 1., opacity);
    }
  `

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    shaderRef.current.uniforms.uTime.value = time
  })
  return (
    <>
      <mesh>
        <icosahedronGeometry ref={geometryRef} args={[1, 3]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          wireframe
          transparent
        />
      </mesh>
    </>
  )
}

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <DisintegrationMesh />
      <OrbitControls />
    </Canvas>
  )
}
