
addShader('spritebatch', () => {
	var program = compileProgram(`
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
	`,`
	precision mediump float;

	uniform sampler2D u_texture;

	varying vec2 v_texCoord;
	varying vec4 v_color;

	void main() {
		gl_FragColor = texture2D(u_texture, v_texCoord);
	}
	`);

	return createProgramObject(program,
		['a_position', 'a_texCoord', 'a_color'],
		['u_transform', 'u_texture']);
});

