function createAudioCtx()
{
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	if (!AudioContext) {
		return null;
	} else {
		return new AudioContext();
	}
}

function Audio()
{
	this.ctx = createAudioCtx();
}

Audio.prototype.decodeBuffer = function(data)
{
	var ctx = this.ctx;
	if (!ctx) return Promise.reject("WebAudio not supported");

	return new Promise((resolve, reject) => {
		ctx.decodeAudioData(data, resolve, reject);
	});
};

Audio.prototype.play = function(sound)
{
	if (!sound || !this.ctx) return;

	var source = this.ctx.createBufferSource();
	source.buffer = sound;
	source.connect(this.ctx.destination);
	source.start(0.0);
};

