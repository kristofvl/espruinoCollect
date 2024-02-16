const MAX = 96;  // quarter of hours per day, (1440/15)
const MAX_ARX = 50;  // local storage for past MAX_ARX days
const INV = 900000;  // interval = 15 minutes = 1000*60*60*15
var temp = new Int16Array(MAX);  // temperature measurements
var lght = new Int16Array(MAX);  // light measurements
var m = {temp, lght};
var indx = 0;
var low_temp = 190;  // alert when below this temperature x10
var hgh_temp = 220;  // alert when above this temperature x10
var atemp = new Int16Array(MAX*MAX_ARX);  // temperature measurements
var alght = new Int16Array(MAX*MAX_ARX);  // light measurements
var arch = {atemp, alght};
var itr = 0;

function pad2(n) {  // pad an integer to 2 digits
  return ('0'+n).substr(-2);
}
function fPad21(f,s) { // pad a float to ± 2 digits left, 1 right
  return (s?(f<0?'-':'+'):'')+Math.abs(f).toFixed(1).padStart(4,'0');
}
function toQuart(d) {  // return time d to quarter of hour
  return d.getHours()*4+Math.floor(d.getMinutes()/15);
}

function measure() {  // fill in current measurements
  indx = toQuart(new Date());
  m.temp[indx] = E.getTemperature()*10;
  if (typeof(Puck) != "undefined") {
     m.lght[indx] = Puck.light()*999;
  } else if ((typeof(Bangle) != "undefined")) {
     m.lght[indx] = Bangle.getHealthStatus().steps;
  }
  if (indx==MAX-1) {  // archive at the end of the day
    for (i=0; i<MAX; i++) arch.atemp[i+MAX*itr] = m.temp[i];
    for (i=0; i<MAX; i++) arch.alght[i+MAX*itr] = m.lght[i];
    itr++;  if (itr==MAX_ARX) itr = 0;
  }
  NRF.setAdvertising({0x1809 : [Math.round(m.temp[indx])] });
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
        outstr += fPad21(m.temp[i]/10,1)+",";
        outstr += fPad21(m.lght[i]/10,0);
        outstr += (i==indx)?"]":" ";
      } else {
        day_mem = ((itr-day)<0?MAX_ARX+(itr-day):(itr-day))%MAX_ARX;
        outstr += " "+fPad21(arch.atemp[i+MAX*day_mem]/10,1)+",";
        outstr += fPad21(arch.alght[i+MAX*day_mem]/10,0)+" ";
      }
    }
    console.log(outstr);
    j+=4;
  } while(j<MAX);
}

function upstat() {  // sparse colored led flash for user feedback
  if (typeof(Puck) != "undefined") {
    if (m.temp[indx] < low_temp)
      digitalPulse(LED3, 1, 70); // blue for too cold
    if (m.temp[indx] > hgh_temp)
      digitalPulse(LED1, 1, 70); // red for too warm
    if ( (m.temp[indx] >= low_temp) && (m.temp[indx] <= hgh_temp) )
      digitalPulse(LED2, 1, 70); // green for perfect
  } else {
  }
}

var temp_int = setInterval(measure, INV);
var stat_int = setInterval(upstat, 19999);
