
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

function compileProgram(vertexSrc, fragmentSrc)
{
	var vertexShader = compileShader(vertexSrc, gl.VERTEX_SHADER);
	var fragmentShader = compileShader(fragmentSrc, gl.FRAGMENT_SHADER);

	return linkProgram(vertexShader, fragmentShader);
}

function createProgramObject(program, attributes, uniforms)
{
	var ret = { program: program };

	attributes.forEach(a => { ret[a] = gl.getAttribLocation(program, a); });
	uniforms.forEach(a => { ret[a] = gl.getUniformLocation(program, a); });

	return ret;
}

var shaderFunctions = { };
var shaders = { };

function addShader(id, func)
{
	shaderFunctions[id] = func;
}

function compileShaders()
{
	for (var id in shaderFunctions) {
		shaders[id] = shaderFunctions[id]();
	}
}

