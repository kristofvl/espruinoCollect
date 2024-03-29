const MAX_ARX = 10;  // local storage for past MAX_ARX days
const SAMPLE_INT = 10; // 5, 10 or 15 minutes
const MAX = 1440/SAMPLE_INT;  // quarter of hours per day
const INV = 1000*60*SAMPLE_INT; // sampling interval in ms
// day's measurements:
var data = [ new Int16Array(MAX), new Int16Array(MAX),
            new Int16Array(MAX), new Int16Array(MAX),
            new Int16Array(MAX) ];
var indx = 0;
var low_temp = 190;  // alert when below this temperature x10
var hgh_temp = 220;  // alert when above this temperature x10
// all measurements:
var adata = [ new Int16Array(MAX*MAX_ARX), new Int16Array(MAX*MAX_ARX),
            new Int16Array(MAX*MAX_ARX),new Int16Array(MAX*MAX_ARX),
            new Int16Array(MAX*MAX_ARX)];
var itr = 0;

// pad integer n to d digits:
function pad(n,digits) {return ("0".repeat(digits)+n).substr(-digits);}
function fPad21(f,s) { // pad a float to ± 2 digits left, 1 right
  return (s?(f<0?'-':'+'):'')+Math.abs(f).toFixed(1).padStart(4,'0');
}
function toInterval(dte) {  // return time d to quarter of hour
  return dte.getHours()*(60/SAMPLE_INT)+Math.floor(dte.getMinutes()/SAMPLE_INT);
}

function measure() {  // fill in current measurements
  indx = toInterval(new Date());
  data[0][indx] = E.getTemperature()*10;
  if (typeof(Puck) != "undefined") {
     data[1][indx] = Puck.light()*999;
     data[2][indx] = Puck.getBatteryPercentage();
     data[3][indx] = Puck.capSense();
     data[4][indx] = 0;
  } else if ((typeof(Bangle) != "undefined")) {
     bhs = Bangle.getHealthStatus('last');
     data[1][indx] = bhs.bpmConfidence;
     data[2][indx] = bhs.bpm;
     data[3][indx] = bhs.steps;
     data[4][indx] = bhs.movement;
  }
  if (indx==MAX-1) {  // archive at the end of the day
    for (s=0; s<5; s++)
        for (i=0; i<MAX; i++) 
             adata[s][i+MAX*itr] = data[s][i];
    itr++;  if (itr==MAX_ARX) itr = 0;
  }
  //NRF.setAdvertising({0x1809 : [Math.round(data[0][indx])] });
}

function prnt(day) {  // print out daily view via serial
  var today = new Date();
  if (today>0) today.setDate(today.getDate() - day);  // day is positive
  headerStr = "Temp;HRProb;HR;Steps;Movement";
  console.log(today.getFullYear()+"-"+pad(today.getMonth()+1,2)
                 +"-"+pad(today.getDate(),2)+" "+headerStr);
  var j = 0;
  var minsPerHour = (60/SAMPLE_INT);
  do {
    var outstr = pad(Math.floor(j/minsPerHour),2)+":";
    for (i=j; i<j+minsPerHour; i++) {
      if (day==0) {
        outstr += (i==indx)?"[":" ";
        outstr += fPad21(data[0][i]/10,1)+",";
        outstr += pad(data[1][i],3)+",";
        outstr += pad(data[2][i],3)+",";
        outstr += pad(data[3][i],5)+",";
        outstr += pad(data[4][i],5);
        outstr += (i==indx)?"]":" ";
      } else {
        day_mem = ((itr-day)<0?MAX_ARX+(itr-day):(itr-day))%MAX_ARX;
        outstr += " "+fPad21(adata[0][i+MAX*day_mem]/10,1)+",";
        outstr += pad(adata[1][i+MAX*day_mem],3)+",";
        outstr += pad(adata[2][i+MAX*day_mem],3)+",";
        outstr += pad(adata[3][i+MAX*day_mem],5)+",";
        outstr += pad(adata[4][i+MAX*day_mem],5)+" ";
      }
    }
    console.log(outstr);
    j+=minsPerHour;
  } while(j<MAX);
}

function upstat() {  // sparse colored led flash for user feedback
  if (typeof(Puck) != "undefined") {
    if (data[0][indx] < low_temp)
      digitalPulse(LED3, 1, 70); // blue for too cold
    if (data[0][indx] > hgh_temp)
      digitalPulse(LED1, 1, 70); // red for too warm
    if ( (data[0][indx] >= low_temp) && (data[0][indx] <= hgh_temp) )
      digitalPulse(LED2, 1, 70); // green for perfect
  } else {
  }
}

if ((typeof(Bangle) != "undefined")) { // load time graphics, based on slope clock (https://github.com/espruino/BangleApps/blob/master/apps/slopeclockpp/app.js)
  
require("Font7x11Numeric7Seg").add(Graphics);
  
const fontBitmap = E.toString(require('heatshrink').decompress(atob('AFv4BZU/+ALJh//wALIgP//gYJj//8ALIgf//4YJv//HxMHDAI+JDAJkJDBgLBDBJvBDEZKYDBaVMn6VKY4P+cBfAXZQ9JEoIkKAGcDBZUBPhJkCBZU/DBSJBBZLUBDBLHMBYIYJdgIYJj4YKJAIYJHgQYIe4IYKBYYYHn4YKJAQYIQoIYJJAYYHJAgYHQoQYIJAn//iFIAAP+JBX/wBIJ//AQpAAB8BIK/CFJJAxtMDApIEDAxIFW5gYEJAoYFQooYGBYwYEJAoYFQooYFJAwYEQooYFJA4YEBZAYCQowYEJBAYCQo4YDJBIYCBZUBQo4A5WBKYDOhLWCDJE/cZUPBYT8HgYLDTY4LDGQ7VBEpIkEfw9/EpRJEEox6CJZJuDOI8HBYo+FBYo+FHow+EHoy9FHo3/4B7IK4wYHK4ZWGK4qUC/BCDK4ZWCIoIMDN4o4CIYQYGApAYCIgY3BOAYSBLoYlCRIQ4CR4b+BDAYFFCQoYGFYIYFYIgYHZooYebQhjTPhKVOVwwYFY5gGCcAz5CGQIECDAcHCYQAD/wYGAAhQDHAQYJn4MG4DaFAAiCDRIQAFN4ZeDAAbNEK44LDHw5WDK449EHw49EHww9EHwx7EEo57DEo7rDEo4kGEopJFZIpuEWAwwGPwh6FBgoLJAH4AVSgKRDRoKHFQoazBcIgYaX4oYFCQYYSXAIYKn74DAATeGAAgYEFYIYJFYIYWh4YLBYwYEN4IYJRAIYKN44YDN46bGDBJvHDH4Y0AAwSBBZIrBDH4YhAHF4BZUPLghjG//gAohjEh//4AFCj4YEgISBwAFBgYYFCQqIBAoYSFFQIYEn4+DFQQYF/wREDAgrBJQRiBDAgGB/hiEDBJPBDBJPCDAhvEDoIYELoP4MQgYIMQQYJMQQYIMQQYJBYQYIEgYYHEgYYG4BJDDAyuBEgRxBDAvwSYX3DAwAD/wYHAAfHDBX8DBeHY4xUEDArCCHoQSBDBPgDBX8DAr0DUoQYFVQYVBDAqeETAIYFSQSxCDApwEZQIYFaAoYGHwfgDAw+D/gYHV4Z2DBYZ9D4AYHEoRJBDA4TBGAIYHGQILCDA4A/ABMHBhd+Aws8NwjpBTYiZBcAZ7DBYIFEfILRBbIYFDVoIlDAooYCFYYeFgYxEDAwrBDAbyBY4YYB/AVBBAL9DZoeAFwIYGcwIYQCQQYE+AYDCQSIDCoIYIG4RNBDBRmBDEgIBDBWADBAIDDBAICDBACBZQIYHwACB4APBDAv8RAP+TAIYG+4CB/BNBDAoAGDAoAFDBjgFAAr5FDCyrBAAv+DAZdBAAvgDA3vAYSYBAASGBEAI1D4AMDA4XHN4xwDSYSIFK4Y1DKwY+D8A1DBYYlCFgI9HEoSNDHohLCHAI+CBYpbFPYYAFIQIkGIQiHEAH4ADPgKgEAAkBPZaIBDBLXCEhYYJVpYkCDBAkCDBIkCDBAkCDBAkDDBF/DBQkDDA4kDDBAkDDA4kC34YHgYLB8YYIEgP8OIIkJDYIYGEgXgDBAkB/AYIj5gCDA4kC4AYIEgQYIEgP+DgQYFEgYYIEgIUBDA8HVgawHVgYADIYIYKwAY/DH4Y/DF4AEn//BI4ABgf/+AMJDH4YjAH4AJj/ABRDiB/jzCdgcBdIfgOIIPBAAQLD/wnB/4oDh4MD+AeBDBCgBDAPgDBASBFAIYHwASBDBH4CQQYI4ASBZIYYEI4J0BDBJ8BDBAxBDAKJDJQoYBB4JjIDBSuCDAvwBAJsBDAyCBAQQYH8CFDDBLgDDAzQDDA7QDDBQxBOYQYGGgISBDBD5CDBAIBn4YJ/ybCDBClEDAylEDEZzBVwwACOYKuGAAalBDBKlBDAq3BAARvDDAS3BAASIDDAaSBKwwYCK4hWDDAY+DHogIBG4I9HgFgAQMDSgwAESwR7EAAh7GAAglCEhBCCJIgMGBZQA9j5JKcAKHJaYQMIUATrFAAT4Eb4gABdYjTFGAjsGVYYlJEgv/EhRLGJIjtHBYpxFNwYACfQkDBYpkFT4I+JHow+FBYx9EHox9EPYxXFPYoYFKw6WEDAXh/+DOApWC+E/+AFCN4v8FAJQCOAYSDv4hBRIpECcQISCDAYIBOwJTCIgIYFwEfNgI0BDAv4P4IYV+AIBDBIICDBZjBDCwIBR4IYIwBdCDA/8cwQYI+AkBY4YYEcA4SBfgrgF/AYLwAYERgIYJUoIACCoPAewIAC4ALCMAoABcwIYKN4YVBFYJWHgAVB8BBBKwyJDLQJWFRIXgK4Y9ECoIrBHwY9DOALACHo8AniADPYoAESwR7DAAokHAAaNCBZAMBBZQA5PAKoENYyDJXQYYQjgYKg4FEDAsDAogYGAowSEZIIYJfYLIEDAjuCwAYHagP//AYIBYIYJv4LBcQgYDHgIAB4AYGHgRdFAoQ8CAAJdDDAYLDOAgYCHgQABOAYYCHgYYHBwIADOAYJB8YLEOAgYBBYoYFAApjFAAzHFAAqIDDA7TEDAzGEDAw8EDA4LEDAw8EDAy4DDA48FDAr2EDA4LGDAiqDDA48GDAiFEDAw8HDAaFFDAw8HDAY8HDAY8IDAQ8IAH4AFv5nJgE/QBMAg6ZKgKBLEgIlGEIICCRwwhBFoN/WY4IB+DxDZA/Bfo5GC/0fco5GC+YLCHwhGC/+/AYXAdooAEDAhGDAAZXDHoQAESwhGDAAZXDgYLGOAhWCDBBWDDBCdCDB2DRIt//gzC8BpB/BvEwALBBAIrBDAYqBE4RdCDArVDLoQYE8ByCwCPBDAiOBCgIIBR4IYFUgXADBAUBYgIYHawQYJJoIcDMYoYCGoRjGOAZjGCIKJCPg/AUQWADA3/z4CB/goBDAoAD+LHGfMa4CDBJUCAAicBDBKYBAASbBDBJwC/5BDZQJwF+YYD4BXF/xBDRAY+D4IYDRAY+C/CZDN4Y+DQAZWEEoXAM4Y9EUYIGBHwRWEFAyUEDYp7GAAglBEhJLBJIoyGBZQA/MBDPEPI7DFfQy3FAAUBaAkBUQrdCGQSKFewYlBv41EEgQlCj//wBJFAAPwaoJbEbgTqCCIJOEHoQVBgbhFHoYuBGIJXDHoYVBAoLuECQJXDDAorBDAZvBOAhWDCoI3BOAYYEFwIYFKwYYBNIIYDN4gYBCQKJDAoPwAQIYCRIY3BMAgYFPIQPBDBA3Bv4YIBAIVBDBCCBn4YKOYIYY4ASBDBCuDDCn4cwR8FDAWAZoIYFAoM/+C0CY4b2CBIIFCY4xgB8DyCcAv+g/8j7jCcA7jEfI78DBYRTBAAp/BAAQ4CAAnABYR2CAAhvDgBFCAAgLDNQQAEN4aJCKxJXHHoZXHHog+HBYg+GPYY+HPYh9HdYZ9HEgolFEgwlFBYxLENwhxGGAzvET4gZGC5AA/ABl8AYV4BY0fdIU/OQx8BSYIDDUQv+AYokESgQDDcI2AWQTUHHwIDDY43AXwWADAz3Bv4YGCgQYJCgIYDAYIYKOAoYYJRZjOPhKVGDAqqBCgKuHYYKqBDgLHGHQPggEPcA8/NYU/HoolCIQQkGAEIA==')));

Graphics.prototype.setFontPaytoneOne = function(scale) {
  // Actual height 71 (81 - 11)
  this.setFontCustom(fontBitmap,
    46,
    atob("HTBFLTQ0PzU/Lz8+HQ=="),
    100+(scale<<8)+(1<<16)
  );
  return this;
};

let drawTimeout;

let g2 = Graphics.createArrayBuffer(g.getWidth(),90,1,{msb:true});
let g2img = {
  width:g2.getWidth(), height:g2.getHeight(), bpp:1,
  buffer:g2.buffer, transparent:0
};
const slope = 25;
const offsy = 25; // offset of numbers from middle
const fontBorder = 4; // offset from left/right
const slopeBorder = 2, slopeBorderUpper = 1; // fudge-factor to move minutes down from slope
  
let R,x,y; // middle of the clock face
let dateStr = "";
let bgColor = "#f00";
let alti = 300;

// Draw the hour, and the minute into an offscreen buffer
let draw = function() {
  // queue next draw
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    animate(false, function() {
      draw();
    });
  }, 60000 - (Date.now() % 60000));
  // Now draw this one
  R = Bangle.appRect;
  x = R.w / 2;
  y = R.y + R.h / 2 - 6;
  var date = new Date();
  var local_time = require("locale").time(date, 1);
  var hourStr = local_time.split(":")[0].trim().padStart(2,'0');
  var minStr = local_time.split(":")[1].trim().padStart(2, '0');
  dateStr = require("locale").dow(date, 1).toUpperCase()+ " "+
            require("locale").date(date, 0).toUpperCase();
  g.reset().clearRect(R);
  battery = E.getBattery();
  g.setFont("7x11Numeric7Seg").setColor(0,0,0).fillRect(145,17,170,30).fillRect(145,37,170,50);
  heart = Bangle.getHealthStatus().bpm;
  g.setColor(1,1,1).drawString(pad(battery,3)+"%", 147, 19);
  g.drawString(pad(heart,3), 147, 39);
  // Draw hour
  g.setFontAlign(-1, 0).setFont("PaytoneOne").setColor("#00f");
  g.drawString(hourStr, fontBorder, y-offsy).setFont("4x6"); // draw and unload custom font
  // add slope in background color
  g.setColor(0.4,0,0).fillPoly([0,y+slope-slopeBorderUpper, R.w,y-slope-slopeBorderUpper,
                                   R.w,y-slope, 0,y+slope]);
  // add minimal banner with steps on top:
  scrWidth = g.getWidth();
  g.setColor(0,0,0).fillRect(0,0,scrWidth,12).setColor(0,1,0);
  if ( (hourStr=="04") && (minStr=="00") ) Bangle.setStepCount(0);
  steps = Bangle.getStepCount();
  g.fillRect(0,0,Math.floor((steps>10000)?scrWidth:((steps*scrWidth)/10000)),7);
  // Draw minute to offscreen buffer
  g2.setColor(0).fillRect(0,0,g2.getWidth(),g2.getHeight()).setFontAlign(1, 0).setFont("PaytoneOne");
  g2.setColor(1).drawString(minStr, g2.getWidth()-fontBorder, g2.getHeight()/2).setFont("4x6"); // draw and unload custom font
  g2.setColor(0).fillPoly([0,0, g2.getWidth(),0, 0,slope*2]);
  // start the animation *in*
  animate(true);
};

let isAnimIn = true;
let animInterval;
// Draw *just* the minute image
let drawMinute = function() {
  var yo = slopeBorder+offsy+y-2*slope*minuteX/R.w;
  // draw over the slanty bit
  g.setColor(bgColor).fillPoly([0,y+slope,R.w,y-slope,R.w,R.h+R.y,0,R.h+R.y]);
  // draw the minutes
  g.setColor("#fff").drawImage(g2img, x+minuteX-(g2.getWidth()/2), yo-(g2.getHeight()/2));
};
let animate = function(isIn, callback) {
  if (animInterval) clearInterval(animInterval);
  isAnimIn = isIn;
  minuteX = isAnimIn ? -g2.getWidth() : 0;
  drawMinute();
  animInterval = setInterval(function() {
    minuteX += 12;
    let stop = false;
    if (isAnimIn && minuteX>=0) {
      minuteX=0;
      stop = true;
    } else if (!isAnimIn && minuteX>=R.w)
      stop = true;
    drawMinute();
    if (stop) {
      clearInterval(animInterval);
      animInterval=undefined;
      if (isAnimIn) {
        // draw height:
        g.setFont("7x11Numeric7Seg").setColor(0,0,0).fillRect(5,129,38,143);
        g.setColor(1,1,1).drawString(pad(Math.round(alti),4), 7, 136); 
        // draw the date
        g.setColor(0,0,0).fillRect(0,g.getHeight()-30,g.getWidth(),g.getHeight());
        g.setColor(g.theme.bg).setFontAlign(0, 0).setFont("6x15",2).drawString(dateStr, R.x + R.w/2, R.y+R.h-9);
      }
      if (callback) callback();
    }
  }, 20);
};

Bangle.setBarometerPower(true);  // set up 1-minute altitude readings
let getAlt = function() {
  Bangle.getPressure().then(d => {alti = d.altitude;}).catch(error => {print("ERROR");});
};
setInterval(getAlt, 60*1000);

draw();  // start drawing the time
}  // out of Bangle block

var temp_int = setInterval(measure, INV);   // set intervals for sensor measurements
var stat_int = setInterval(upstat, 19999);  // and updating statistics
