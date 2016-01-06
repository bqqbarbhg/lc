(function(){
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})();
;

function mulMat23(lhs, rhs)
{
	return [
		lhs[0] * rhs[0] + lhs[1] * rhs[3],
		lhs[0] * rhs[1] + lhs[1] * rhs[4],
		lhs[0] * rhs[2] + lhs[1] * rhs[5] + lhs[2],
		lhs[3] * rhs[0] + lhs[4] * rhs[3],
		lhs[3] * rhs[1] + lhs[4] * rhs[4],
		lhs[3] * rhs[2] + lhs[4] * rhs[5] + lhs[5],
	];
}

function mulMat23Vec2(mat, vec)
{
	return [mat[0] * vec[0] + mat[1] * vec[1] + mat[2],
		    mat[3] * vec[0] + mat[4] * vec[1] + mat[5]];
}

function mat23Translate(offset)
{
    return [1.0, 0.0, offset[0],
            0.0, 1.0, offset[1]];
}

function mat23Rotation(angle)
{
	var cos = Math.cos(angle);
	var sin = Math.sin(angle);

	return [cos, sin, 0.0,
			-sin, cos, 0.0];
}

;

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
	return new Promise(function(resolve, reject) {

		var pTexture = new Promise(function (resolve, reject) {
			var image = new Image();
			image.onload = () => {
				var texture = new Texture(image);
				textures.push(texture);
				resolve(texture);
			};
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

;

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

var spriteVertexSrc = `

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

`;

var spriteFragmentSrc = `

precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
	gl_FragColor = texture2D(u_texture, v_texCoord);
}

`;

function SpriteBatch()
{
	// XY, UV, RGBA
	this.VERTEX_SIZE = 2 + 2 + 4;
	this.BATCH_SIZE = 128;

	this.batchIndex = 0;

	this.vertexData = new Float32Array(this.BATCH_SIZE * this.VERTEX_SIZE * 4);
	this.vertexBuffer = gl.createBuffer();

	this.indexBuffer = gl.createBuffer();

	var vertexShader = compileShader(spriteVertexSrc, gl.VERTEX_SHADER);
	var fragmentShader = compileShader(spriteFragmentSrc, gl.FRAGMENT_SHADER);
	this.program = linkProgram(vertexShader, fragmentShader);

	this.aPosition = gl.getAttribLocation(this.program, "a_position");
	this.aTexCoord = gl.getAttribLocation(this.program, "a_texCoord");
	this.aColor = gl.getAttribLocation(this.program, "a_color");

	this.uTransform = gl.getUniformLocation(this.program, "u_transform");
	this.uTexture = gl.getUniformLocation(this.program, "u_texture");

	this.transform = new Float32Array([
			1, 0, 0, 0,
			0, -(canvas.width / canvas.height), 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
	]);

	var indexData = new Uint16Array(this.BATCH_SIZE * 6);
	var base = 0;
	for (var i = 0; i < this.BATCH_SIZE; i += 6) {
		indexData[i + 0] = base + 0;
		indexData[i + 1] = base + 1;
		indexData[i + 2] = base + 2;
		indexData[i + 3] = base + 2;
		indexData[i + 4] = base + 1;
		indexData[i + 5] = base + 3;

		base += 4;
	}
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

	this.texture = null;
}

SpriteBatch.prototype.draw = function(sprite, transform, color)
{
	if (this.texture != sprite.texture || this.batchIndex == this.BATCH_SIZE)
		this.flush();

	if (!color) color = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

	this.texture = sprite.texture;

	var vertexIndex = this.batchIndex * 4 * this.VERTEX_SIZE;

	var frame = sprite.frame;
	var verts = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
	var uvs = [
		[frame.x, frame.y],
		[frame.x + frame.width, frame.y],
		[frame.x, frame.y + frame.height],
		[frame.x + frame.width, frame.y + frame.height],
	];

	for (var i = 0; i < 4; i++) {
		var uv = uvs[i];
		var vert = mulMat23Vec2(transform, verts[i]);

		this.vertexData[vertexIndex + 0] = vert[0];
		this.vertexData[vertexIndex + 1] = vert[1];
		this.vertexData[vertexIndex + 2] = uv[0];
		this.vertexData[vertexIndex + 3] = uv[1];
		this.vertexData[vertexIndex + 4] = color.r;
		this.vertexData[vertexIndex + 5] = color.g;
		this.vertexData[vertexIndex + 6] = color.b;
		this.vertexData[vertexIndex + 7] = color.a;

		vertexIndex += this.VERTEX_SIZE;
	}

	this.batchIndex += 1;
};

SpriteBatch.prototype.flush = function()
{
	if (this.batchIndex > 0) {
		var vertCount = this.batchIndex * this.VERTEX_SIZE * 4;
		var verts = this.vertexData.subarray(0, vertCount);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);

		gl.useProgram(this.program);

		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.enableVertexAttribArray(2);

		gl.activeTexture(gl.TEXTURE0 + 0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);

		gl.uniformMatrix4fv(this.uTransform, false, this.transform);
		gl.uniform1i(this.uTexture, 0);

		var stride = this.VERTEX_SIZE * 4;
		gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, gl.FALSE, stride, 0);
		gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, gl.FALSE, stride, 2 * 4);
		gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, gl.FALSE, stride, 4 * 4);
		
		var indexCount = this.batchIndex * 6;
		gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
	}

	this.batchIndex = 0;
	this.texture = null;
};

;

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

	var lbase = sprites['head/base/normal.png'];
	spriteBatch.draw(lbase, mulMat23(base, [
			lbase.aspect, 0, 0,
			0, 1, 0,
	]));

	var lrotor = sprites['head/rotor/normal.png'];
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


})();