//logs.js
const util = require('../../utils/util.js');
var context = wx.createCanvasContext('firstCanvas');
/*var point = [];
var jumpNum = 1;//同样的书写时间下数字越大离散点间距越大
var nowJump = 0;//当前这一一个笔画里面有的离散点的数量
var penSize = 0;
var linePressure = 10;
var lineMax =40;
var lineMin =5;
var VVV = 2;
var pen = new Writing('firstCanvas');*/

/* 构造函数 */
function Writing(canvasId){
    this.context = wx.createCanvasContext('firstCanvas');
    this.penSize = 15;//画笔初始的粗细
    this.point = [];
    this.linePressure = 10;//笔的压力
    this.lineMax =35;//慢速最粗的线宽
    this.lineMin =3;//慢速最细的线宽
    this.VVV = 1;//快速慢速的分界速度
    this.startPointNum = 9;//必须大于5
    this.pointR = false;//快满速度转折点的半径
    this.history = [];
}
Writing.prototype.paintPoint = function(x1,y1,r1,x2,y2,r2,onDraw){
    let distance = Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
    let len = Math.ceil(distance/2) ;//步长
    for (var i = 0; i < len; i++) {
        let insideX = x1 + (x2-x1)*i/len;
        let insideY = y1 + (y2-y1)*i/len;
        let r = r1 + (r2-r1)*i/len;
        this.context.beginPath();
        this.context.arc(insideX,insideY,r,0,2*Math.PI,true);
        this.context.fill();
    }
    if(!onDraw){
        this.context.draw(true);
    }
};
Writing.prototype.caculateV = function(){//计算最后几个点的平均速度
    let dis = 0,tim = 0;
    for(var i=this.point.length-5;i<this.point.length;i++){
        dis+=this.point[i].distance?this.point[i].distance:0;
        if(this.point&&this.point[i-1]&&this.point[i-1].time){
            tim+=this.point[i].time-this.point[i-1].time;
        }
    }
    let v = dis/tim;
    return v;
};
Writing.prototype.throughVgetR = function(v){
   return Math.min(this.linePressure/v+this.lineMin,this.lineMax)/2;
}
Writing.prototype.paintLine = function(context,x1,y1,x2,y2,x3,y3,x4,y4){//根据传入的四个点画出包裹的贝塞尔填充图形
    let size = 1/5;//外边线圆滑度
    let xMid1=x2+size*(x3-x1),xMid2=x3-size*(x4-x2);
    let yMid1=y2+size*(y3-y1),yMid2=y3-size*(y4-y2);
    context.beginPath();
    context.setLineCap('round');
    context.setLineJoin('round');
    context.moveTo(x2,y2);
    let distance = Math.sqrt(Math.pow(x3-x2,2)+Math.pow(y3-y2,2));
    if(distance>10){
        context.bezierCurveTo(xMid1,yMid1,xMid2,yMid2,x3,y3);
    }else{
        context.lineTo(x3,y3);
    }
    context.lineTo(x4,y4);
    context.bezierCurveTo(x3,y3,x2,y2,x1,y1);
    context.closePath();
    context.fill();
    context.stroke();
    context.draw(true);
};
Writing.prototype.extendPoint = function(x1,y1,x2,y2,x3,y3){
    /*let fun = function(ax,ay,bx,by){
        return {
            x:(bx-ax)*2/3+bx,
            y:(by-ay)*2/3+by
        }
    };
    let midPoint = fun(x1,y1,x2,y2);
    let result = fun(midPoint.x,midPoint.y,x3,y3);
    return result;*/
    let size = 8/10;
    let distance = 6;
    let x = (x3-x2)+x3;
    let y = (y3-y2)+y3;
    if(
        Math.sqrt(Math.pow(x3-x2,2)+Math.pow(y3-y2,2))>distance
    ){
        return {
            x:x3+distance*size*((x3-x2)/Math.sqrt(Math.pow(x3-x2,2)+Math.pow(y3-y2,2))),
            y:y3+distance*size*((y3-y2)/Math.sqrt(Math.pow(x3-x2,2)+Math.pow(y3-y2,2))),
        }
    }else{
        return {x:(x3-x2)*size+x3,y:(y3-y2)*size+y3}
    }
};
Writing.prototype.clearAll = function(){
    context.draw();
    this.history = [];
};
Writing.prototype.clearOne = function(){
    let self = this;
    //context.draw();
    this.history.splice(this.history.length-1,1);
    console.log(this.history);
    for(var i=0;i<this.history.length;i++){
        for(var j=1;j<this.history[i].length;j++){

            this.paintPoint(
                this.history[i][j].x,
                this.history[i][j].y,
                this.history[i][j].r,
                this.history[i][j-1].x,
                this.history[i][j-1].y,
                this.history[i][j-1].r,
                true
            );
            /*
            this.paintPoint();
            this.context.arc(this.history[i][j].x,this.history[i][j].y,this.history[i][j].r,0,2*Math.PI,true);
            this.context.fill();
            */
        }
    }
    this.context.draw();
};
Writing.prototype.start = function(e){
    let x = e.touches[0].clientX,y=e.touches[0].clientY;
    this.point.push({x:x,y:y,r:0});
};
Writing.prototype.end = function(e){
    this.pointR = false;
    /* 最后一画 */
    /*if(this.point.length>5){
        let x1=this.point[this.point.length-3].x,x2=this.point[this.point.length-2].x,x3=this.point[this.point.length-1].x,x4=this.point[this.point.length-1].x;
        let y1=this.point[this.point.length-3].y,y2=this.point[this.point.length-2].y,y3=this.point[this.point.length-1].y,y4=this.point[this.point.length-1].y;
        this.paintLine(context,x1,y1,x2,y2,x3,y3,x4,y4);
    }*/
    /* !最后一画 */
    console.log('end');
    console.log(`x:${this.point[this.point.length-1].x},y:${this.point[this.point.length-1].y},r:${this.point[this.point.length-1].r}`);
    console.log(`x:${this.point[this.point.length-2].x},y:${this.point[this.point.length-2].y},r:${this.point[this.point.length-2].r}`);
    console.log(`x:${this.point[this.point.length-3].x},y:${this.point[this.point.length-3].y},r:${this.point[this.point.length-3].r}`);
    console.log(`x:${this.point[this.point.length-4].x},y:${this.point[this.point.length-4].y},r:${this.point[this.point.length-4].r}`);
    /*this.paintPoint(
        this.point[this.point.length-2].x,
        this.point[this.point.length-2].y,
        this.point[this.point.length-2].r,
        this.point[this.point.length-1].x,
        this.point[this.point.length-1].y,
        this.point[this.point.length-1].r,
    );*/
   let extendFun = function(self){
       //console.log('开始延伸！');
       let result1 = self.extendPoint(self.point[self.point.length-3].x,self.point[self.point.length-3].y,self.point[self.point.length-2].x,self.point[self.point.length-2].y,self.point[self.point.length-1].x,self.point[self.point.length-1].y);

       self.point.push({
           x:result1.x,
           y:result1.y,
           r:self.point[self.point.length-1].r*3/4
       });
       self.paintPoint(
           self.point[self.point.length-2].x,
           self.point[self.point.length-2].y,
           self.point[self.point.length-2].r,
           self.point[self.point.length-1].x,
           self.point[self.point.length-1].y,
           self.point[self.point.length-1].r,
       );
       /*console.log('----');
       console.log(
           '\n',
           self.point[self.point.length-2].x,'\n',
           self.point[self.point.length-2].y,'\n',
           self.point[self.point.length-2].r,'\n',
           '...','\n',
           self.point[self.point.length-1].x,'\n',
           self.point[self.point.length-1].y,'\n',
           self.point[self.point.length-1].r,'\n',
       );
       console.log(`x:${self.point[self.point.length-1].x},y:${self.point[self.point.length-1].y},r:${self.point[self.point.length-1].r}`);*/
       /*self.paintPoint(
           self.point[self.point.length-3].x,
           self.point[self.point.length-3].y,
           self.point[self.point.length-3].r,
           self.point[self.point.length-2].x,
           self.point[self.point.length-2].y,
           self.point[self.point.length-2].r,
       );*/


   };
    /*extendFun(this);
    console.log(this.point[this.point.length-1].r);
    extendFun(this);
    console.log(this.point[this.point.length-1].r);
    extendFun(this);
    console.log(this.point[this.point.length-1].r);*/
   do{
       extendFun(this);
   }while(this.point[this.point.length-1].r>1)
    this.history.push(this.point.map(function(obj){
        return {x:obj.x,y:obj.y,r:obj.r}
    }));
   console.log(this.history);
    this.point = [];
    //console.log(`end!\nmaxDistance:${maxDistance}\nminDiatance:${minDistance}`)
};
Writing.prototype.move = function(e){
    let x = e.touches[0].clientX,y=e.touches[0].clientY;
    let time = new Date().getTime(),diffTime = time - this.point[this.point.length-1].time;
    this.point.push({
        x:Number(x),
        y:Number(y),
        time:time,
    });
    let distance = Math.sqrt(Math.pow(this.point[this.point.length-1].x-this.point[this.point.length-2].x,2)+Math.pow(this.point[this.point.length-1].y-this.point[this.point.length-2].y,2));
    this.point[this.point.length-1].distance = distance;


    if(this.point.length<5){//画前s几个点,第4个点为转折点
        this.point[this.point.length-1].r = this.lineMax/2*this.point.length/this.startPointNum;
        let len = Math.ceil(distance/2) ;//步长
        for (var i = 0; i < len; i++) {
            let insideX = this.point[this.point.length-2].x + (this.point[this.point.length-1].x-this.point[this.point.length-2].x)*i/len;
            let insideY = this.point[this.point.length-2].y + (this.point[this.point.length-1].y-this.point[this.point.length-2].y)*i/len;
            let r = this.point[this.point.length-2].r + (this.point[this.point.length-1].r-this.point[this.point.length-2].r)*i/len;
            this.context.beginPath();
            this.context.arc(insideX,insideY,r,0,2*Math.PI,true);
            this.context.fill();
        }
        return
    }else if(this.point.length<this.startPointNum){//画前几个点
        let v = this.caculateV();
        let r= this.throughVgetR(v);
        if(this.point.length===this.startPointNum-1){
            console.log(`before:${this.point.length}:${r}`);
        };
        let pointR = this.point[3].r;
        this.point[this.point.length-1].r = pointR+(r-pointR)*(this.point.length-4)/(this.startPointNum-4);
        let len = Math.ceil(distance/2) ;//步长
        for (var i = 0; i < len; i++) {
            let insideX = this.point[this.point.length-2].x + (this.point[this.point.length-1].x-this.point[this.point.length-2].x)*i/len;
            let insideY = this.point[this.point.length-2].y + (this.point[this.point.length-1].y-this.point[this.point.length-2].y)*i/len;
            let r = this.point[this.point.length-2].r + (this.point[this.point.length-1].r-this.point[this.point.length-2].r)*i/len;
            this.context.beginPath();
            this.context.arc(insideX,insideY,r,0,2*Math.PI,true);
            this.context.fill();
        }
        return;
    }

    /*for(var i=this.point.length-5;i<this.point.length;i++){
        dis+=this.point[i].distance?this.point[i].distance:0;
        if(this.point&&this.point[i-1]&&this.point[i-1].time){
            tim+=this.point[i].time-this.point[i-1].time;
        }
    }
    let v = dis/tim;*/
    let v = this.caculateV();
    // if(v<this.VVV){
        this.point[this.point.length-1].r = Math.min(this.linePressure/v+this.lineMin,this.lineMax)/2;
        this.point[this.point.length-2].r = (this.point[this.point.length-2].r==0)?(this.pointR):(this.point[this.point.length-2].r);//确定快慢分界线之前的一个点的宽度
        this.pointR = false;
        //console.log(`离散点，第${this.point.length}个点，半径为:${this.point[this.point.length-1].r},前一个点的半径为:${this.point[this.point.length-2].r}，速度为：${v}`);
        console.log(`离散点，速度为：${v}`);
        //console.log(this.point[this.point.length-1].r);
        let len = Math.ceil(distance/2) ;//步长
        for (var i = 0; i < len; i++) {
            let insideX = this.point[this.point.length-2].x + (this.point[this.point.length-1].x-this.point[this.point.length-2].x)*i/len;
            let insideY = this.point[this.point.length-2].y + (this.point[this.point.length-1].y-this.point[this.point.length-2].y)*i/len;
            let r = this.point[this.point.length-2].r + (this.point[this.point.length-1].r-this.point[this.point.length-2].r)*i/len;
            this.context.beginPath();
            this.context.arc(insideX,insideY,r,0,2*Math.PI,true);
            this.context.fill();
        }
        this.context.draw(true);
    /*}else{
        if(this.pointR===false){
            this.pointR = this.point[this.point.length-2].r;
        }
        this.point[this.point.length-1].r = 0;
        /!* 转折点处收缩 *!/
        if(this.point[this.point.length-2].r!==0){
            let len = Math.ceil(distance/2) ;//步长
            for (var i = 0; i < len; i++) {
                let insideX = this.point[this.point.length-2].x + (this.point[this.point.length-1].x-this.point[this.point.length-2].x)*i/len;
                let insideY = this.point[this.point.length-2].y + (this.point[this.point.length-1].y-this.point[this.point.length-2].y)*i/len;
                let r = this.point[this.point.length-2].r + (this.point[this.point.length-1].r-this.point[this.point.length-2].r)*i/len;
                this.context.beginPath();
                this.context.arc(insideX,insideY,r,0,2*Math.PI,true);
                this.context.fill();
            }
        }
        this.context.draw(true);
        /!* !转折点处收缩 *!/
        //console.log(`贝塞尔，第${this.point.length}个点，半径为${this.pointR}，速度为：${v}`);
        console.log(`贝塞尔，速度为：${v}`);
        this.penSize = this.pointR*2;
        this.context.setLineWidth(this.penSize);
        let x1=this.point[this.point.length-4].x,x2=this.point[this.point.length-3].x,x3=this.point[this.point.length-2].x,x4=this.point[this.point.length-1].x;
        let y1=this.point[this.point.length-4].y,y2=this.point[this.point.length-3].y,y3=this.point[this.point.length-2].y,y4=this.point[this.point.length-1].y;
        this.paintLine(this.context,x1,y1,x2,y2,x3,y3,x4,y4);
    }*/
}
/* ！构造函数 */

var pen  = new Writing();
Page({
  data: {
      show: false,
      windowHeight:''
  },
  onLoad() {
    // wx.getUserInfo();
    let systemInfo = wx.getSystemInfoSync();
    //console.log(this);
    this.setData({
        windowHeight: systemInfo.windowHeight-50+'px',
        show:true
    })
  },
  onReady(e){
      /*context.drawImage('../../image/logo.jpg', 150,150,100,100);
      context.draw();*/
  },
  touchStart(e){
      pen.start(e);
  },
  touchMove(e){
      pen.move(e);
  },
  touchEnd(e){
      pen.end(e);
  },
  clearAll(e){
      //console.log(e);
      pen.clearAll();
      /*context.drawImage('../../image/logo.jpg', 150,150,100,100);
      context.draw(true);*/
  },
  clearOne(e){
      pen.clearOne();
      // context.drawImage('../../image/logo.jpg', 150,150,100,100);
      // context.draw(true);
  }
})
