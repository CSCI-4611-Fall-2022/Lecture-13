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
    private alpha: number;

    constructor()
    {
        super();

        this.cameraControls = new gfx.OrbitControls(this.camera);
        this.box = new gfx.BoxMesh(1, 1, 1);
        this.morphMaterial = new gfx.MorphMaterial();

        this.wireframe = false;
        this.alpha = 0;
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

        // Compute random colors at each corner of the box
        this.assignColors(this.box);

        // Subdivide all the triangles in the mesh
        for(let i=0; i<4; i++)
            this.tessellate(this.box);

        // Compute the morph vertices and normals
        this.computeMorphTarget(this.box);

        // Set the material properties
        this.morphMaterial.specularColor.set(1, 1, 1, 1);
        this.morphMaterial.shininess = 50;
        this.box.material = this.morphMaterial;

        // Add the box mesh to the scene
        this.scene.add(this.box);

        // Create a simple GUI
        const gui = new GUI();
        gui.width = 200;

         // Create a GUI control for the debug mode and add a change event handler
         const debugController = gui.add(this, 'wireframe');
         debugController.name('Wireframe');
         debugController.onChange((value: boolean) => { this.morphMaterial.wireframe = value; });
 
         const morphController = gui.add(this, 'alpha', 0, 1);
         morphController.name('Alpha');
         morphController.onChange((value: number) => { this.morphMaterial.morphAlpha = value; });
    }

    private assignColors(mesh: gfx.Mesh): void
    {
        const colors = mesh.getColors();

        for(let i=0; i < 6; i++)
        {
            colors[i*16] = 1;
            colors[i*16+1] = 0;
            colors[i*16+2] = 0;
            colors[i*16+3] = 1;

            colors[i*16+4] = 0;
            colors[i*16+5] = 1;
            colors[i*16+6] = 1;
            colors[i*16+7] = 1;

            colors[i*16+8] = 0;
            colors[i*16+9] = 0;
            colors[i*16+10] = 1;
            colors[i*16+11] = 1;

            colors[i*16+12] = 1;
            colors[i*16+13] = 1;
            colors[i*16+14] = 0;
            colors[i*16+15] = 1;
        }

        mesh.setColors(colors);
    }

    update(deltaTime: number): void 
    {
        // Update the camera orbit controls
        this.cameraControls.update(deltaTime);
    }

    private computeMorphTarget(mesh: gfx.Mesh): void
    {
        const vArray = mesh.getVertices();
        const nArray = mesh.getNormals();
        const indices = mesh.getIndices();

        const vertices: gfx.Vector3[] = [];
        const normals: gfx.Vector3[] = [];

        // Copy the vertices and normals into Vector3 arrays for convenience
        for(let i=0; i < vArray.length; i+=3)
        {
            vertices.push(new gfx.Vector3(vArray[i], vArray[i+1], vArray[i+2]));
            normals.push(new gfx.Vector3(nArray[i], nArray[i+1], nArray[i+2]));
        }

        const morphVertices: gfx.Vector3[] = [];
        const morphNormals: gfx.Vector3[] = [];

        for(let i=0; i < vertices.length; i++)
        {
            morphVertices.push(new gfx.Vector3(0, 0, 0));
            morphNormals.push(new gfx.Vector3(0, 0, 1));
        }

        for(let i=0; i < indices.length; i+=3)
        {
            // Get all three vertices in the triangle
            const v1 = vertices[indices[i]].clone();
            const v2 = vertices[indices[i+1]].clone();
            const v3 = vertices[indices[i+2]].clone();

            // Compute a random position within a sphere
            const translationQuat = gfx.Quaternion.makeEulerAngles(
                Math.random()*Math.PI*2,
                Math.random()*Math.PI*2,
                Math.random()*Math.PI*2)
            const position = gfx.Vector3.rotate(new gfx.Vector3(0, 0, Math.random()), translationQuat);
        
            // Compute another random triangle rotation
            const rotationQuat = gfx.Quaternion.makeEulerAngles(
                Math.random()*Math.PI*2,
                Math.random()*Math.PI*2,
                Math.random()*Math.PI*2);

            // Create a new triangle
            const mv1 = new gfx.Vector3(0, 0, 0);
            const mv2 = gfx.Vector3.subtract(v2, v1);
            const mv3 = gfx.Vector3.subtract(v3, v1);

            // Rotate the triangle to face in the random direction
            mv1.rotate(rotationQuat);
            mv2.rotate(rotationQuat);
            mv3.rotate(rotationQuat);

            // Move to the random position
            mv1.add(position);
            mv2.add(position);
            mv3.add(position);  

            morphVertices[indices[i]] = mv1;
            morphVertices[indices[i+1]] = mv2;
            morphVertices[indices[i+2]] = mv3;
        }

        mesh.setMorphTargetVertices(morphVertices);
        mesh.setMorphTargetNormals(morphNormals);
    }

    // This function subdivides each triangle in a mesh
    // Each triangle will reference three unique vertices
    // that will not be shared between triangles.
    private tessellate(mesh: gfx.Mesh): void
    {
        const vArray = mesh.getVertices();
        const nArray = mesh.getNormals();
        const cArray = mesh.getColors();
        const indices = mesh.getIndices();

        const vertices: gfx.Vector3[] = [];
        const normals: gfx.Vector3[] = [];
        const colors: gfx.Color[] = [];

        // Copy the vertices and normals into Vector3 arrays for convenience
        for(let i=0; i < vArray.length; i+=3)
        {
            vertices.push(new gfx.Vector3(vArray[i], vArray[i+1], vArray[i+2]));
            normals.push(new gfx.Vector3(nArray[i], nArray[i+1], nArray[i+2]));
        }

        // Copy the colors into Color arrays for convenience
        for(let i=0; i < cArray.length; i+=4)
        {
            colors.push(new gfx.Color(cArray[i], cArray[i+1], cArray[i+2], cArray[i+3]));
        }

        const newVertices: gfx.Vector3[] = [];
        const newNormals: gfx.Vector3[] = [];
        const newColors: gfx.Color[] = [];
        const newIndices: number[] = [];

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

            // Get all three normals in the triangle
            const n1 = normals[indices[i]].clone();
            const n2 = normals[indices[i+1]].clone();
            const n3 = normals[indices[i+2]].clone();

            // Compute the average normals along each edge
            const n1n2 = gfx.Vector3.add(n1, n2);
            n1n2.multiplyScalar(0.5);
            const n1n3 = gfx.Vector3.add(n1, n3);
            n1n3.multiplyScalar(0.5);
            const n2n3 = gfx.Vector3.add(n2, n3);
            n2n3.multiplyScalar(0.5);

            // Get all three colors in the triangle
            const c1 = colors[indices[i]];
            const c2 = colors[indices[i+1]];
            const c3 = colors[indices[i+2]];

            // Compute the average colors
            const c1c2 = gfx.Color.add(c1, c2);
            c1c2.multiplyScalar(0.5);
            const c1c3 = gfx.Color.add(c1, c3);
            c1c3.multiplyScalar(0.5);
            const c2c3 = gfx.Color.add(c2, c3);
            c2c3.multiplyScalar(0.5);

            // Top triangle
            newVertices.push(v1);
            newVertices.push(v1v2);
            newVertices.push(v1v3);
            newNormals.push(n1);
            newNormals.push(n1n2);
            newNormals.push(n1n3);
            newColors.push(c1);
            newColors.push(c1c2);
            newColors.push(c1c3);
            newIndices.push(newIndex, newIndex+1, newIndex+2);

            // Bottom right triangle
            newVertices.push(v1v2);
            newVertices.push(v2);
            newVertices.push(v2v3);
            newNormals.push(n1n2);
            newNormals.push(n2);
            newNormals.push(n2n3);
            newColors.push(c1c2);
            newColors.push(c2);
            newColors.push(c2c3);
            newIndices.push(newIndex+3, newIndex+4, newIndex+5);

            // Bottom left triangle
            newVertices.push(v1v3);
            newVertices.push(v2v3);
            newVertices.push(v3);
            newNormals.push(n1n3);
            newNormals.push(n2n3);
            newNormals.push(n3);
            newColors.push(c1c3);
            newColors.push(c2c3);
            newColors.push(c3);
            newIndices.push(newIndex+6, newIndex+7, newIndex+8);

            // Middle triangle
            newVertices.push(v1v3);
            newVertices.push(v1v2);
            newVertices.push(v2v3);
            newNormals.push(n1n3);
            newNormals.push(n1n2);
            newNormals.push(n2n3);
            newColors.push(c1c3);
            newColors.push(c1c2);
            newColors.push(c2c3);
            newIndices.push(newIndex+9, newIndex+10, newIndex+11);
        }

        mesh.setVertices(newVertices);
        mesh.setNormals(newNormals);
        mesh.setColors(newColors);
        mesh.setIndices(newIndices);
    }
}