
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
		width: frame.w / texture.width,
		height: frame.h / texture.height,
	};
	this.aspect = frame.w / frame.h;
}

var textures = [];
var sprites = { };

function loadAtlas(url)
{
	var pTexture = loadImage(url + ".png")
		.then(image => new Texture(image));

	var pJson = fetch(url + ".json")
		.then(response => response.json());

	return Promise.all([pTexture, pJson])
		.then(splat((texture, json) => {
			textures.push(texture);
			for (var id in json) {
				sprites[id] = new Sprite(texture, json[id]);
			}
		}));
}

