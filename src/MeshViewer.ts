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

        // Tessellate the box
        for(let i=0; i<4; i++)
            this.tessellate(this.box);

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

    private tessellate(mesh: gfx.Mesh): void
    {
        const vArray = mesh.getVertices();
        const nArray = mesh.getNormals();
        const indices = mesh.getIndices();

        const vertices: gfx.Vector3[] = [];
        const normals: gfx.Vector3[] = [];

        const newVertices: gfx.Vector3[] = [];
        const newNormals: gfx.Vector3[] = [];
        const newIndices: number[] = [];

        for(let i=0; i < vArray.length; i+=3)
        {
            vertices.push(new gfx.Vector3(vArray[i], vArray[i+1], vArray[i+2]));
            normals.push(new gfx.Vector3(nArray[i], nArray[i+1], nArray[i+2]));
        }

        for(let i=0; i < indices.length; i+=3)
        {
            // Get the index number of the new vertx
            const newIndex = newVertices.length;

            // Get all three vertices in the triangle
            const v1 = vertices[indices[i]];
            const v2 = vertices[indices[i+1]];
            const v3 = vertices[indices[i+2]];

            // Compute the midpoints along each edge
            const v1v2 = gfx.Vector3.add(v1, v2);
            v1v2.multiplyScalar(0.5);
            const v1v3 = gfx.Vector3.add(v1, v3);
            v1v3.multiplyScalar(0.5);
            const v2v3 = gfx.Vector3.add(v2, v3);
            v2v3.multiplyScalar(0.5);

            // Add all six vertices to the new vertex array
            newVertices.push(v1);
            newVertices.push(v2);
            newVertices.push(v3);
            newVertices.push(v1v2);
            newVertices.push(v1v3);
            newVertices.push(v2v3);

            // Get all three normals in the triangle
            const n1 = normals[indices[i]];
            const n2 = normals[indices[i+1]];
            const n3 = normals[indices[i+2]];

            // Compute the average normals along each edge
            const n1n2 = gfx.Vector3.add(n1, n2);
            n1n2.multiplyScalar(0.5);
            const n1n3 = gfx.Vector3.add(n1, n3);
            n1n3.multiplyScalar(0.5);
            const n2n3 = gfx.Vector3.add(n2, n3);
            n2n3.multiplyScalar(0.5);

            // Add all six normals to the new vertex array
            newNormals.push(n1);
            newNormals.push(n2);
            newNormals.push(n3);
            newNormals.push(n1n2);
            newNormals.push(n1n3);
            newNormals.push(n2n3);

            newIndices.push(newIndex, newIndex+3, newIndex+4);
            newIndices.push(newIndex+1, newIndex+5, newIndex+3);
            newIndices.push(newIndex+2, newIndex+4, newIndex+5);
            newIndices.push(newIndex+3, newIndex+5, newIndex+4);
        }

        mesh.setVertices(newVertices);
        mesh.setNormals(newNormals);
        mesh.setIndices(newIndices);
        mesh.createDefaultVertexColors();
    }
}