
var game_canvas = document.getElementById("game-canvas");
var game_music = document.getElementById("game-music");

var gl = createGL(game_canvas);
var audio = new Audio();

var game = new Game();
game.renderInit();

var gameLoaded = false;
var gameStarted = false;

var gameInput = { up: false };

function render()
{
	gl.clearColor(0x64/255.0, 0x95/255.0, 0xED/255.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if (gameStarted)
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
		startGame();
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
	startGame();

	gameInput.up = false;
	e.preventDefault();
	return false;
});

function startGame()
{
	if (!gameLoaded || gameStarted) return false;
	gameStarted = true;

	game_music.play();
	audio.play(sounds['toast.mp3']);
}

function loadGame()
{
	var pAtlas = loadAtlas("data/atlas");
	var pAudio = loadAudio("data/audio");

	game_music.src = "data/music/song1.mp3";

	Promise.all([pAtlas, pAudio])
		.then(() => {
			window.requestAnimationFrame(render);
			gameLoaded = true;
		});
}

loadGame();

