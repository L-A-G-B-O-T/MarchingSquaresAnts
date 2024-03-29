
//Setup
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");
//ctx.translate(1, 1);

//Canvas dimensions: 950px * 600px

function getNewTime(){
	return new Date().getTime();
}

function getState(a, b, c, d){
	return Math.round(a) * 8 + Math.round(b) * 4 + Math.round(c) * 2 + Math.round(d) * 1;
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function joinLine(a, b){
	ctx.moveTo(a[1], a[0]);
	ctx.lineTo(b[1], b[0]);
}

function fillPolygon(points){
	const i = points.length - 1;
	ctx.beginPath();
	ctx.moveTo(points[i][1], points[i][0]);
	for (const p of points){
		ctx.lineTo(p[1], p[0]);
	}
	ctx.fill();
	ctx.closePath();
}

class MarchingField {
	constructor(){
		this.res = 10;
		this.debug = false;
		const { width, height } = canvas.getBoundingClientRect();
		this.H = height / this.res + 1; this.W = width / this.res + 1;
		this.arr = Array.from(Array(this.H), () => new Array(this.W));//A value of 0 = all air, a value of 1 = all dirt
		
		this.objects = []; //list that contains references for all physical objects
		this.ants = []; //list that contains references for only adult ants
		this.larvae = []; //list that contains references for only larvae
		this.eggs = []; //list that contains references for only eggs
		this.foods = []; //list that contains references for only food items
		this.pheromones = []; //list that contains references for ant pheromones
		
		this.threshold = 0.5;
		for (let i = 0; i < this.H; i++){
			for (let j = 0; j < this.W; j++){
				let v = sigmoid((Math.random() - 0.5) / 4 + (i - this.H / 2)/10);
				if (v < 0.5){
					v = .4;
				} else if (i > this.H + 1) {
					v = 1.0
				} else {
					v = 1.0 - Math.random() * 0.5;
				}
				this.arr[i][j] = v;
			}
		}
	}
	draw(color){
		
		if (this.debug){ //plot points for debug
			ctx.save();
			
			ctx.fillStyle = "#FF0000";
			
			for (let i = 0; i < this.H; i++){ //draw points for debug
				for (let j = 0; j < this.W; j++){
					const yPos = i * this.res;
					const xPos = j * this.res;
					
					ctx.globalAlpha = this.arr[i][j];
					ctx.fillRect(xPos - 1, yPos - 1, 2, 2);
				}
			}
			ctx.restore();
		}
		
		ctx.save();
		for (let i = 0; i < this.H - 1; i++){ //loop each square, so height - 1 * width - 1 times
			for (let j = 0; j < this.W - 1; j++){
				//now get the square with vertices (i, j), (i + 1, j), (i, j + 1), (i + 1, j + 1)
				//draw an octagon 
				const yPos = i * this.res;
				const xPos = j * this.res;
				//let square = [arr[i][j], arr[i][j + 1], arr[i + 1][j + 1], arr[i + 1][j]];
				
				const luWeight = Math.abs(this.arr[i][j] - 0.5);
				const ruWeight = Math.abs(this.arr[i][j + 1] - 0.5);
				const rdWeight = Math.abs(this.arr[i + 1][j + 1] - 0.5);
				const ldWeight = Math.abs(this.arr[i + 1][j] - 0.5);	
				
				const lu = [yPos, xPos];
				const ru = [yPos, xPos + this.res];
				const rd = [yPos + this.res, xPos + this.res];
				const ld = [yPos + this.res, xPos];
				
				const aOffset = luWeight / (luWeight + ruWeight);
				const bOffset = ruWeight / (ruWeight + rdWeight);
				const cOffset = ldWeight / (ldWeight + rdWeight); 
				const dOffset = luWeight / (luWeight + ldWeight);
				
				const a = [yPos, xPos + this.res * aOffset];
				const b = [yPos + this.res * bOffset, xPos + this.res];
				const c = [yPos + this.res, xPos + this.res * cOffset];
				const d = [yPos + this.res * dOffset, xPos];
				
				ctx.globalAlpha = 1;
				ctx.lineWidth = 1;
				ctx.strokeStyle = "#FF0000";
				ctx.fillStyle = color;
				
				const index = getState(this.arr[i][j], this.arr[i][j + 1], this.arr[i + 1][j + 1], this.arr[i + 1][j]);
				switch (index){
				case 0:
					{
						
					} break;
				case 1:
					{
						//joinLine(c, d);	
						fillPolygon([c, d, ld]);
					} break;
				case 2:
					{
						//joinLine(b, c);
						fillPolygon([b, c, rd]);
					} break;
				case 3:
					{
						//joinLine(b, d);
						fillPolygon([b, rd, ld, d]);
					} break;
				case 4:
					{
						//joinLine(a, b);
						fillPolygon([a, b, ru]);
					} break;
				case 5:
					{
						//joinLine(a, d);
						//joinLine(b, c);
						fillPolygon([a, ru, b, c, ld, d]);
					} break;
				case 6:
					{
						//joinLine(a, c);
						fillPolygon([a, ru, rd, c]);
					} break;
				case 7:
					{
						//joinLine(a, d);
						fillPolygon([a, ru, rd, ld, d]);
					} break;
				case 8:
					{
						//joinLine(a, d);
						fillPolygon([lu, a, d]);
					} break;
				case 9:
					{
						//joinLine(a, c);
						fillPolygon([lu, a, c, ld]);
					} break;
				case 10:
					{
						//joinLine(a, b);
						//joinLine(c, d);
						fillPolygon([lu, a, b, rd, c, d]);
					} break;
				case 11:
					{
						//joinLine(a, b);
						fillPolygon([lu, a, b, rd, ld]);
					} break;
				case 12:
					{
						//joinLine(b, d);
						fillPolygon([lu, ru, b, d]);
					} break;
				case 13:
					{
						//joinLine(b, c);
						fillPolygon([lu, ru, b, c, ld]);
					} break;
				case 14:
					{
						//joinLine(c, d);
						fillPolygon([lu, ru, rd, c, d]);
					} break;
				case 15:
					{
						ctx.fillRect(xPos, yPos, this.res, this.res);
					} break;
				}
			}
		}
		ctx.restore();
	}
	addMaterial(xpos, ypos, radius){
		const kindacenter = [ypos / this.res, xpos / this.res];
		
		const lowerXbound = Math.max(0, Math.round(kindacenter[1] - radius));
		const upperXbound = Math.min(this.W - 1, Math.round(kindacenter[1] + radius));
		const lowerYbound = Math.max(0, Math.round(kindacenter[0] - radius));
		const upperYbound = Math.min(this.H - 1, Math.round(kindacenter[0] + radius));
		
		for (let i = lowerYbound; i <= upperYbound; i++){
			for (let j = lowerXbound; j <= upperXbound; j++){
				this.arr[i][j] = Math.min(1, this.arr[i][j] + 0.02);
			}
		} 
	}
	pointMaterial(xpos, ypos, amount){
		const kindacenter = [ypos / this.res, xpos / this.res];
		
		const indexX = Math.max(0, Math.min(this.W - 1, Math.round(kindacenter[1])));
		const indexY = Math.max(0, Math.min(this.H - 1, Math.round(kindacenter[0])));
		
		this.arr[indexY][indexX] += amount; 
		if (this.arr[indexY][indexX] > 1.0){
			this.arr[indexY][indexX] = 1.0;
			return this.arr[indexY][indexX] - 1.0;
		}
	}
}

class PhysicalObject {
	constructor(){
		this.xpos = 0; //xposition
		this.ypos = 0; //yposition
		this.rot = 0;  //rotation
	}
}

class Ant extends PhysicalObject {
	constructor(){
		super();
		this.heldItem = null; //references a PhysicalObject that it is holding
		this.goal = ""; //current mind state
	}
	draw(){
		
	}
}

const mf = new MarchingField();

const mouse = {
	xpos : 0,
	ypos : 0,
	down : 0
};

canvas.addEventListener("mousemove", function(e){
	mouse.xpos = e.offsetX;
	mouse.ypos = e.offsetY;
});

canvas.addEventListener("mousedown", function(){
	mouse.down = true;
});

canvas.addEventListener("mouseup", function(){
	mouse.down = false;
});

canvas.addEventListener("mouseleave", function(){
	mouse.down = false;
});


function mainloop(){
	if (mouse.down){
		mf.addMaterial(mouse.xpos, mouse.ypos, 1.5);
	}
	
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, 950, 600);
	mf.draw("#AA4411");
}

setInterval(mainloop, 20);