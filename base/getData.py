import pause
import asyncio
from bleak import BleakScanner
from bleak import BleakClient
from datetime import datetime
import matplotlib.pyplot as plt
import csv

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
    devices = await BleakScanner.discover()
    for d in devices:
        if 'Puck.js' in str(d.details):
             print("Connecting to "+str(d.details))
             async with BleakClient(d) as client:
                 #print("Connected")
                 await client.start_notify(UUID_NORDIC_RX, uart_data_received)
                 c = collectCmd(day)
                 while len(c)>0:
                     await client.write_gatt_char(UUID_NORDIC_TX, bytearray(c[0:20]), True)
                     c = c[20:]
                 await asyncio.sleep(3.0) # wait for a response within 3 seconds
                 ts, temp, lght, date = parseOut()
                 # write to CSV:
                 with open('log.csv', 'a', encoding='UTF8') as f:
                     writer = csv.writer(f)
                     # write a row to the csv file
                     for i in range(0,len(ts)):
                         writer.writerow([date, ts[i], temp[i], lght[i]])


# convert buffer to floats containing the sensor data
def outStr2Floats():
    global out
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
    #print(out)
    ## Parse string into array:
    dataPoints = outStr2Floats()
    date = out[1:11]
    temp = dataPoints[0::2]
    lght = dataPoints[1::2]
    # prepare time strings:
    ts = [x/100.0 for x in range(0, 24*100, 25)]
    for i in range(0,len(temp)):
        ts[i] = "{:2.2f}".format(ts[i]).zfill(5).replace(".",":")
        ts[i] = ts[i].replace("25","15").replace("50","30").replace("75","45")
    return ts, temp, lght, date

# plot from CSV:
def plotCSV():
    ts = [str(x) for x in range(0, 24*4)]
    temp = [x for x in range(0, 24*4)]
    lght = [x for x in range(0, 24*4)]
    date = ""
    with open('log.csv', 'r') as f:
        csv_reader = csv.reader(f)
        for i, line in enumerate(csv_reader, 0):
            j = i % 96
            if len(line)==4:
                if date == line[0]:
                     ts[j] = line[1];
                     temp[j] = float(line[2]); lght[j] = float(line[3])
                else:
                     ts[j] = line[1];
                     temp[j] = float(line[2]); lght[j] = float(line[3])
                     date = line[0];
                     if i > (24*4):
                        plt.plot(ts, temp, label=date)
                        plt.xticks(ts[::8])
                        plt.tick_params(axis='x', labelrotation=90)
    plt.legend()
    plt.show()


# get current day and time:
current_dateTime = datetime.now()
# main loop that wakes up at defined time and collects the data
while True:
    pause.until(datetime(current_dateTime.year, current_dateTime.month,
                         current_dateTime.day, 23, 58))
    loop = asyncio.get_event_loop()
    loop.run_until_complete(runa(1))
    #plotCSV()
    pause.until(datetime(current_dateTime.year, current_dateTime.month,
                         current_dateTime.day+1, 0, 2))  # update date:
    current_dateTime = datetime.now()
