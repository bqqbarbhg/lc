
function SpriteBatch()
{
	// XY, UV, RGBA
	this.VERTEX_SIZE = 2 + 2 + 4;
	this.BATCH_SIZE = 128;

	this.batchIndex = 0;

	this.vertexData = new Float32Array(this.BATCH_SIZE * this.VERTEX_SIZE * 4);
	this.vertexBuffer = gl.createBuffer();

	this.indexBuffer = gl.createBuffer();

	this.transform = new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
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
	var verts = [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]];
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

		var shader = shaders.spritebatch;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);

		gl.useProgram(shader.program);

		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.enableVertexAttribArray(2);

		gl.activeTexture(gl.TEXTURE0 + 0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);

		gl.uniformMatrix4fv(shader.u_transform, false, this.transform);
		gl.uniform1i(shader.u_texture, 0);

		var stride = this.VERTEX_SIZE * 4;
		gl.vertexAttribPointer(shader.a_position, 2, gl.FLOAT, gl.FALSE, stride, 0);
		gl.vertexAttribPointer(shader.a_texCoord, 2, gl.FLOAT, gl.FALSE, stride, 2 * 4);
		gl.vertexAttribPointer(shader.a_color, 4, gl.FLOAT, gl.FALSE, stride, 4 * 4);
		
		var indexCount = this.batchIndex * 6;
		gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
	}

	this.batchIndex = 0;
	this.texture = null;
};

