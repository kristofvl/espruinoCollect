import pause
import asyncio
from bleak import BleakScanner
from bleak import BleakClient
from datetime import datetime
import csv
import os

UUID_NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
UUID_NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

out = ""  # global buffer for serial over BLE output

# handle collected data sent back over BLE
def uart_data_received(sender, data):
    global out
    out = out + (str(data.decode()))

# command to send in the terminal, to give a day's worth of data
# 0 is current day, 1 is yesterday, etc.
def collectCmd(day):
     return b"\x03\x10prnt("+str.encode(str(day))+b")\n"

# scan for Espruino devices and ask for data
async def runa(day):
    uploadWorked = False
    while not uploadWorked:
        devices = await BleakScanner.discover()
        print(devices)
        for d in devices:
            if '.js ' in str(d.details):
                print("Connecting to "+str(d.details))
                async with BleakClient(d) as client:
                    #print("Connected")
                    await client.start_notify(UUID_NORDIC_RX, uart_data_received)
                    c = collectCmd(day)
                    while len(c)>0:
                        await client.write_gatt_char(UUID_NORDIC_TX, bytearray(c[0:20]), True)
                        c = c[20:]
                    await asyncio.sleep(3.0) # wait for a response within 3 seconds
                    ts, data, date = parseOut()
                    if len(ts) > 1:
                        uploadWorked = True
                        write2CSV(str(d.details), ts, data, date)

# write day's data to CSV:
def write2CSV(dev, ts, data, date):
    devID_idx = dev.find('.js ')+4
    if devID_idx != 3:  # ( find returns -1 if not found )
        dev = dev[ devID_idx : devID_idx+4 ]
        with open(os.path.join("./logs", dev+'.csv'), 'a', encoding='UTF8') as f:
            writer = csv.writer(f)
            for i in range(0,len(ts)):
                writer.writerow([date, ts[i], data[5*i], data[5*i+1],
                                    data[5*i+2], data[5*i+3], data[5*i+4]])

# convert buffer to floats containing the sensor data
def outStr2Floats():
    global out
    if len(out) == 0:  # if no output comes back..
        return []
    outStr = ""
    for i in range(0,23):  # for every hour:
        pOut = out[out.find(str(i).zfill(2)+":")+3:out.find(str(i+1).zfill(2)+":")]
        outStr = outStr + pOut[:-3] + ";"
    outStr = outStr + out[out.find("23:")+3:-2]  # add data from 23:00-00:00
    # reformat to be able to split all floats:
    outStr = outStr.replace("]"," ").replace("["," ").replace("  ",";")
    outStr = outStr.replace(",",";").replace(" ","").split(";")
    return [float(string) for string in outStr]

# parse the output from the buffer
def parseOut():
    global out
    # cut out the output:
    chIndex = out.find(">")
    if chIndex != -1:
        out = out[chIndex+1:]
    chIndex = out.find(">")
    if chIndex != -1:
        out = out[:chIndex]
    ## Parse string into array:
    dataPoints = outStr2Floats()
    if len(dataPoints) == 0:
        return [],[],[]
    date = out[1:11]
    numSensors = 5
    temp = dataPoints[0::2]
    lght = dataPoints[1::2]
    # prepare time strings:
    ts = [x/100.0 for x in range(0, 24*100, 25)]
    for i in range(0,int(len(dataPoints)/numSensors)):
        ts[i] = "{:2.2f}".format(ts[i]).zfill(5).replace(".",":")
        ts[i] = ts[i].replace("25","15").replace("50","30").replace("75","45")
    return ts, dataPoints, date

# get current day and time:
current_dateTime = datetime.now()
# main loop that wakes up at defined time and collects the data
while True:
    #pause.until(datetime(current_dateTime.year, current_dateTime.month,
    #    current_dateTime.day, 23, 58))
    loop = asyncio.get_event_loop()
    loop.run_until_complete(runa(0))
    pause.until(datetime(current_dateTime.year, current_dateTime.month,
                         current_dateTime.day+1, 0, 2))  # update date:
    current_dateTime = datetime.now()
