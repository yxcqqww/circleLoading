$.circleLoading = function (options) {
    var options = $.extend(true, {}, {
        radius: 86,
        small_radius: 82,
        inside_radius: 70,
        sin: {
            A: 0.1,
            B: -0.06,
            C: 0.1
        },
        preColor: '#F0EFEC',
        backColor: '#9bca92'
    }, options);
    //半径,endPercent 百分比,backColor 中心颜色, proColor 进度颜色，rate波浪逐渐上升的高度比率
    function DrowProcess(r, small_r, inside_radius, endPercent, rate, backColor, proColor) {
        var canvas = document.getElementById(options.container);
        if (canvas.getContext) {
            var cts = canvas.getContext('2d');
        } else {
            return;
        }

        // 坐标移动到圆心
        cts.beginPath();
        cts.moveTo(r, r);
        // 画圆,圆心是(r, r),半径r,从角度0开始,画到2PI结束,最后一个参数是方向顺时针还是逆时针
        cts.arc(r, r, r, 0, Math.PI * 2, false);
        cts.closePath();
        cts.fillStyle = backColor;
        cts.fill();


        cts.beginPath();
        cts.moveTo(r, r);
        //画扇形，圆心(r,r),半径r，逆时针画圆
        cts.arc(r, r, r, 1.5 * Math.PI, 1.5 * Math.PI - endPercent / 100 * 2 * Math.PI, true);
        cts.closePath();
        cts.fillStyle = proColor;
        cts.fill();

        //画灰色圆形区域
        cts.beginPath();
        cts.moveTo(r, r);
        cts.arc(r, r, small_r, 0, 2 * Math.PI, false);
        cts.closePath();
        cts.fillStyle = backColor;
        cts.fill();

        $(options.textId).text(endPercent + '%'); //写百分比

        //var insideRate = 0.8;

        cts.beginPath();
        //画白色圆形区域
        cts.arc(r, r, inside_radius, 0, 2 * Math.PI, false);
        cts.fillStyle = 'rgba(255, 255, 255, 1)';
        cts.fill();

        // 画波浪
        //var rr = insideRate * r;
        
        var rr = inside_radius;
        if(endPercent === 0){
            return;
        }else if(endPercent === 100){
            var y_avg = 0;
        }else{
            //计算当前水位的坐标
            var y_avg = r + rr - endPercent / 100.0 * 2 * rr;
        }
        var x_start = null;
        var y_start = null;
        var x_hit = null;
        var y_hit = null;
        var preState = "";
        var paint = false;
        cts.beginPath();
        for (var i = r - rr; i <= r + rr; i++) {
            // sin函数：y = A * sin(B * X + c) + D
            // A: 0.1(振幅大小) * (rate / 100) * r
            // B: -0.06(方向及波长)
            // C: 0.5(波浪动画速度) * (endPercent - 0.2 * rate)
            // D: y_avg
            var y_sin = options.sin.A * (rate / 100) * r * Math.sin(options.sin.B * i + options.sin.C * (endPercent - 0.2 * rate)) + y_avg;
            var y_r_u = r - Math.sqrt(Math.pow(rr, 2) - Math.pow((r - i), 2));
            var y_r_d = r + Math.sqrt(Math.pow(rr, 2) - Math.pow((r - i), 2));
            if (y_sin >= y_r_d) {// 在圆的下面
                if (preState == "in") {
                    cts.arc(r, r, rr, getAngle(i, y_sin, r, r), getAngle(x_start, y_start, r, r), false);
                    cts.fillStyle = proColor;
                    cts.fill();
                    paint = true;
                    x_start = null;
                    y_start = null;
                    x_hit = null;
                    y_hit = null;
                } else if (preState == "up") {
                    throw "sin函数幅度相对于圆来说太大";
                }
                preState = "down";
            } else if (y_sin <= y_r_u) {// 在圆的上面
                if (preState == "in") {
                    x_hit = i;
                    y_hit = y_sin;
                } else if (preState == "down") {
                    throw "sin函数幅度相对于圆来说太大";
                }
                preState = "up";
            } else {// 在圆上或圆内
                switch (preState) {
                    case "in":
                        cts.lineTo(i, y_sin);
                        break;
                    case "up":
                        if (x_hit != null) {
                            // FIXME if need lineTo(i, y_sin) ?
                            cts.arc(r, r, rr, getAngle(x_hit, y_hit, r, r), getAngle(i, y_sin, r, r), false);
                            x_hit = i;
                            y_hit = y_sin;
                            break;
                        }
                    default:
                        x_start = i;
                        y_start = y_sin;
                        x_hit = x_start;
                        y_hit = y_start;
                        cts.moveTo(i, y_sin);
                }
                preState = "in";
            }
        }

        if (x_hit != null) {
            cts.arc(r, r, rr, getAngle(x_hit, y_hit, r, r), getAngle(x_start, y_start, r, r), false);
            cts.fillStyle = proColor;
            cts.fill();
            paint = true;
        }

        if (!paint && y_avg <= r) {
            cts.arc(r, r, rr, 0, 2 * Math.PI, false);
            cts.fillStyle = proColor;
            cts.fill();
        }
    }

    function getAngle(x, y, x_base, y_base) {
        if (x > x_base) {
            if (y > y_base) {
                return Math.atan((y - y_base) / (x - x_base));
            } else if (y < y_base) {
                return 2 * Math.PI + Math.atan((y - y_base) / (x - x_base));
            } else {// y == y_base
                return 0;
            }
        } else if (x < x_base) {
            if (y > y_base) {
                return Math.PI - Math.atan((y - y_base) / (x_base - x));
            } else if (y < y_base) {
                return Math.PI + Math.atan((y_base - y) / (x_base - x));
            } else {// y == y_base
                return Math.PI;
            }
        } else {// x == x_base
            if (y > y_base) {
                return Math.PI / 2;
            } else if (y < y_base) {
                return Math.PI * 1.5;
            } else {// y == y_base
                throw "(x,y) == (x_base,y_base)";
            }
        }
    }

    //当达到endPercent波浪减速直到水面平静
    function Calm() {
        DrowProcess(options.radius, options.small_radius, options.inside_radius, options.startPercent, options.rate, options.preColor, options.backColor);
        setTimeout(Calm, options.timer);
        if (options.rate == 0) {
            return;
        }
        options.rate -= 5;
    }

    function Start() {
        DrowProcess(options.radius, options.small_radius, options.inside_radius , options.startPercent, options.rate, options.preColor, options.backColor);
        var t = setTimeout(Start, options.timer);
        if (options.startPercent >= options.endPercent) {
            //Calm();
            clearTimeout(t);
            return;
        }
        options.startPercent++;
    }

    Start();
};