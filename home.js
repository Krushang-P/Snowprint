import {Color, MeshBasicMaterial, OrthographicCamera, Scene, WebGLRenderer} from "three";
import {STLExporter} from "STLExporter";
import {Pen} from "pen";
import {rand, srand} from "prng";

// INITIALIZATION

let downloader = document.createElement("a");
let date = document.getElementById("date");
let patternElement = document.getElementById("pattern");
let shapeElement = document.getElementById("shape");
let curvatureElement = document.getElementById("curvature");
let curveAtElement = document.getElementById("curveAt");
let branchesElement = document.getElementById("branches");
let subbranchesElement = document.getElementById("subbranches");
let angleElement = document.getElementById("angle");
let canvas = document.getElementById("canvas");

let blackMaterial = new MeshBasicMaterial({color: 0x000000});
let whiteMaterial = new MeshBasicMaterial({color: 0xffffff});
let exporter = new STLExporter();
let renderer = new WebGLRenderer({canvas: canvas, alpha: true, antialias: true, preserveDrawingBuffer: true});
let scene = new Scene();
let pen = new Pen(0, 0, 90, 2, 2, null, null, null, whiteMaterial, scene);
let zoom = 10;
let camera = new OrthographicCamera(canvas.width / -zoom, canvas.width / zoom, canvas.height / zoom, canvas.height / -zoom, 0, 1);
camera.position.set(0, 0, pen.depth);

// Snowflake parameters that are not Pen fields
let patternParam, branchesParam, subbranchesParam, angleParam, radiusParam = canvas.width / zoom;

date.valueAsDate = new Date();
handleDateChange();

// EVENTS

date.addEventListener("change", handleDateChange);

document.getElementById("vary").addEventListener("click", (event) => {
	angleElement.value = angleParam = (angleParam + 5) % 180;
	createSnowflake();
});

// Export the snowflake to a binary STL file (instead of an ASCII STL file to save space)
document.getElementById("exportSTL").addEventListener("click", (event) => {
	downloader.href = URL.createObjectURL(new Blob([exporter.parse(scene, {binary: true})], {type: "application/octet-stream"}));
	downloader.download = exportFilename("stl");
	downloader.click();
});

// Export the snowflake to a PNG file but make it black (because laser software wants it black)
document.getElementById("exportPNG").addEventListener("click", (event) => {
	pen.material = blackMaterial;
	createSnowflake();

	canvas.toBlob((blob) => {
		downloader.href = URL.createObjectURL(blob);
		downloader.download = exportFilename("png");
		downloader.click();
	}, {type: "image/png"});

	pen.material = whiteMaterial;
	createSnowflake();
});

patternElement    .addEventListener("input", (event) => {patternParam     = event.target.selectedIndex; createSnowflake();});
shapeElement      .addEventListener("input", (event) => {pen.shape        = event.target.selectedIndex; createSnowflake();});
curvatureElement  .addEventListener("input", (event) => {pen.curvature    = Number(event.target.value); createSnowflake();});
curveAtElement    .addEventListener("input", (event) => {pen.curveAt      = Number(event.target.value); createSnowflake();});
branchesElement   .addEventListener("input", (event) => {branchesParam    = Number(event.target.value); createSnowflake();});
subbranchesElement.addEventListener("input", (event) => {subbranchesParam = Number(event.target.value); createSnowflake();});
angleElement      .addEventListener("input", (event) => {angleParam       = Number(event.target.value); createSnowflake();});

// MISCELLANEOUS

// Return an export filename: a String like "date20230318variant60.snowprint." with the String <extension> appended
function exportFilename(extension) {
	return "date".concat(
		date.valueAsDate.toISOString().substring(0, 10).replace(/-/g, ""),
		"variant",
		angleParam,
		".snowprint.",
		extension);
}

function handleDateChange() {
	let year = date.valueAsDate.getUTCFullYear();
	let month = date.valueAsDate.getUTCMonth() + 1;
	let day = date.valueAsDate.getUTCDate();

	srand(10000 * year + 100 * month + day);

	// Randomize these first because others depend on them
	patternElement.selectedIndex = patternParam = rand(0, 3, 1);
	shapeElement.selectedIndex = pen.shape = rand(0, 1, 1);

	curvatureElement.value = pen.curvature = pen.shape == Pen.triangle ? rand(0, 1, 0.0625) : rand(-0.5, 0.5, 0.0625);
	curveAtElement.value = pen.curveAt = rand(0, 1, 0.0625);
	branchesElement.value = branchesParam = rand(5, 12, 1);
	subbranchesElement.value = subbranchesParam = patternParam == 0 ? rand(1, 8, 1) : rand(1, 4, 1);
	angleElement.value = angleParam = rand(30, 150, 5);

	createSnowflake();
}

// Clear <scene> by removing its meshes after disposing of their geometries and materials
function clear(scene) {
	while (scene.children.length > 0) {
		scene.children[0].geometry.dispose();
		scene.children[0].material.dispose();
		scene.remove(scene.children[0]);
	}
}

function createSnowflake() {
	clear(scene);

	let angleBetweenBranches = 360 / branchesParam;

	for (let i = 0; i < branchesParam; ++i) {
		pen.draw(radiusParam);
		pen.store();

		switch (patternParam) {
			case 0: drawPattern0(); break;
			case 1: drawPattern1(); break;
			case 2: drawPattern2(radiusParam, subbranchesParam); break;
			case 3: drawPattern3(radiusParam, subbranchesParam); break;
		}

		pen.restore();
		pen.turnLeft(angleBetweenBranches);
	}

	renderer.render(scene, camera);
}

// PATTERNS

function patternHelper0(reflect) {
	let distance = radiusParam / (subbranchesParam + 1);

	for (let i = 1; i <= subbranchesParam; ++i) {
		let length = radiusParam / (i + 1);

		pen.moveForward(distance);
		pen.draw(length, angleParam);
		pen.draw(length, -angleParam);

		if (reflect) {
			pen.draw(length, angleParam + 180);
			pen.draw(length, -angleParam + 180);
		}
	}
}

function drawPattern0() {
	patternHelper0(false);
}

function drawPattern1() {
	patternHelper0(true);
}

function drawPattern2(length, subbranches) {
	if (subbranches-- == 0)
		return;

	length /= 2;

	pen.moveForward(length);
	pen.draw(length, angleParam);
	pen.draw(length, -angleParam);
	drawPattern2(length, subbranches);
}

function drawPattern3(length, subbranches) {
	if (subbranches-- == 0)
		return;

	length /= 2;

	pen.moveForward(length);
	pen.draw(length, angleParam);
	pen.draw(length, -angleParam);
	pen.store();
	pen.turnLeft(angleParam);
	drawPattern3(length, subbranches);
	pen.restore();
	pen.turnRight(angleParam);
	drawPattern3(length, subbranches);
}
