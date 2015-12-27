
var canvas = document.getElementById("game_canvas");
var gl = createGL(canvas);

var spriteBatch = new SpriteBatch();

var DEBUGTime = 0.0;

function render()
{
	gl.clearColor(0x64/255.0, 0x95/255.0, 0xED/255.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	DEBUGTime += 0.016;

	var height = Math.sin(DEBUGTime) * 0.1;

	var base = mulMat23(
		mat23Rotation(Math.sin(DEBUGTime * 2.0) * 0.2),
		mat23Translate([0.0, height]));

	var lbase = sprites['lbase'];
	spriteBatch.draw(lbase, mulMat23(base, [
			lbase.aspect, 0, 0,
			0, 1, 0,
	]));

	var lrotor = sprites['lrotor'];
	spriteBatch.draw(lrotor, mulMat23(base, [
			Math.sin(DEBUGTime * 8.0) * 0.5, 0, -0.03,
			0, 1 / lrotor.aspect * 0.5, -0.43,
	]));

	spriteBatch.flush();

	window.requestAnimationFrame(render);
}

loadAtlas("data/atlas")
	.then(() => {
		window.requestAnimationFrame(render);
	});

