// import libraries
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'

// declare variables to store scene, camera, and renderer
let scene, camera, renderer
const url = 'Rhino_Logo.3dm'

const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )

let rhino

rhino3dm().then(m => {
    rhino = m

    init()
    // animate()
})

// TODO: need to build new rhino3dm if we want to use await
// (async () => {
//     rhino = await rhino3dm()
//
//     init()
// })

// function to setup the scene, camera, renderer, and load 3d model
async function init () {

    // Rhino models are z-up, so set this as the default
    THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1,1,1)
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
    camera.position.y = - 30

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer( { antialias: true } )
    renderer.setSize( window.innerWidth, window.innerHeight )
    document.body.appendChild( renderer.domElement )

    // add some controls to orbit the camera
    const controls = new OrbitControls( camera, renderer.domElement );

    // add a directional light
    const directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.intensity = 2;
    scene.add( directionalLight );

    // load the model...

    // instead of relying solely on Rhino3dmLoader, we need to load the rhino model "manually" so
    // that we have access to the original rhino geometry
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const doc = rhino.File3dm.fromByteArray(new Uint8Array(buffer))

    // we can use Rhino3dmLoader.parse() to load the model into three.js for visualisation without
    // having to download it again
    loader.parse( buffer, function ( object ) {

        document.getElementById('loader').remove()
        scene.add( object )

        // TODO: make boolean button visible
    } )

    animate()
}

// function to continuously render the scene
function animate () {

    requestAnimationFrame( animate )
    renderer.render( scene, camera )

}

// TODO: add boolean button handler

// TODO: add download button handler
