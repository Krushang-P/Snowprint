import {ExtrudeGeometry, Mesh, Shape} from "three";

// Return the radians equivalent of an angle in <degrees>
function radians(degrees) {
	return degrees * Math.PI / 180;
}

// Pen can draw a 3D three.js mesh in contact with the 2D XY plane of a three.js scene
// Pen exists in this plane (that is, its z-coordinate is 0)
class Pen {
	// The mesh has one of the following shapes
	// Their indexes begin at 0 for interoperability with HTMLSelectElement.selectedIndex
	static triangle = 0;  // Triangular prism whose face is an isosceles triangle
	static rectangle = 1; // Rectangular prism whose face is a rectangle

	constructor(x, y, direction, depth, size, curvature, curveAt, shape, material, scene) {
		this.x = x;                 // Pen's x-coordinate
		this.y = y;                 // Pen's y-coordinate
		this.direction = direction; // Pen's direction as an angle in standard position in degrees
		this.depth = depth;         // Mesh's depth
		this.size = size;           // Mesh's base size
		this.curvature = curvature; // Mesh's curvature: 0? Not curved; > 0? Wider; < 0? Narrower
		this.curveAt = curveAt;     // Mesh's curves location: from 0, beginning, to 1, end, of mesh
		this.shape = shape;         // Mesh's shape
		this.material = material;   // Mesh's three.js material
		this.scene = scene;         // Mesh's three.js scene
		this.stack = [];            // Stack to store versions of this pen
	}

	// Store a version of this pen
	store() {
		this.stack.push(new Pen(this.x, this.y, this.direction, this.depth, this.size,
			this.curvature, this.curveAt, this.shape, this.material, this.scene));
	}

	// Restore the newest version of this pen
	restore() {
		let pen = this.stack.pop();

		this.x = pen.x;
		this.y = pen.y;
		this.direction = pen.direction;
		this.depth = pen.depth;
		this.size = pen.size;
		this.curvature = pen.curvature;
		this.curveAt = pen.curveAt;
		this.shape = pen.shape;
		this.material = pen.material;
		this.scene = pen.scene;
	}

	// Move this pen forward by <distance>
	moveForward(distance) {
		let direction = radians(this.direction);

		this.x += distance * Math.cos(direction);
		this.y += distance * Math.sin(direction);
	}

	// Move this pen backward by <distance>
	moveBackward(distance) {
		this.moveForward(-distance);
	}

	// Turn this pen left (counterclockwise) by <angle> degrees
	turnLeft(angle) {
		this.direction += angle;
	}

	// Turn this pen right (clockwise) by <angle> degrees
	turnRight(angle) {
		this.turnLeft(-angle);
	}

	// Draw a mesh of the specified <length>, offset from this.direction by <angle> degrees
	draw(length, angle = 0) {
		angle = radians(angle + this.direction);

		let halfSize = this.size / 2;
		let halfPI = Math.PI / 2;
		let anglePlusHalfPI = angle + halfPI;

		let curvatureCoefficient = this.curvature * this.size;

		let baseXCoefficient = halfSize * Math.cos(anglePlusHalfPI);
		let baseYCoefficient = halfSize * Math.sin(anglePlusHalfPI);

		let apexXCoefficient = length * Math.cos(angle);
		let apexYCoefficient = length * Math.sin(angle);

		let baseVertex1x = this.x + baseXCoefficient;
		let baseVertex1y = this.y + baseYCoefficient;

		let baseVertex2x = this.x - baseXCoefficient;
		let baseVertex2y = this.y - baseYCoefficient;

		let shape = new Shape();

		shape.moveTo(baseVertex1x, baseVertex1y);

		switch (this.shape) {
			case Pen.triangle:
				let baseAngle = Math.atan(length / halfSize); // Internal base angle
				let angle1 = angle + baseAngle - halfPI; // Angle of side 1 in standard position
				let angle2 = angle - baseAngle + halfPI; // Angle of side 2 in standard position
				let sideLength = 1 / Math.sin(baseAngle) * length;
				let curveAtCoefficient = this.curveAt * sideLength;

				shape.quadraticCurveTo(
					baseVertex1x + curveAtCoefficient * Math.cos(angle1) + curvatureCoefficient * Math.cos(angle1 + halfPI),
					baseVertex1y + curveAtCoefficient * Math.sin(angle1) + curvatureCoefficient * Math.sin(angle1 + halfPI),
					this.x + apexXCoefficient,
					this.y + apexYCoefficient);

				shape.quadraticCurveTo(
					baseVertex2x + curveAtCoefficient * Math.cos(angle2) - curvatureCoefficient * Math.cos(angle2 + halfPI),
					baseVertex2y + curveAtCoefficient * Math.sin(angle2) - curvatureCoefficient * Math.sin(angle2 + halfPI),
					baseVertex2x,
					baseVertex2y);

				break;

			case Pen.rectangle:
				shape.quadraticCurveTo(
					baseVertex1x + this.curveAt * apexXCoefficient + curvatureCoefficient * Math.cos(anglePlusHalfPI),
					baseVertex1y + this.curveAt * apexYCoefficient + curvatureCoefficient * Math.sin(anglePlusHalfPI),
					baseVertex1x + apexXCoefficient,
					baseVertex1y + apexYCoefficient);

				shape.lineTo(baseVertex2x + apexXCoefficient, baseVertex2y + apexYCoefficient);

				shape.quadraticCurveTo(
					baseVertex2x + this.curveAt * apexXCoefficient - curvatureCoefficient * Math.cos(anglePlusHalfPI),
					baseVertex2y + this.curveAt * apexYCoefficient - curvatureCoefficient * Math.sin(anglePlusHalfPI),
					baseVertex2x,
					baseVertex2y);

				break;
		}

		let geometry = new ExtrudeGeometry(shape, {depth: this.depth, bevelEnabled: false});
		let mesh = new Mesh(geometry, this.material);

		this.scene.add(mesh);
	}
}

export {Pen};
