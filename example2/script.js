import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/controls/OrbitControls.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
import { RhinoCompute } from 'https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js'

// reference the definition
const definitionName = 'rnd_node.gh'

const count_slider = document.getElementById( 'count' )
count_slider.addEventListener( 'input', onSliderChange, false )
const radius_slider = document.getElementById( 'radius' )
radius_slider.addEventListener( 'input', onSliderChange, false )

// listen for slider change events


// create a js object to hold some data to pass to RhinoCompute
let args = {
    algo: null,
    pointer: null,
    values: []
}

// create a few variables to store a reference to the rhino3dm library and to the loaded definition
let rhino, definition

rhino3dm().then(async m => {
    rhino = m

    // local 
    //RhinoCompute.url = 'http://localhost:8081/' // Rhino.Compute server url

    // remote
    RhinoCompute.url = 'https://macad2021.compute.rhino3d.com/'
    RhinoCompute.apiKey = getApiKey() // needed when calling a remote RhinoCompute server

    // source a .gh/.ghx file in the same directory
    let url = definitionName
    let res = await fetch(url)
    let buffer = await res.arrayBuffer()
    definition = new Uint8Array(buffer)

    init()
    compute()
    animate()
})

function compute() {

    // collect data

    // get slider values
    let count = document.getElementById('count').valueAsNumber
    let radius = document.getElementById('radius').valueAsNumber

    // format data
    let param1 = new RhinoCompute.Grasshopper.DataTree('RH_IN:radius')
    param1.append([0], [radius])
    let param2 = new RhinoCompute.Grasshopper.DataTree('RH_IN:count')
    param2.append([0], [count])

    // Add all params to an array
    let trees = []
    trees.push(param1)
    trees.push(param2)

    // Call RhinoCompute

    RhinoCompute.Grasshopper.evaluateDefinition(definition, trees).then(result => {

        // console.log(result) 

        // hide spinner
        document.getElementById('loader').style.display = 'none'

        // collect results
        let data = JSON.parse(result.values[0].InnerTree['{ 0; }'][0].data)
        let rhinoMesh = rhino.CommonObject.decode(data)
        
        // let mesh = rhino.DracoCompression.decompressBase64String(data)

        // convert from rhino3dm to threejs
        const loader = new THREE.BufferGeometryLoader()
        const geometry = loader.parse(rhinoMesh.toThreejsJSON())
        let material = new THREE.MeshNormalMaterial({side: 2})
        const threeMesh = new THREE.Mesh(geometry, material)

        // clear meshes from scene
        scene.traverse(child => {
            if(child.type === 'Mesh'){
                scene.remove(child);
            }
        })

        // add the mesh to the scene
        scene.add(threeMesh);

    })

}

function onSliderChange() {

    // show spinner
    document.getElementById('loader').style.display = 'block'

    compute()

}

function getApiKey() {
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

// BOILERPLATE //
// declare variables to store scene, camera, and renderer
let scene, camera, renderer

function init() {

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1, 1, 1)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.y = - 30

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    const controls = new OrbitControls(camera, renderer.domElement)

}

// function to continuously render the scene
function animate() {

    requestAnimationFrame(animate)
    renderer.render(scene, camera)

}