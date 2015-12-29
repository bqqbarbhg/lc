
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

function mulMat23Chain()
{
    var result = mulMat23(arguments[0], arguments[1]);
    for (var i = 2; i < arguments.length; i++) {
	result = mulMat23(result, arguments[i]);
    }
    return result;
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

function mat23ScaleU(scale)
{
    return [scale, 0.0, 0.0,
            0.0, scale, 0.0];
}

function mat23Rotate(angle)
{
	var cos = Math.cos(angle);
	var sin = Math.sin(angle);

	return [cos, sin, 0.0,
			-sin, cos, 0.0];
}

function mat44OrthoProjection(l, r, t, b, n, f)
{
    return [
	2 / (r - l), 0, 0, 0,
	0, 2 / (t - b), 0, 0,
	0, 0, 2 / (n - f), 0,
	-(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1,
    ];
}

