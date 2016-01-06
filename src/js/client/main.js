
var canvas = document.getElementById("game_canvas");
var gl = createGL(canvas);
var audio = new Audio();

var game = new Game();
game.renderInit();

var gameInput = { up: false };

function render()
{
	gl.clearColor(0x64/255.0, 0x95/255.0, 0xED/255.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	game.tick(0.016, gameInput);
	game.render();

	// HACK!
	if (game.player.y < 0.0 || game.player.y > 10.0) {
		game = new Game();
		game.renderInit();

		audio.play(sounds["hit.mp3"]);
	}

	window.requestAnimationFrame(render);
}

document.addEventListener('keydown', e => {
	switch (e.keyCode) {
	case 38:
		gameInput.up = true;
		break;
	}
});

document.addEventListener('keyup', e => {
	switch (e.keyCode) {
	case 38:
		gameInput.up = false;
		break;
	}
});

document.addEventListener('touchstart', e => {
	gameInput.up = true;
	e.preventDefault();
	return false;
});

document.addEventListener('touchend', e => {
	gameInput.up = false;
	e.preventDefault();
	return false;
});

function loadGame()
{
	var pAtlas = loadAtlas("data/atlas");
	var pAudio = loadAudio("data/audio");

	Promise.all([pAtlas, pAudio])
		.then(() => {
			window.requestAnimationFrame(render);
		});
}

loadGame();

