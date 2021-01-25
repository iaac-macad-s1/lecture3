// import libraries
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
import { RhinoCompute } from 'https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js'

// declare variables to store scene, camera, and renderer
let scene, camera, renderer
// const url = 'Rhino_Logo.3dm'
const url = 'meshes.3dm'

const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )

let rhino, doc

const booleanButton = document.getElementById("booleanButton")
const downloadButton = document.getElementById("downloadButton")
booleanButton.onclick = boolean
downloadButton.onclick = download

const material = new THREE.MeshNormalMaterial()
material.opacity = 0.5
material.transparent = true

// load rhino3dm library
rhino3dm().then(m => {
    rhino = m
    init()
})

// function to setup the scene, camera, renderer, and load 3d model
async function init () {

    // Rhino models are z-up, so set this as the default
    THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1,1,1)
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
    camera.position.y = - 50

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
    doc = rhino.File3dm.fromByteArray(new Uint8Array(buffer))
    console.log(doc)

    // we can use Rhino3dmLoader.parse() to load the model into three.js for visualisation without
    // having to download it again
    loader.parse( buffer, function ( object ) {

        document.getElementById('loader').remove()

        object.traverse(function (child) {
            if (child.isMesh) {
                child.material = material
            }
        })
        scene.add( object )

        // enable boolean button
        booleanButton.disabled = false
    } )

    animate()
}

// function to continuously render the scene
function animate () {

    requestAnimationFrame( animate )
    renderer.render( scene, camera )

}

// boolean button handler
async function boolean () {
    RhinoCompute.url = 'http://macad2021.compute.rhino3d.com/'
    
    // ask user for api key (see getApiKey function...)
    RhinoCompute.apiKey = getApiKey()

    console.log(doc.objects().count)

    const meshes = []
    for (let i = 0; i < doc.objects().count; i++) {
        const mesh = doc.objects().get(i).geometry();
        if (mesh instanceof rhino.Mesh) {
            meshes.push(mesh)
        }
    }

    console.log(meshes)

    const res = await RhinoCompute.Mesh.createBooleanUnion(meshes)

    console.log(res)

    // clear scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    // clear doc
    doc.delete()

    // create new doc with unioned meshes
    doc = new rhino.File3dm()
    for (let i = 0; i < res.length; i++) {
        doc.objects().addMesh(rhino.CommonObject.decode(res[i]), null)
    }

    // load new doc into scene
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse( buffer, function ( object ) {

        object.traverse(function (child) {
            if (child.isMesh) {
                child.material = material
            }
        })
        scene.add( object )

        // enable download button
        downloadButton.disabled = false
    } )
}

// ask user for api key and cache in browser session so we don't need to keep asking
function getApiKey () {
    let auth = null
    auth = localStorage['compute_api_key']
    if (auth == null) {
        auth = window.prompt('RhinoCompute Server API Key')
        if (auth != null) {
            localStorage.setItem('compute_api_key', auth)
        }
    }
    return auth
}

// download button handler
function download () {
    let buffer = doc.toByteArray()
    saveByteArray("boolean.3dm", buffer)
}

function saveByteArray ( fileName, byte ) {
    let blob = new Blob([byte], {type: "application/octect-stream"})
    let link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = fileName
    link.click()
}
