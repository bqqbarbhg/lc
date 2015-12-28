
function createGL(canvas)
{
	var attributes = {
		alpha: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: false,
	};

	return canvas.getContext("webgl", attributes) ||
			canvas.getContext("experimental-webgl", attributes);
}

function compileShader(source, type)
{
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
	}

	return shader;
}

function linkProgram(vertexShader, fragmentShader)
{
	var program = gl.createProgram();

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
	}

	return program;
}

var spriteVertexSrc = `

precision mediump float;

uniform mat4 u_transform;

attribute vec4 a_position;
attribute vec2 a_texCoord;
attribute vec4 a_color;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
	gl_Position = u_transform * a_position;
	v_texCoord = a_texCoord;
	v_color = a_color;
}

`;

var spriteFragmentSrc = `

precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
	gl_FragColor = texture2D(u_texture, v_texCoord);
}

`;

function SpriteBatch()
{
	// XY, UV, RGBA
	this.VERTEX_SIZE = 2 + 2 + 4;
	this.BATCH_SIZE = 128;

	this.batchIndex = 0;

	this.vertexData = new Float32Array(this.BATCH_SIZE * this.VERTEX_SIZE * 4);
	this.vertexBuffer = gl.createBuffer();

	this.indexBuffer = gl.createBuffer();

	var vertexShader = compileShader(spriteVertexSrc, gl.VERTEX_SHADER);
	var fragmentShader = compileShader(spriteFragmentSrc, gl.FRAGMENT_SHADER);
	this.program = linkProgram(vertexShader, fragmentShader);

	this.aPosition = gl.getAttribLocation(this.program, "a_position");
	this.aTexCoord = gl.getAttribLocation(this.program, "a_texCoord");
	this.aColor = gl.getAttribLocation(this.program, "a_color");

	this.uTransform = gl.getUniformLocation(this.program, "u_transform");
	this.uTexture = gl.getUniformLocation(this.program, "u_texture");

	this.transform = new Float32Array([
			1, 0, 0, 0,
			0, -(canvas.width / canvas.height), 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
	]);

	var indexData = new Uint16Array(this.BATCH_SIZE * 6);
	var base = 0;
	for (var i = 0; i < this.BATCH_SIZE; i += 6) {
		indexData[i + 0] = base + 0;
		indexData[i + 1] = base + 1;
		indexData[i + 2] = base + 2;
		indexData[i + 3] = base + 2;
		indexData[i + 4] = base + 1;
		indexData[i + 5] = base + 3;

		base += 4;
	}
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

	this.texture = null;
}

SpriteBatch.prototype.draw = function(sprite, transform, color)
{
	if (this.texture != sprite.texture || this.batchIndex == this.BATCH_SIZE)
		this.flush();

	if (!color) color = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

	this.texture = sprite.texture;

	var vertexIndex = this.batchIndex * 4 * this.VERTEX_SIZE;

	var frame = sprite.frame;
	var verts = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
	var uvs = [
		[frame.x, frame.y],
		[frame.x + frame.width, frame.y],
		[frame.x, frame.y + frame.height],
		[frame.x + frame.width, frame.y + frame.height],
	];

	for (var i = 0; i < 4; i++) {
		var uv = uvs[i];
		var vert = mulMat23Vec2(transform, verts[i]);

		this.vertexData[vertexIndex + 0] = vert[0];
		this.vertexData[vertexIndex + 1] = vert[1];
		this.vertexData[vertexIndex + 2] = uv[0];
		this.vertexData[vertexIndex + 3] = uv[1];
		this.vertexData[vertexIndex + 4] = color.r;
		this.vertexData[vertexIndex + 5] = color.g;
		this.vertexData[vertexIndex + 6] = color.b;
		this.vertexData[vertexIndex + 7] = color.a;

		vertexIndex += this.VERTEX_SIZE;
	}

	this.batchIndex += 1;
};

SpriteBatch.prototype.flush = function()
{
	if (this.batchIndex > 0) {
		var vertCount = this.batchIndex * this.VERTEX_SIZE * 4;
		var verts = this.vertexData.subarray(0, vertCount);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);

		gl.useProgram(this.program);

		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.enableVertexAttribArray(2);

		gl.activeTexture(gl.TEXTURE0 + 0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);

		gl.uniformMatrix4fv(this.uTransform, false, this.transform);
		gl.uniform1i(this.uTexture, 0);

		var stride = this.VERTEX_SIZE * 4;
		gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, gl.FALSE, stride, 0);
		gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, gl.FALSE, stride, 2 * 4);
		gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, gl.FALSE, stride, 4 * 4);
		
		var indexCount = this.batchIndex * 6;
		gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
	}

	this.batchIndex = 0;
	this.texture = null;
};

