import { Component, OnInit, ViewChild, HostListener, Renderer } from '@angular/core';
import {Pages} from '../../../interfaces/pages'
import {Tracking} from '../../../interfaces/tracking'
import { log } from 'util';
declare const pdfjsLib:any
declare const fabric: any;

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

  //referring the canvas element
  @ViewChild('myCanvas',null) canvas:any;
  @ViewChild('backgroundImage',null) background:any;

  //# Essentials
  imgObj:any;
  URL:any
  canvasElement: any;
  canvasEl: any;
  backgroundCanvas:any;
  scrHeight:any;
  scrWidth:any;
  globalListenFunc: Function;
  mouseControl:boolean = false;
  page:number;
  notebook:any=[];
  // for PDF.js
  pdf_js:any;
  localUrl:any;
  no_of_pages: any;
  //PDF tracking
  pageTracking:Tracking[] = [];
  pdf_added_boolean:boolean = false
  //## content declarations
  ctx:any;

  // fileUpload
  filePath:string;


  //tools
  penColour:any;

  // basic_tools booleans
basic_tools = {
  normalPen: false,
  brushPen:false,
  highlighter: false,
}

  //# toolbox declarations
  //## Normal pen
  normalPen_startX:number;
  normalPen_startY:number;
  normalPen_currentX:number;
  normalPen_currentY:number;
  normalPen_endX:number;
  normalPen_endY:number;

 calligraphy_tool = {
   calligraphy_startX:-1,
   calligraphy_startY:-1,
   calligraphy_currentX:-1,
   calligraphy_currentY:-1,
   calligraphy_endX:-1,
   calligraphy_endY:-1,
 }
 highlighter_tool = {
  highlighter_startX:-1,
  highlighter_startY:-1,
  highlighter_currentX:-1,
  highlighter_currentY:-1,
  highlighter_endX:-1,
  highlighter_endY:-1,
}

  //getting screen Width and height automatically triggers when dimension changes
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
        this.scrHeight = window.innerHeight;
        this.scrWidth = window.innerWidth-220;

  }

  constructor(public renderer:Renderer) {
    this.getScreenSize();
  }

  ngOnInit() {
  this.page = 0;
  console.log("Screen width :", this.scrWidth, "Screen height", this.scrHeight );
  //adding fabricJS
  //referring my canvas
  this.canvasEl = new fabric.Canvas('my_canvas');
  // get 2d context to draw on (the "bitmap" mentioned earlier)
  this.ctx = this.canvasEl.getContext('2d');
  this.resizecanvas()
  }

  // for resizing the canvas based on the scr size
  resizecanvas(){
    const outerCanvasContainer = document.getElementById('outerCanvasContainer');
    const ratio = this.canvasEl.getWidth() / this.canvasEl.getHeight();
    const containerWidth   = this.scrWidth;
    const containerHeight  = this.scrWidth;
    const scale = containerWidth / this.canvasEl.getWidth();
    const zoom  = this.canvasEl.getZoom() * scale;
    console.log(containerWidth,"containerWidth",containerHeight,"containerHeight",scale,"scale",zoom,"zoom");
    this.canvasEl.setDimensions({width: containerWidth, height: containerWidth / ratio});
    this.canvasEl.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
  }

  nextPage(){
    //Save the page content
    let obj = {
      page: this.page,
      data: this.canvasEl.toJSON()
    }

    //if page number is there then update the array else append the in the array
    this.upsert(this.notebook,obj)
    console.log("Page number Updated",this.notebook);

    //clear the canvas
    this.canvasEl.clear()

    //Increment Paage number
    this.page = this.page+1
    console.log("New page number", this.page);

    //If that page already exists
    if(this.notebook[this.page]){
      //Loading the page
        console.log("Page",this.notebook[this.page].page);
        this.canvasEl.loadFromJSON(JSON.stringify(this.notebook[this.page].data),this.canvasEl.renderAll.bind(this.canvasEl),function(o, object){
          fabric.log(o, object);
          console.log("Wowow");
        });
    }
  }

  prevPage(){
    if(this.page >=0){
      //save the page
      let obj = {
        page: this.page,
        data: this.canvasEl.toJSON()
      }
      //if page number is there then update the array else append the in the array
      this.upsert(this.notebook,obj)
      console.log("My book",this.notebook);

    this.page = this.page -1
    //If that page already exists
    if(this.notebook[this.page]){
      //Loading the page
        console.log("Page",this.notebook[this.page].page);
        this.canvasEl.loadFromJSON(JSON.stringify(this.notebook[this.page].data),this.canvasEl.renderAll.bind(this.canvasEl),function(o, object){
          fabric.log(o, object);
          console.log("Wowow");
        });
    }
  }
    }

  addRect(){
  var rect = new fabric.Rect({
    left: 100,
    top: 100,
    fill: 'red',
    width: 20,
    height: 20
  });
  // "add" rectangle onto canvas
  this.canvasEl.add(rect);
  }


  showPreviewImage(){

    fabric.Image.fromURL("https://image.shutterstock.com/image-vector/big-small-cartoon-elephants-vector-260nw-419531956.jpg", function(oImg) {
      this.canvasEl.add(oImg);
      sessionStorage.setItem('key', oImg);
    });

  }

  // showPreviewImage(e:any){
  //   console.log(e);
  //   var reader = new FileReader();
  //   console.log("Reader",reader);

  //   reader.onload = (event:any)=> {
  //     console.log("Hahaha");
  //     var imgObj = new Image();
  //     imgObj.src = event.target.result;

  //     var image = new fabric.Image(imgObj);
  //     console.log("Image",image);

  //     image.set({
  //       left: 10,
  //       top: 10,
  //       angle: 20,
  //       padding: 10,
  //       cornersize: 10,
  //     });
  //     image.scaleToHeight(100);
  //     image.scaleToWidth(200);
  //     this.canvasEl.add(image);
  //     console.log("Image set~!!");

  //   }
  //   reader.readAsDataURL(e.target.files[0]);

  // }

    showPreviewPDF(event: any) {
    //checking if file is uploading
    if (event.target.files && event.target.files[0]) {
        var reader = new FileReader();
        reader.onload = (event: any) => {
            this.localUrl = event.target.result;
            this.pdf_js = pdfjsLib.getDocument(this.localUrl)

            this.pdf_js.promise.then(doc => {
              console.log("PDF LOADED");
              console.log("THis pdf has ", doc._pdfInfo.numPages);
              this.no_of_pages = doc._pdfInfo.numPages

            //once the whole file is uploaded
            // this.function_PDF_tracking(this.no_of_pages)
            this.addPdf(1)
            })

        }
        reader.readAsDataURL(event.target.files[0]);
        console.log("Local URL", this.localUrl);
    }
}






  addPdf(page_number){
    this.pdf_js.promise.then(doc => {
      console.log("PDF LOADED");
      console.log("THis pdf has ", doc._pdfInfo.numPages);
      // this.no_of_pages = doc._pdfInfo.numPages

      doc.getPage(page_number).then(page => {
        let canvas:any = document.getElementById("my_canvas")
        let context:any = canvas.getContext("2d")
        let viewport:any = page.getViewport({ scale: 1.3})
        viewport.height=this.scrHeight
        this.pdf_added_boolean = true
        // viewport.width = '200px';
        page.render({
          canvasContext: context,
          viewport: viewport
        })
      })

    })
  }

//   //pen Button
//   penButton(){
//     console.log("Working!");
//     //Enabling pen and disabiling other tools
//     Object.keys(this.basic_tools).forEach( (key)=>{
//       this.basic_tools[key] = false;
//     })
//     //Enabling only normal pen
//     this.basic_tools.normalPen = true;

//     // post checking
//     if(this.basic_tools.normalPen){
//       //When mouse is pressed down
//       this.globalListenFunc = this.renderer.listen('document', 'mousedown', e => {
//         this.mouseControl = true

//         if(this.mouseControl && this.basic_tools.normalPen){
//           console.log("Mouse down");
//           // taking mouse down X and Y coordinates
//           this.normalPen_startX = e.offsetX
//           this.normalPen_startY = e.offsetY
//         }
//       })

//       //When Mouse is moving
//       this.globalListenFunc = this.renderer.listen('document', 'mousemove', e => {
//         if(this.mouseControl && this.basic_tools.normalPen){
//           console.log("Mouse is moving! for pen");

//           this.normalPen_currentX = e.offsetX
//           this.normalPen_currentY = e.offsetY

//           this.ctx.beginPath();
//           this.ctx.moveTo(this.normalPen_startX,this.normalPen_startY);
//           this.ctx.lineTo(this.normalPen_currentX,this.normalPen_currentY);
//           this.ctx.closePath();
//           this.ctx.strokeStyle = this.penColour;
//           // this.ctx.lineWidth = this.line_width;
//           this.ctx.stroke();

//           // console.log(e,"Mouse move");
//           this.normalPen_startX = this.normalPen_currentX;
//           this.normalPen_startY = this.normalPen_currentY;
//         }

//       })

//       //When mouse is moved up
//       this.globalListenFunc = this.renderer.listen('document', 'mouseup', e => {
//         this.mouseControl = false;
//         console.log("Mouse up");
//         this.normalPen_endX = e.offsetX;
//         this.normalPen_endY = e.offsetY;
//       });
//     }
//   }

//   calligraphyButton(){
//     console.log("Brush is working");
//     //Enabling brush and disabiling other tools
//     Object.keys(this.basic_tools).forEach( (key)=>{
//       this.basic_tools[key] = false;
//     })
//     this.basic_tools.brushPen = true;

//     if(this.basic_tools.brushPen){
//       this.globalListenFunc = this.renderer.listen('document', 'mousedown', e => {
//         this.mouseControl = true

//         if(this.mouseControl && this.basic_tools.brushPen){
//           // taking mouse down X and Y coordinates
//           console.log("Mouse down");
//           this.calligraphy_tool.calligraphy_startX = e.offsetX
//           this.calligraphy_tool.calligraphy_startY = e.offsetY
//         }
//       })

//       this.globalListenFunc= this.renderer.listen('document','mousemove', e=> {
//         if(this.mouseControl && this.basic_tools.brushPen){
//           console.log("Mouse is moving for brish");

//           this.calligraphy_tool.calligraphy_currentX = e.offsetX
//           this.calligraphy_tool.calligraphy_currentY = e.offsetY

//           this.ctx.beginPath();
//           this.ctx.moveTo(this.calligraphy_tool.calligraphy_startX,this.calligraphy_tool.calligraphy_startY);
//           this.ctx.lineTo(this.calligraphy_tool.calligraphy_currentX,this.calligraphy_tool.calligraphy_currentY);
//           this.ctx.closePath();
//           this.ctx.stroke();

//           for(let i=0; i<5;i++){
//           this.ctx.beginPath();
//           this.ctx.moveTo(this.calligraphy_tool.calligraphy_startX+i,this.calligraphy_tool.calligraphy_startY+i);
//           this.ctx.lineTo(this.calligraphy_tool.calligraphy_currentX+i,this.calligraphy_tool.calligraphy_currentY+i);
//           this.ctx.closePath();
//           this.ctx.stroke();

//           this.ctx.beginPath();
//           this.ctx.moveTo(this.calligraphy_tool.calligraphy_startX-i,this.calligraphy_tool.calligraphy_startY-i);
//           this.ctx.lineTo(this.calligraphy_tool.calligraphy_currentX-i,this.calligraphy_tool.calligraphy_currentY-i);
//           this.ctx.closePath();
//           this.ctx.stroke();
//           }

//           this.calligraphy_tool.calligraphy_startX = this.calligraphy_tool.calligraphy_currentX;
//           this.calligraphy_tool.calligraphy_startY = this.calligraphy_tool.calligraphy_currentY;

//         }
//       })

//       //When mouse is moved up
//       this.globalListenFunc = this.renderer.listen('document', 'mouseup', e => {
//         this.mouseControl = false;
//         console.log("Mouse up");
//         this.calligraphy_tool.calligraphy_endX = e.offsetX;
//         this.calligraphy_tool.calligraphy_endY = e.offsetY;
//       });

//     }
//   }

//     highlighterButton(){
//     console.log("Brush is working");
//     //Enabling brush and disabiling other tools
//     Object.keys(this.basic_tools).forEach( (key)=>{
//       this.basic_tools[key] = false;
//     })
//     this.basic_tools.highlighter = true;

//     if(this.basic_tools.highlighter){
//       this.globalListenFunc = this.renderer.listen('document', 'mousedown', e => {
//         this.mouseControl = true

//         if(this.mouseControl && this.basic_tools.highlighter){
//           // taking mouse down X and Y coordinates
//           console.log("Mouse down");
//           this.highlighter_tool.highlighter_startX = e.offsetX
//           this.highlighter_tool.highlighter_startY = e.offsetY
//         }
//       })

//       this.globalListenFunc= this.renderer.listen('document','mousemove', e=> {
//         if(this.mouseControl && this.basic_tools.highlighter){
//           console.log("Mouse is moving for brish");

//           this.highlighter_tool.highlighter_currentX = e.offsetX
//           this.highlighter_tool.highlighter_currentY = e.offsetY

//           this.ctx.beginPath();
//           this.ctx.moveTo(this.highlighter_tool.highlighter_startX,this.highlighter_tool.highlighter_startY);
//           this.ctx.lineTo(this.highlighter_tool.highlighter_currentX,this.highlighter_tool.highlighter_currentY);
//           this.ctx.closePath();
//           this.ctx.stroke();

//           for(let i=0; i<5;i++){
//           this.ctx.beginPath();
//           this.ctx.moveTo(this.highlighter_tool.highlighter_startX+i,this.highlighter_tool.highlighter_startY+i);
//           this.ctx.lineTo(this.highlighter_tool.highlighter_currentX+i,this.highlighter_tool.highlighter_currentY+i);
//           this.ctx.closePath();
//           this.ctx.stroke();
//           this.ctx.strokeStyle = "rgb(58,150,270)";
//           this.ctx.lineWidth = 10;

//           this.ctx.beginPath();
//           this.ctx.moveTo(this.highlighter_tool.highlighter_startX-i,this.highlighter_tool.highlighter_startY-i);
//           this.ctx.lineTo(this.highlighter_tool.highlighter_currentX-i,this.highlighter_tool.highlighter_currentY-i);
//           this.ctx.closePath();
//           this.ctx.stroke();
//           this.ctx.strokeStyle = "rgb(58,150,270)";
//           this.ctx.lineWidth = 10;
//           }

//           this.highlighter_tool.highlighter_startX = this.highlighter_tool.highlighter_currentX;
//           this.highlighter_tool.highlighter_startY = this.highlighter_tool.highlighter_currentY;

//         }
//       })

//       //When mouse is moved up
//       this.globalListenFunc = this.renderer.listen('document', 'mouseup', e => {
//         this.mouseControl = false;
//         console.log("Mouse up");
//         this.highlighter_tool.highlighter_endX = e.offsetX;
//         this.highlighter_tool.highlighter_endY = e.offsetY;
//       });

//     }
//   }

//   localUrl: any[];

//   showPreviewImage(event: any) {
//     //checking if file is uploading
//     if (event.target.files && event.target.files[0]) {
//         var reader = new FileReader();
//         reader.onload = (event: any) => {
//             this.localUrl = event.target.result;
//             this.pdf_js = pdfjsLib.getDocument(this.localUrl)

//             this.pdf_js.promise.then(doc => {
//               console.log("PDF LOADED");
//               console.log("THis pdf has ", doc._pdfInfo.numPages);
//               this.no_of_pages = doc._pdfInfo.numPages

//             //once the whole file is uploaded
//             // this.function_PDF_tracking(this.no_of_pages)
//             this.addPdf(1)
//             })

//         }
//         reader.readAsDataURL(event.target.files[0]);
//         console.log("Local URL", this.localUrl);
//     }
// }

// function_PDF_tracking(num){
//   //setting up pdf tracking
//   for(let i=0;i<num;i++) {
//     console.log(i);

//     //by default 1st page is visited
//     if(i==0){
//       let obj = {}
//       obj["page"] = i+1
//       obj["status"] = "visited"
//       console.log(obj);
//       // this.pageTracking.push(obj)
//     }else{
//     let obj = {
//       page: i+1,
//       status: "novisit"
//     }
//     console.log(obj);
//     // this.pageTracking.push(obj)
//     }
//   }
//   console.log("All my pages", this.pageTracking);
// }

//   async nextPage(){
//     //save the state
//     let present = {
//       pageNumber: this.page,
//       image: this.canvasElement.toDataURL(),
//       //check if that page number is there or notement.toDataURL(),
//       date: Date.now()
//     };

//     console.log(present,"Added to my notebook");
//     //checking if that page number is there or not
//     // if found then update else append
//     this.upsert(this.notebook, this.page ,present)
//     this.pdfTick(this.pageTracking, this.page);
//     //Going to new page
//     console.log("Stored page number", this.page);


//     //new page configurations
//     this.page = this.page + 1;
//     console.log("New page number", this.page);

//     // clearing my rect
//     this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);

//     if(this.pdf_added_boolean){
//           // if pdf page is already rendered then dont add.. else add the pdf
//     let temp = this.pageTracking.findIndex(_item => _item.pageNumber === this.page)
//     if(temp >-1){
//       //page number is already there in pagetracking
//       console.log("Page number found in tracking list so not adding");

//     }else{
//       console.log("As page number is not found in tracking list we are adding it");

//       await this.addPdf(this.page+1)
//     }
//     }

//     // for(let i=0;i<this.pageTracking.length;i++){
//     //   //page is already rendered
//     //   if(this.page<=this.pageTracking.length){
//     //     console.log("Not adding");
//     //   }
//     //   else{
//     //     await this.addPdf(this.page+1)
//     //   }
//     // }

//     //if it already exists append
//     if(this.notebook[this.page]){
//       console.log("Loading page", this.page);

//       // this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
//       let image = new Image();

//       image.onload = (event) => {
//         this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
//         console.log("Image width",image.width);
//         image.width = this.scrWidth

//         this.ctx.drawImage(image, 0, 0); // draw the new image to the screen
//       }
//       image.src = this.notebook[this.page].image;
//     }

//     console.log("Man at end", this.notebook);

//   }
//   prevPage(){
//     if(this.page > 0){
//           //save the state
//     let present = {
//       pageNumber: this.page,
//       image: this.canvasElement.toDataURL(),
//       //check if that page number is there or notement.toDataURL(),
//       date: Date.now()
//     };

//     //adding it to the tracking list as this page is visited
//     this.pdfTick(this.pageTracking, this.page);

//     //checking if that page number is there or not
//     // if found then update else append
//     this.upsert(this.notebook, this.page ,present)
//     console.log("Stroing the page number which prev is pressed", present);

//     console.log(this.notebook);

//     this.page = this.page - 1;
//     var image = new Image();

//     image.onload = (event) => {
//       this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
//       this.ctx.drawImage(image, 0, 0); // draw the new image to the screen
//     }
//     image.src = this.notebook[this.page].image;

//     // for (let index = 0; index < this.notebook.length; index++) {
//     //   if(this.page){
//     //     var image = new Image();
//     //     image.onload = (event) => {
//     //       this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
//     //       this.ctx.drawImage(image, 0, 0); // draw the new image to the screen
//     //     }
//     //     image.src = this.notebook[index].image; // data.image contains the data URL

//     //     console.log(image);

//     //   }
//     // }

//     console.log(this.page);
//     }

//     console.log("Man at end", this.notebook);
//   }
//   pdfTick(array,pageNumber){
//     if(pageNumber <= this.no_of_pages){
//       const i = array.findIndex(_item => _item.pageNumber === pageNumber);
//       if (i > -1) {
//       } // Page number found
//       else{
//           let obj = {
//             pageNumber: pageNumber,
//             status:"visited",
//           }
//           array.push(obj);
//           console.log("PDF TRACKING", obj);

//       } //page not found

//       console.log("My final Array",this.pageTracking);
//     }

//   }
upsert(array, item) { // (1)
  const i = array.findIndex(_item => _item.page === item.page);
  if (i > -1) array[i] = item; // update
  else array.push(item);
}


//   downloadAsJSON(){
//     var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.notebook));
//     var a = document.createElement('a');
//     a.href = 'data:' + data;
//     a.download = 'data.json';
//     a.innerHTML = 'download JSON';

//     var container = document.getElementById('container');
//     container.appendChild(a);
//   }


//   //Add normal paper
//   addRuledPaper(){
//     let ctx:any = document.getElementById("backgroundImage")
//     if (ctx.getContext) {
//       ctx = ctx.getContext('2d');
//       var img1 = new Image();
//       img1.onload = (event) => {
//         //draw background image
//         console.log(img1.width);
//         img1.width = 1000
//         img1.height = 1000

//         ctx.drawImage(img1, 0, 0,this.scrWidth,this.scrHeight);


//     };
//     img1.src = "https://github.com/Canvasbird/canvasboard/blob/master/src/assets/College-Ruled-Papers-Template-A4-Size-650x823.png?raw=true"
//     }
//   }

//   //Add math paper
//   addMathPaper(){
//     let ctx:any = document.getElementById("backgroundImage")
//     if (ctx.getContext) {
//       ctx = ctx.getContext('2d');
//       var img1 = new Image();
//       img1.onload = (event) => {
//         //draw background image
//         console.log(img1.width);
//         // img1.width = 1000
//         // img1.height = 1000

//         ctx.drawImage(img1, 0, 0,this.scrWidth,this.scrHeight);


//     };
//     img1.src = "https://raw.githubusercontent.com/Canvasbird/canvasboard/master/src/assets/paperType/mathYellow.svg"
//     }
//   }

// // Add graph paper
// addGraphPaper(){
//   let ctx:any = document.getElementById("backgroundImage")
//   if (ctx.getContext) {
//     ctx = ctx.getContext('2d');
//     var img1 = new Image();
//     img1.onload = (event) => {
//       //draw background image
//       console.log(img1.width);
//       // img1.width = 1000
//       // img1.height = 1000

//       ctx.drawImage(img1, 0, 0,this.scrWidth,this.scrHeight);


//   };
//   img1.src = "https://github.com/Canvasbird/canvasboard/blob/master/src/assets/paperType/graph.png?raw=true"
//   }
// }

//   colourPick(opacity = 1){
//     console.log("Colour changed");
//     let data:any = document.getElementById("myColor")

//     //changing the value to RGB format
//     // #XXXXXX -> ["XX", "XX", "XX"]
//     let value = data.value.match(/[A-Za-z0-9]{2}/g);
//     // ["XX", "XX", "XX"] -> [n, n, n]
//     value = value.map(function(v) { return parseInt(v, 16) });
//     // [n, n, n] -> rgb(n,n,n)
//     let rgbConverted = "rgb(" + value.join(",") +","+opacity+ ")";
//     console.log(rgbConverted,"Colour Changed");
//     this.penColour = rgbConverted;
//   }
//   rgbConverter(hexValue,opacity=1){
//     //changing the value to RGB format
//     let value = hexValue.match(/[A-Za-z0-9]{2}/g);
//     value = value.map(function(v) { return parseInt(v, 16) });
//     let rgbConverted = "rgb(" + value.join(",") +","+opacity+ ")";
//     return rgbConverted
//   }
}
