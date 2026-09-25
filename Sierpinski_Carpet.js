var canvas;
var gl;

var points = [];
var NumTimesToSubdivide = 5;

var bufferId;
var uColorLoc;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // WebGL 구성
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // 셰이더 및 버퍼 초기화
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    uColorLoc = gl.getUniformLocation(program, "uColor");

    // 분할 횟수 UI 이벤트
    document.getElementById("slider").oninput = function(event) {
        NumTimesToSubdivide = parseInt(event.target.value);
        document.getElementById("subdiv-val").textContent = NumTimesToSubdivide;
        updateGeometry();
    };

    // 색상 제어 UI 이벤트
    document.getElementById("colorPicker").oninput = function(event) {
        var hex = event.target.value;
        var r = parseInt(hex.substring(1, 3), 16) / 255.0;
        var g = parseInt(hex.substring(3, 5), 16) / 255.0;
        var b = parseInt(hex.substring(5, 7), 16) / 255.0;
        gl.uniform4f(uColorLoc, r, g, b, 1.0);
        render();
    };

    // 초기 색상 설정
    var hex = document.getElementById("colorPicker").value;
    var r = parseInt(hex.substring(1, 3), 16) / 255.0;
    var g = parseInt(hex.substring(3, 5), 16) / 255.0;
    var b = parseInt(hex.substring(5, 7), 16) / 255.0;
    gl.uniform4f(uColorLoc, r, g, b, 1.0);

    updateGeometry();
};

// 사각형 정점 푸시 함수 
function carpet(a, b, c, d) {
    points.push(a, b, c);
    points.push(a, c, d);
}

// 재귀 분할 함수 
function divideCarpet(a, b, c, d, count) {
    if (count === 0) {
        carpet(a, b, c, d);
    } else {
        // mix()를 이용해 각 변을 1/3, 2/3 지점으로 내분 
        var ab1 = mix(a, b, 1/3);
        var ab2 = mix(a, b, 2/3);

        var bc1 = mix(b, c, 1/3);
        var bc2 = mix(b, c, 2/3);

        var dc1 = mix(d, c, 1/3);
        var dc2 = mix(d, c, 2/3);

        var ad1 = mix(a, d, 1/3);
        var ad2 = mix(a, d, 2/3);

        // 내부 점 4개 계산
        var p1 = mix(ad1, bc1, 1/3);
        var p2 = mix(ad1, bc1, 2/3);
        var p3 = mix(ad2, bc2, 1/3);
        var p4 = mix(ad2, bc2, 2/3);

        --count;

        // 중앙 영역을 제외한 8개 영역 재귀 호출
        divideCarpet(a, ab1, p1, ad1, count);
        divideCarpet(ab1, ab2, p2, p1, count);
        divideCarpet(ab2, b, bc1, p2, count);

        divideCarpet(ad1, p1, p3, ad2, count);
        divideCarpet(p2, bc1, bc2, p4, count);

        divideCarpet(ad2, p3, dc1, d, count);
        divideCarpet(p3, p4, dc2, dc1, count);
        divideCarpet(p4, bc2, c, dc2, count);
    }
}

function updateGeometry() {
    points = [];

    // 초기 정사각형 정의 
    var vertices = [
        vec2(-1, -1), // a (좌하)
        vec2(-1, 1), // b (좌상)
        vec2(1, 1), // c (우상)
        vec2(1, -1)  // d (우하)
    ];

    divideCarpet(vertices[0], vertices[1], vertices[2], vertices[3], NumTimesToSubdivide);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}