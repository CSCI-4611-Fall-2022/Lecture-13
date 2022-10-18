/* Lecture 13
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { GUI } from 'dat.gui'

export class MeshViewer extends gfx.GfxApp
{
    private cameraControls: gfx.OrbitControls;
    private box: gfx.BoxMesh;
    private morphMaterial: gfx.MorphMaterial;

    // GUI variables
    private wireframe: boolean;

    constructor()
    {
        super();

        this.cameraControls = new gfx.OrbitControls(this.camera);
        this.box = new gfx.BoxMesh(1, 1, 1);
        this.morphMaterial = new gfx.MorphMaterial();

        this.wireframe = false;
    }

    createScene(): void 
    {
        // Setup camera
        this.camera.setPerspectiveCamera(60, 1920/1080, 0.1, 5)
        this.cameraControls.setDistance(2);

        // Set a black background
        this.renderer.background.set(0, 0, 0);
        
        // Create an ambient light
        const ambientLight = new gfx.AmbientLight(new gfx.Color(0.25, 0.25, 0.25));
        this.scene.add(ambientLight);

        // Create a directional light
        const directionalLight = new gfx.DirectionalLight(new gfx.Color(0.5, 0.5, 0.5));
        directionalLight.position.set(1, 0.5, 2)
        this.scene.add(directionalLight);

        // Add an axes display to the scene
        const axes = new gfx.Axes3(4);
        this.scene.add(axes);

        // Add the box mesh to the scene
        this.box.material = this.morphMaterial;
        this.scene.add(this.box);

        // Create a simple GUI
        const gui = new GUI();
        gui.width = 200;

         // Create a GUI control for the debug mode and add a change event handler
         const debugController = gui.add(this, 'wireframe');
         debugController.name('Wireframe');
         debugController.onChange((value: boolean) => { this.morphMaterial.wireframe = value; });
 
    }

    update(deltaTime: number): void 
    {
        // Update the camera orbit controls
        this.cameraControls.update(deltaTime);
    }

    private tessellate(mesh: gfx.Mesh, iterations: number): void
    {
        const vArray = mesh.getVertices();
        const nArray = mesh.getNormals();

        const vertices: gfx.Vector3[] = [];
        const normals: gfx.Vector3[] = [];

        for(let i=0; i < vArray.length; i+=3)
        {
            vertices.push(new gfx.Vector3(vArray[i], vArray[i+1], vArray[i+2]));
            normals.push(new gfx.Vector3(nArray[i], nArray[i+1], nArray[i+2]));
        }

        
    }
}