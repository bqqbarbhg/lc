
Game.prototype.renderInit = function()
{
	this.spriteBatch = new SpriteBatch();
};

Game.prototype.render = function()
{
	var height = this.player.y;

	var screenHeight = 10.0;
	var aspect = 800 / 600;
	this.spriteBatch.transform = new Float32Array(
		mat44OrthoProjection(0.0, 10.0 * aspect, 10.0, 0.0, -1.0, 1.0));

	var base = mulMat23Chain(
		mat23Translate([4.0, height]),
		mat23Rotate(-this.player.dy * 0.05),
		mat23ScaleU(2.0)
	);

	var lbase = sprites['head/base/normal.png'];
	this.spriteBatch.draw(lbase, mulMat23(base, [
			lbase.aspect, 0, 0,
			0, 1, 0,
	]));

	var lrotor = sprites['head/rotor/normal.png'];
	this.spriteBatch.draw(lrotor, mulMat23(base, [
			0.5, 0, -0.03,
			0, 1 / lrotor.aspect * 0.5, 0.43,
	]));

	this.spriteBatch.flush();
};

