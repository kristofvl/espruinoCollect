const MAX = 96;  // quarter of hours per day, (1440/15)
const MAX_ARX = 10;  // local storage for past MAX_ARX days
const INV = 900000;  // interval = 15 minutes = 1000*60*60*15
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

function pad2(n) {  // pad an integer to 2 digits
  return ('0'+n).substr(-2);
}
function fPad21(f,s) { // pad a float to ± 2 digits left, 1 right
  return (s?(f<0?'-':'+'):'')+Math.abs(f).toFixed(1).padStart(4,'0');
}
function fPad5(n) { // pad an integer to 5 digits
  return ('0000'+n).substr(-5);
}
function toQuart(d) {  // return time d to quarter of hour
  return d.getHours()*4+Math.floor(d.getMinutes()/15);
}

function measure() {  // fill in current measurements
  indx = toQuart(new Date());
  data[0][indx] = E.getTemperature()*10;
  if (typeof(Puck) != "undefined") {
     data[1][indx] = Puck.light()*999;
     data[2][indx] = Puck.getBatteryPercentage();
     data[3][indx] = Puck.capSense();
  } else if ((typeof(Bangle) != "undefined")) {
     bhs = Bangle.getHealthStatus('last')
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
  NRF.setAdvertising({0x1809 : [Math.round(data[0][indx])] });
}

function prnt(day) {  // print out daily view via serial
  var d = new Date();
  var j = 0;
  if (d>0) d.setDate(d.getDate() - day);  // day is positive
  console.log(" "+d.getFullYear()+"-"+pad2(d.getMonth()+1)
                 +"-"+pad2(d.getDate()));
  do {
    var outstr = " "+pad2(Math.floor(j/4))+":";
    for (i=j; i<j+4; i++) {
      if (day==0) {
        outstr += (i==indx)?"[":" ";
        outstr += fPad21(data[0][i]/10,1)+",";
        outstr += fPad21(data[1][i]/10,0);
        for (k=2; k<5; k++) 
          outstr += ","+fPad5(data[k][i]);
        outstr += (i==indx)?"]":" ";
      } else {
        day_mem = ((itr-day)<0?MAX_ARX+(itr-day):(itr-day))%MAX_ARX;
        outstr += " "+fPad21(adata[0][i+MAX*day_mem]/10,1)+",";
        outstr += fPad21(adata[1][i+MAX*day_mem]/10,0);
        for (k=2; k<5; k++) 
          outstr += ","+fPad5(adata[k][i+MAX*day_mem]);
      }
    }
    console.log(outstr);
    j+=4;
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

var temp_int = setInterval(measure, INV);
var stat_int = setInterval(upstat, 19999);



