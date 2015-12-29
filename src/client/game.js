
function Player()
{
	this.x = 0.0;
	this.y = 5.0;

	this.dy = 0.0;
	this.gravity = 10.0;
	this.speed = 20.0;
}

Player.prototype.tick = function(dt, input)
{
	this.dy -= this.gravity * dt;

	if (input.up) {
		this.dy += this.speed * dt;
	}

	this.y += this.dy * dt;
};

function Game()
{
	this.player = new Player();
}

Game.prototype.tick = function(dt, input)
{
	this.player.tick(dt, input);
};

