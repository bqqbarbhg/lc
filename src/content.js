
function Texture(image)
{
	this.width = image.naturalWidth;
	this.height = image.naturalHeight;

	this.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	// Trilinear filtering
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

	gl.generateMipmap(gl.TEXTURE_2D);

	gl.bindTexture(gl.TEXTURE_2D, null);
}

function Sprite(texture, frame)
{
	this.texture = texture;
	this.frame = {
		x: frame.x / texture.width,
		y: frame.y / texture.height,
		width: frame.width / texture.width,
		height: frame.height / texture.height,
	};
	this.aspect = frame.width / frame.height;
}

var textures = [];
var sprites = { };

function loadAtlas(url)
{
	return new Promise(function(resolve, reject) {

		var pTexture = new Promise(function (resolve, reject) {
			var image = new Image();
			image.onload = () => {
				var texture = new Texture(image);
				textures.push(texture);
				resolve(texture);
			}
			image.onerror = reject;
			image.src = url + ".png";
		});

		var pJson = fetch(url + ".json")
			.then(response => response.json());

		Promise.all([pTexture, pJson])
			.then(values => {
				var texture = values[0];
				var json = values[1];

				for (var id in json) {
					sprites[id] = new Sprite(texture, json[id]);
				}

				resolve();
			})
			.catch(reject);
	});
}

