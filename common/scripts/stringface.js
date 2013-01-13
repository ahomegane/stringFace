(function(doc, win) {
  
  var winW = 465,
      winH = 465;

  win.addEventListener('DOMContentLoaded', function() {
    
    //start!
    var iStrF = new StringFace();
    iStrF.lunch();

    //for full screen
    var container = doc.getElementById('container');
    keepFullWinCenter();

    function keepFullWinCenter() {
      var fullWinW = doc.documentElement.clientWidth || doc.body.clientWidth;
        fullWinH = doc.documentElement.clientHeight || doc.body.clientHeight;
      container.style.left = (fullWinW - container.offsetWidth)/2 + 'px';
      container.style.top = (fullWinH - container.offsetWidth)/2 + 'px';
    }
    win.addEventListener('resize', function(e) {
      keepFullWinCenter();
    },false);

  },false);

  
  /**
  * StringFace Class
  * this content main process
  */
  var StringFace = function() {

    this.imageData;

    this.ascii;

    this.el = {};
    this.ctx;

    this.winW = winW;
    this.winH = winH;

    this.fileDropIsClose = true;

    this.sampleNum = -1;
    this.samplePic = [
      '/common/images/sample_01.jpg',
      '/common/images/sample_02.jpg',
      '/common/images/sample_03.jpg',
      '/common/images/sample_04.jpg',
      '/common/images/sample_05.jpg',
      '/common/images/sample_06.jpg',
      '/common/images/sample_07.jpg'
    ];

    this.asciiFontSize = 10;
    this.asciiLH = {def:0.35, unitStr:'', large:0.5};
    this.asciiLS = {def:0, unitStr:'em', large:0.2};

    this.charsSize = 3;
    this.chars = [
      ['&nbsp;','&nbsp;','&nbsp;','&nbsp;','&nbsp;','&nbsp;'],//0
      ['(','(','(','(','(','('],//1
      [')',')',')',')',')',')'],//2
      ['_','_','_','_','_','_'],//3
      ['-','=','-','=','-','='],//4
      ['`','^','`','^','`','^'],//5
      ['|','i',':','1','I','!'],//6
      ['r','a','a','a','+','s']//7
    ]
    this.charsMatch = [
      [[0,0,0],[0,0,0],[0,0,0]],//0
      [[0,0,1],[1,0,0],[0,0,1]],//1
      [[1,0,0],[0,0,1],[1,0,0]],//2
      [[0,0,0],[0,0,0],[1,1,1]],//3
      [[0,0,0],[1,1,1],[0,0,0]],//4
      [[1,1,1],[0,0,0],[0,0,0]],//5
      [[0,1,0],[0,1,0],[0,1,0]]//6
      //other 7
    ]

  }
  StringFace.prototype = {

    lunch: function() {
      
      this.el.canvas = doc.getElementById('base');
      this.ctx = this.el.canvas.getContext('2d');

      this.el.canvas.width = this.winW;
      this.el.canvas.height = this.winH;

      this.el.ascii = doc.getElementById('ascii');

      this.el.originalPic = doc.querySelector('#originalPic');

      this.setupSampleImage();

      var self = this;

      this.el.btnChangeSample = doc.querySelector('#btns .changeSample');
      this.el.btnChangeSample.addEventListener('click',function(e){
        self.setupSampleImage();
        e.preventDefault();
      },false);

      this.el.btnUserDrop = doc.querySelector('#btns .userDrop');
      this.el.btnUserDrop.addEventListener('click',function(e){
        if(self.fileDropIsClose) {
          self.fileDropIsClose = false;
          self.el.btnUserDrop.innerHTML = '閉じる';
          self.el.btnUserDrop.classList.add('close');
          self.setupFileDrop();

        } else {
          self.fileDropIsClose = true;
          self.el.btnUserDrop.innerHTML = '画像を追加';
          self.el.btnUserDrop.classList.remove('close');
          self.iFileDrop.hideWindow();

        }
        e.preventDefault();
      },false);

    },

    setupSampleImage: function() {

      //init
      this.el.originalPic.innerHTML = '';
      this.el.ascii.innerHTML = '';

      this.sampleNum = this.sampleNum == this.samplePic.length-1 ? 0 : this.sampleNum + 1;

      var img = doc.createElement('img');
      img.src = this.samplePic[this.sampleNum];
      
      var self = this;
      img.addEventListener('load', function() {

        var w = parseInt(img.width);
        var h = parseInt(img.height);
        
        var canvas = doc.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        
        var imageData = ctx.getImageData(0,0,w,h);

        self.el.originalPic.appendChild(img);

        self.imageData = imageData;

        self.appendAsciiHtml(self);

      },false);

    },

    setupFileDrop: function() {

      if(this.iFileDrop) {
        this.iFileDrop.showWindow();

      } else {
        this.iFileDrop = new FileDrop('fileReader', 'dropArea');
        this.iFileDrop.showWindow();

        var self = this;
        this.iFileDrop.createWindow(function(imageData,img) {

          //init
          self.el.originalPic.innerHTML = '';
          self.el.ascii.innerHTML = '';

          self.el.originalPic.appendChild(img);

          self.imageData = imageData;

          self.appendAsciiHtml(self);

          self.fileDropIsClose = true;
          self.iFileDrop.hideWindow();
          self.el.btnUserDrop.innerHTML = '画像を追加';
          self.el.btnUserDrop.classList.remove('close');

        });
      }
    },

    appendAsciiHtml: function(self) {

      self.iCanny = new CannyEdgeDetecotor({
        imageData: self.imageData,
        //以下省略可
        GaussianSiguma: 5,
        GaussianSize: 5,
        hysteresisHeigh: 120,
        hysteresisLow: 10,
        isConvertGrayScale: true,
        isApplyGaussianFilter: true,
        isApplySobelFilter: true,
        isHysteresisThreshold: true
      });

      var asciiHtml = self.convertAscii(self.imageData);
      self.el.ascii.innerHTML = asciiHtml;

      self.animationStep(100);
    
      //self.ctx.putImageData(self.imageData,0,0);

    },

    convertAscii: function(imageData) {

      var color = (this.iCanny.imageDataToColorMatrix(imageData, true)).origin;

      var heighVal = this.iCanny.edgeHeighVal, 
          lowVal = this.iCanny.edgeLowVal;

      this.charsMatch = this.convertHeighLowVal(this.charsMatch, heighVal, lowVal);

      var w = imageData.width, h = imageData.height;
      var ascii = [];

      var asciiX = 0;
      for(var x=0;x<w;x++) {
        if(x%this.charsSize == 0) {
          ascii[asciiX] = [];

          var asciiY = 0;
          for(var y=0;y<h;y++) {
            if(y%this.charsSize == 0) {

              var isMatchOverride = false, checkedAll = this.charsSize*this.charsSize;
              for(var match = 0; match < this.charsMatch.length; match++) {
                
                var isNoMatch = false, checkedCount = -1;
                for(var ix=0;ix<this.charsSize;ix++) {
                  for(var iy=0;iy<this.charsSize;iy++) {
                    
                    var _x = x + ix,
                        _y = y + iy;
                    checkedCount++;

                    if(_x < w && _y < h) {
                      if(color[_x][_y] != this.charsMatch[match][iy][ix]) {
                        isNoMatch = true;
                      }
                    } else {//画像の端
                      isNoMatch = true;
                      //強制的に0にmatchしたとする
                      isMatchOverride = true;
                    }

                    if(isNoMatch) break;
                  }
                  if(isNoMatch) break;
                }

                //match!
                if(checkedCount == checkedAll-1 || isMatchOverride) {
                  var random = Math.floor(Math.random() * this.chars[match].length);
                  if(isMatchOverride) {//強制的に0にmatchしたとする
                    ascii[asciiX][asciiY] = this.chars[0][random];
                  } else {
                    ascii[asciiX][asciiY] = this.chars[match][random];
                  }
                  break;
                }
                //すべてマッチしなかった場合
                if(match == this.charsMatch.length-1){
                  var random = Math.floor(Math.random() * this.chars[match].length);
                  ascii[asciiX][asciiY] = this.chars[this.chars.length-1][random];
                  break;
                }

              }

              asciiY++;
            }
          }
          asciiX++;
        }
      }

      this.ascii = ascii;

      return this.makeAsciiHtmlData(ascii);

    },

    //only use convertAscii
    convertHeighLowVal: function(charsMatch, heighVal, lowVal) {

      for(var i=0; i<charsMatch.length; i++) {
        for(var x=0; x<this.charsSize; x++) {
          for(var y=0; y<this.charsSize; y++) {
            if(charsMatch[i][x][y] == 1) {
              charsMatch[i][x][y] = heighVal;
            } else if(charsMatch[i][x][y] == 0) {
              charsMatch[i][x][y] = lowVal;
            }
          } 
        } 
      }
      return charsMatch;

    },

    //only use convertAscii
    makeAsciiHtmlData: function(ascii) {
      var html = '';
      for (var y=0; y<ascii[0].length; y++) {
        for(var x=0; x<ascii.length; x++) {
          html += ascii[x][y];
        }
        html += '<br />' + '\n';
      }
      return html;
    },

    animationStep: function(stepMax, stepCount) {
      
      var self = this;
      var random = Math.random() * 100,
          stepCount = stepCount || 0,
          stepMax = 5;

      self.el.ascii.style.color = self.calculateRandomXColor(0xFFFF99, 0x0000CC);

      if(random >= 50) {
        //toggle lineHeight
        self.animation(50, 'lineHeight', self.asciiLH.unitStr, self.asciiLH.def, self.asciiLH.large, function(){
          self.animation(50, 'lineHeight', self.asciiLH.unitStr, self.asciiLH.large, self.asciiLH.def);
          callbackCommon();
        });
      } else {
        //toggle letterSpacing
        self.animation(50, 'letterSpacing', self.asciiLS.unitStr, self.asciiLS.def, self.asciiLS.large, function(){
          self.animation(50, 'letterSpacing', self.asciiLS.unitStr, self.asciiLS.large, self.asciiLS.def);
          callbackCommon();
        });
      }

      /**
      * @inner
      */
      function callbackCommon() {
        self.el.ascii.style.color = '#000';

        stepCount++;
        
        if(stepCount < stepMax) {
          self.animationStep(stepMax, stepCount);
        }
      }

    },

    animation: function(speed, prop, propUnitStr, startVal, endVal, callback) {
      var self = this;
      
      var start = +(new Date),
          end = speed,
          addVal = endVal - startVal;

      (function step(){

        var progress = +(new Date) - start;

        var curVal = startVal + addVal * progress/end;

        self.el.ascii.style[prop] = curVal + propUnitStr;

        if(progress > end) {
          self.el.ascii.style[prop] = endVal + propUnitStr;
          if(typeof callback == 'function') callback();
        } else {
          requestAnimationFrame(step);
        }

      })();

    },

    //16進数の色の数値のランダムに生成
    //maxval〜minval(16進数指定 0x******)を指定
    //http://www.nthelp.com/colorcodes.htm
    calculateRandomXColor: function(maxVal, minVal) {
      if(maxVal == null) maxVal = 0xffffff;
      if(minVal == null) minVal = 0x000000;
      //色指定は3or6桁である必要条件。そのため、'000000'を＋し、後ろから6桁をslice
      var rv = '000000' + (Math.floor(Math.random() * (maxVal-minVal)) + minVal).toString(16);
      rv = '#' + rv.slice(-6);
      return rv;
    },

    playMusic: function() {

      this.el.audio = doc.createElement('audio');


    }

  }

  /**
  * FileDrop Class
  */
  var FileDrop = function(fileReaderId, dropAreaId){

    this.el = {};
    this.el.fileReader = doc.getElementById(fileReaderId);
    this.el.dropArea = doc.getElementById(dropAreaId);

    this.winW = winW;
    this.winH = winH;

    this.reader;

  };
  FileDrop.prototype = {
    
    createWindow : function(callback) {    
      
      this.el.dropArea.style.left = (this.winW - this.el.dropArea.offsetWidth)/2 + 'px';
      this.el.dropArea.style.top = (this.winH - this.el.dropArea.offsetHeight)/2 + 'px';

      this.el.dropArea.addEventListener('dragover',function(e) {
        e.preventDefault();
      },false);
      
      var self = this;
      this.el.dropArea.addEventListener('drop',function(e) {
        e.preventDefault();
        self.droped(e, callback, self);
      },false);
      
    },
    
    droped: function(e,callback,self) {
      
      try {
        var file = e.dataTransfer.files[0];
        self.reader = new FileReader();
      } catch(e) {
        alert('fileApiに対応したブラウザ(chrome,firefoxなど)で閲覧ください');
      }
      
      if(!/^image/.test(file.type)) {
        alert('画像ファイルをドロップしてください');
      }
      
      self.reader.addEventListener('load', function(e) {

        var img = doc.createElement('img');
        img.src = self.reader.result;
        
        img.addEventListener('load', function() {
          var w = parseInt(img.width);
          var h = parseInt(img.height);
          
          var canvas = doc.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img,0,0);
          
          var imageData = ctx.getImageData(0,0,w,h);
          
          if(typeof callback == 'function') callback(imageData,img);

        },false);

      }, false);

      self.reader.readAsDataURL(file);
    },
        
    closeWindow:function(){
      this.el.fileReader.innerHTML = '';
    },

    showWindow: function() {
       this.el.fileReader.style.display = 'block';
    },

    hideWindow: function() {
       this.el.fileReader.style.display = 'none';
    }

  }
  
  /**
  * CannyEdgeDetector Class
  */
  var CannyEdgeDetecotor = function(args) {
    
    this.imageData = args.imageData;
    //params
    this.GaussianSiguma = args.GaussianSiguma || 4;
    this.GaussianSize = args.GaussianSize || 5;
    this.hysteresisHeigh = args.hysteresisHeigh || 100;
    this.hysteresisLow = args.hysteresisLow || 30;
    //実行制御
    this.isConvertGrayScale = args.isConvertGrayScale != null ? args.isConvertGrayScale : true;
    this.isApplyGaussianFilter = args.isApplyGaussianFilter != null ? args.isApplyGaussianFilter : true;
    this.isApplySobelFilter = args.isApplySobelFilter != null ? args.isApplySobelFilter : true;
    if(this.isApplySobelFilter == true) {
      this.isHysteresisThreshold = args.isHysteresisThreshold != null ? args.isHysteresisThreshold : true;
    } else {
      this.isHysteresisThreshold = false;
    }

    this.color;//color matrix
    
    /**
    * this.convertGrayScaleでtrueに変更。
    * this.colorMatrixToImageData および this.imageDataTocolorMatrix は、この値により処理を分岐。
    * trueの場合： this.color = [], falseの場合： this.color={r:[], g:[], b[]}　として扱う。
    * グレースケールおよびカラー、両方とも可能なfilterの場合は処理を分岐させる。
    */
    this.isGrayScale = false;

    //for sobel filter
    this.edge;//edge matrix
    this.edgeDir;//edgeDir matrix

    this.edgeHeighVal = 255;
    this.edgeLowVal = 0;
    
    return this.init();
    
  }
  CannyEdgeDetecotor.prototype = {
    
    init: function() {
      if(this.isConvertGrayScale) this.convertGrayScale(this.imageData);
      if(this.isApplyGaussianFilter) this.applyGaussianFilter(this.imageData, this.GaussianSiguma, this.GaussianSize);
      if(this.isApplySobelFilter) this.applySobelFilter(this.imageData);
      if(this.isHysteresisThreshold) this.hysteresisThreshold(this.imageData, this.hysteresisHeigh, this.hysteresisLow);
    },
    
    convertGrayScale: function(imageData) {
      
      this.isGrayScale = true;
      
      var data = imageData.data, pixels = data.length/4;
      for(var i=0,l=pixels; i<l; i++) {
        var r = data[i*4], g = data[i*4+1],b = data[i*4+2];
        var g = parseInt((11*r + 16*g + 5*b) / 32);
        
        data[i*4] = g;
        data[i*4+1] = g;
        data[i*4+2] = g;
      }
      
    },
    
    applyGaussianFilter: function(imageData,siguma,filterW) {
      
      //make filter
      var filter = [];
      var k = 1 / Math.sqrt(2 * Math.PI) / siguma;
      for(var x=0;x<filterW;x++) {
        filter[x] = [];
        for(var y=0;y<filterW;y++) {
          var _x = x-parseInt(filterW/2-0.5),//中心座標を0に
            _y = y-parseInt(filterW/2-0.5);
          filter[x][y] = k * Math.exp(-(_x * _x + _y * _y) / (2 * siguma * siguma));
        }
      }
      
      var color = this.imageDataToColorMatrix(imageData);
      
      var w = imageData.width, h = imageData.height;

      //filter
      for(var x=0;x<w;x++) {
        for(var y=0;y<h;y++) {
          for(var xf=0;xf<filterW;xf++) {
            for(var yf=0;yf<filterW;yf++) {
              
              var _xf= xf-parseInt(filterW/2-0.5),
                _yf= yf-parseInt(filterW/2-0.5);
              if((x+_xf) > -1 && (y+_yf) > -1 && (x+_xf) < w && (y+_yf) < h) {
                if(this.isGrayScale) {
                  color.origin[x+_xf][y+_yf] += color.copy[x][y]*filter[xf][yf];
                } else {
                  color.origin.r[x+_xf][y+_yf] += color.copy.r[x][y]*filter[xf][yf];
                  color.origin.g[x+_xf][y+_yf] += color.copy.g[x][y]*filter[xf][yf];
                  color.origin.b[x+_xf][y+_yf] += color.copy.b[x][y]*filter[xf][yf];                  
                }
              }
              
            }
          }
        }
      }
      
      this.colorMatrixToImageData(color.origin, imageData, filterW);
      //override color matrix
      this.color = color.origin;
      
    },
    
    applySobelFilter: function(imageData) {
      
      if(!this.isGrayScale) {
        this.convertGrayScale(imageData);
      }
      
      //filter
      var filterHx = [[-1,0,1],[-2,0,2],[-1,0,1]],
        filterHy = [[-1,-2,-1],[0,0,0],[1,2,1]];
      
      var filterHxW = filterHx.length,
        filterHyW = filterHy.length;
      
      var colorHx = this.imageDataToColorMatrix(imageData),
        colorHy = this.imageDataToColorMatrix(imageData);
      
      var color = [];

      var edge = [], edgeDir = [], rad = [];
      
      var w = imageData.width, h = imageData.height;
      
      //filter
      for(var x=0;x<w;x++) {
        edge[x] = [];
        edgeDir[x] = [];
        rad[x] = [];
        for(var y=0;y<h;y++) {
          
          //sobel filter
          for(var xf=0;xf<filterHxW;xf++) {
            for(var yf=0;yf<filterHxW;yf++) {
              
              var _xf= xf-parseInt(filterHxW/2-0.5),
                _yf= yf-parseInt(filterHxW/2-0.5);
              
              if((x+_xf) > -1 && (y+_yf) > -1 && (x+_xf) < w && (y+_yf) < h) {
                //colorHx
                colorHx.origin[x][y] += colorHx.copy[x+_xf][y+_yf]*filterHx[xf][yf];
                //colorHy
                colorHy.origin[x][y] += colorHy.copy[x+_xf][y+_yf]*filterHy[xf][yf];
              }
              
            }
          }
          
          //edge
          edge[x][y] = Math.sqrt(Math.abs(colorHx.origin[x][y] * colorHx.origin[x][y] - colorHy.origin[x][y]*colorHy.origin[x][y]));
          
          //edge dir
          rad[x][y] = Math.abs(Math.atan2(colorHy.origin[x][y] , colorHx.origin[x][y]))*180/Math.PI;
          if (0 < rad[x][y] && rad[x][y] <= 22.5) {
            // 0 deg
            edgeDir[x][y] = 0;
          } else if (22.5 < rad[x][y] && rad[x][y] <= 67.5) {
            // 45 deg
            edgeDir[x][y] = 45;
          } else if (67.5 < rad[x][y] && rad[x][y] <= 112.5) {
            // 90 deg
            edgeDir[x][y] = 90;
          } else if (112.5 < rad[x][y] && rad[x][y] <= 157.5){
            // 135 deg
            edgeDir[x][y] = 135;
          } else {
            // 0 deg
            edgeDir[x][y] = 0;
          }
          
        }
      }
      
      //detect edge
      for(var x=0;x<w;x++) {
        color[x] = [];
        
        for(var y=0;y<h;y++) {
          if((x-1) > -1 && (y-1) > -1 && (x+1) < w && (y+1) < h) {
            // 0 deg
            if(edgeDir[x][y] == 0) {
              if(edge[x][y]>edge[x][y-1] && edge[x][y]>edge[x][y+1]) {
                color[x][y] = edge[x][y];
              } else {
                color[x][y] = 0;
              }
            // 45 deg
            } else if(edgeDir[x][y] == 45) {
              if(edge[x][y]>edge[x-1][y-1] && edge[x][y]>edge[x+1][y+1]) {
                color[x][y] = edge[x][y];           
              } else {
                color[x][y] = 0;
              }
            // 90 deg
            } else if(edgeDir[x][y] == 90) {
              if(edge[x][y]>edge[x-1][y] && edge[x][y]>edge[x+1][y]) {
                color[x][y] = edge[x][y];
              } else {
                color[x][y] = 0;
              }
            // 135 deg
            } else if(edgeDir[x][y] == 135) {
              if(edge[x][y]>edge[x-1][y+1] && edge[x][y]>edge[x+1][y-1]) {
                color[x][y] = edge[x][y];
              } else {
                color[x][y] = 0;
              }
            }
          } else {
            color[x][y] = 0;
          }
        }
      }
      
      //this.colorMatrixToImageData(colorHx.origin, imageData, filterHxW);
      //this.colorMatrixToImageData(colorHy.origin, imageData, filterHxW);
      //this.colorMatrixToImageData(edge, imageData, filterHxW);      
      this.colorMatrixToImageData(color, imageData, 1);
      
      //override color matrix
      this.color = color;
      
      this.edge = edge;
      this.edgeDir = edgeDir;
      
    },
    
    hysteresisThreshold: function(imageData, heigh, low) {
      
      var color = this.color, edgeDir = this.edgeDir;
      
      var w = imageData.width, h = imageData.height;

      var isEdge = []; // edge flag matrix 1:edge, 0:noEdge, 2: middle
      
      //height, low, mid に分解
      for(var x=0;x<w;x++) {
        isEdge[x] = [];
        for(var y=0;y<h;y++) {
          if(color[x][y] > heigh) {
            isEdge[x][y] = 1;
          } else if(color[x][y] < low){
            isEdge[x][y] = 0;
          } else {
            isEdge[x][y] = 2;
          }
        }
      }
      
      var isEdgeCopy = this.copyArray2d(isEdge);
      
      //this.trackMiddle用に一旦解放
      this.isEdge = isEdge;
      this.isEdgeCopy = isEdgeCopy;
      this.w = w;
      this.h = h;
      this.edgeDir = edgeDir;
      
      //midを処理
      for(var x=0;x<w;x++) {
        for(var y=0;y<h;y++) {
                    
          if(isEdgeCopy[x][y] == 1) {
            if((x-1) > -1 && (y-1) > -1 && (x+1) < w && (y+1) < h) {
              // 0 deg
              if(edgeDir[x][y] == 0) {
                if(isEdgeCopy[x+1][y] == 2) {
                  //追跡開始
                  var storeTrackDataA = [];//edgeの追跡データを保存
                  this.trackMiddle(x,y,x+1,y,storeTrackDataA);
                }
                if(isEdgeCopy[x-1][y] == 2) {
                  //追跡開始
                  var storeTrackDataB = [];//edgeの追跡データを保存
                  this.trackMiddle(x,y,x-1,y,storeTrackDataB);
                }
              // 45 deg
              } else if(edgeDir[x][y] == 45) {
                if(isEdgeCopy[x+1][y-1] == 2) {
                  var storeTrackDataA = [];
                  this.trackMiddle(x,y,x+1,y-1,storeTrackDataA);
                }
                if(isEdgeCopy[x-1][y+1] == 2) {
                  var storeTrackDataB = [];
                  this.trackMiddle(x,y,x-1,y+1,storeTrackDataB);
                }
              // 90 deg
              } else if(edgeDir[x][y] == 90) {
                if(isEdgeCopy[x][y-1] == 2) {
                  var storeTrackDataA = [];
                  this.trackMiddle(x,y,x,y-1,storeTrackDataA);
                }
                if(isEdgeCopy[x][y+1] == 2) {
                  var storeTrackDataB = [];
                  this.trackMiddle(x,y,x,y+1,storeTrackDataB);
                }
              // 135 deg
              } else if(edgeDir[x][y] == 135) {
                if(isEdgeCopy[x-1][y-1] == 2) {
                  var storeTrackDataA = [];
                  this.trackMiddle(x,y,x-1,y-1,storeTrackDataA);
                }
                if(isEdgeCopy[x+1][y+1] == 2) {
                  var storeTrackDataB = [];
                  this.trackMiddle(x,y,x+1,y+1,storeTrackDataB);
                }
              }
              
            }
          }
          
        }
      }//for
      
      //isEdge→color
      for(var x=0;x<w;x++) {
        for(var y=0;y<h;y++) {
          if(isEdge[x][y] == 1) {
            color[x][y] = this.edgeHeighVal;
          } else {
            color[x][y] = this.edgeLowVal;
          }
        }
      }
      
      this.colorMatrixToImageData(color, imageData);
      
      //override color matrix
      this.color = color;

    },
    
    //only use hysteresisThreshold
    trackMiddle: function(beforeX,beforeY,afterX,afterY,storeTrackData) {
      
      var x = afterX, y = afterY, _x = beforeX, _y = beforeY;
      
      if((x-1) > -1 && (y-1) > -1 && (x+1) < this.w && (y+1) < this.h) {
          // 0 deg
          if(this.edgeDir[x][y] == 0) {
            if( _x != x+1 && _y != y) {
              if(this.isEdgeCopy[x+1][y] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x+1,y,storeTrackData);
              } else if(this.isEdgeCopy[x+1][y] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x-1 && _y != y) {
              if(this.isEdgeCopy[x-1][y] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x-1,y,storeTrackData);
              } else if(this.isEdgeCopy[x-1][y] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
          // 45 deg
          } else if(this.edgeDir[x][y] == 45) {
            if( _x != x+1 && _y != y-1) {
              if(this.isEdgeCopy[x+1][y-1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x+1,y-1,storeTrackData);
              } else if(this.isEdgeCopy[x+1][y-1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x-1 && _y != y+1) {
              if(this.isEdgeCopy[x-1][y+1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x-1,y+1,storeTrackData);
              } else if(this.isEdgeCopy[x-1][y+1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
          // 90 deg
          } else if(this.edgeDir[x][y] == 90) {
            if( _x != x && _y != y-1) {
              if(this.isEdgeCopy[x][y-1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x,y-1,storeTrackData);
              } else if(this.isEdgeCopy[x][y-1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x && _y != y+1) {
              if(this.isEdgeCopy[x][y+1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x,y+1,storeTrackData);
              } else if(this.isEdgeCopy[x][y+1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            
          // 135 deg
          } else if(this.edgeDir[x][y] == 135) {
            if( _x != x-1 && _y != y-1) {
              if(this.isEdgeCopy[x-1][y-1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x-1,y-1,storeTrackData);
              } else if(this.isEdgeCopy[x-1][y-1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x+1 && _y != y+1) {
              if(this.isEdgeCopy[x+1][y+1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x+1,y+1,storeTrackData);
              } else if(this.isEdgeCopy[x+1][y+1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            
          }
        } else {
          this.drawLine(storeTrackData, 1);
        }

    },
    
    //only use hysteresisThreshold
    drawLine: function(storeTrackData, edgeVal) {

      for(var i = 0, l = storeTrackData.length; i < l; i++) {
        if(edgeVal == 1) {
          this.edge[storeTrackData[i].x, storeTrackData[i].y] = 1;          
        } else {
          this.edge[storeTrackData[i].x, storeTrackData[i].y] = 0;
        }
      }

    },
    
    imageDataToColorMatrix: function(imageData, isGrayScale) {
      
      var data = imageData.data, pixels = data.length/4, 
        w = imageData.width, h = imageData.height;

      isGrayScale = isGrayScale || this.isGrayScale;
    
      if(isGrayScale) {
        //color matrix
        var color = [],
          colorCopy = [];
        
        //imageData→color matrix
        for(var x=0;x<w;x++) {
          color[x] = []; 
          colorCopy[x] = [];
          for(var y=0;y<h;y++) {
            color[x][y] = data[(x + (y*w)) * 4 ];
            colorCopy[x][y] = data[(x + (y*w)) * 4];
          }
        }
      } else {
        //color matrix
        var color = {r:[],g:[],b:[]},
          colorCopy = {r:[],g:[],b:[]};
        
        //imageData→color matrix
        for(var x=0; x<w; x++) {
          color.r[x] = []; color.g[x] = []; color.b[x] = [];
          colorCopy.r[x] = []; colorCopy.g[x] = []; colorCopy.b[x] = []; 
          for(var y=0;y<h;y++) {
            color.r[x][y] = data[(x + (y*w)) * 4 ];
            color.g[x][y] = data[(x + (y*w)) * 4 + 1];
            color.b[x][y] = data[(x + (y*w)) * 4 + 2];
            colorCopy.r[x][y] = data[(x + (y*w)) * 4 ];
            colorCopy.g[x][y] = data[(x + (y*w)) * 4 + 1];
            colorCopy.b[x][y] = data[(x + (y*w)) * 4 + 2];
          }
        }
      }

      return {origin: color, copy: colorCopy};

    },
    
    colorMatrixToImageData: function(color, imageData, filterW, isGrayScale) {
      
      var data = imageData.data, pixels = data.length/4, 
        w = imageData.width, h = imageData.height;
      
      filterW = filterW || 1;
      isGrayScale = isGrayScale || this.isGrayScale;

      if(this.isGrayScale) {
        //color matrix→imageData
        for(var i=0,l=pixels; i<l; i++) {
          var x = i%w, y = parseInt(i/w);        
          data[i*4] = color[x][y]/filterW;
          data[i*4+1] = color[x][y]/filterW;
          data[i*4+2] = color[x][y]/filterW;
        }
      } else {
        //color matrix→imageData
        for(var i=0,l=pixels; i<l; i++) {
          var x = i%w, y = parseInt(i/w);        
          data[i*4] = color.r[x][y]/filterW;
          data[i*4+1] = color.g[x][y]/filterW;
          data[i*4+2] = color.b[x][y]/filterW;
        }
      }

    },
    
    copyArray2d: function(arr) {
      var rArr = [];
      
      var w = arr.length, h = arr[0].length;
      
      for(var x = 0; x < w; x++) {
        rArr[x] = [];
        for(var y = 0; y < h; y++) {
          rArr[x][y] = arr[x][y];
        } 
      }
      
      return rArr;
    }
  
  }

if(!window.console){
  window.console = {};
  window.console.log = function(c){
  return c;
  //alert(c);
  };
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           function(f) { return window.setTimeout(f, 1000 / 60); };
  }());
  window.cancelRequestAnimationFrame = (function() {
    return window.cancelRequestAnimationFrame ||
           window.webkitCancelRequestAnimationFrame ||
           window.mozCancelRequestAnimationFrame ||
           window.msCancelRequestAnimationFrame ||
           window.oCancelRequestAnimationFrame ||
           function(id) { window.clearTimeout(id); };
  }());
}

})(document, window);
