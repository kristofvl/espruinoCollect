import pause
import asyncio
import array
from datetime import datetime
from bleak import BleakScanner
from bleak import BleakClient

#address = "d1:41:7d:99:0b:ca"
UUID_NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
UUID_NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
day = 0
command = b"\x03\x10prnt("+str.encode(str(day))+b")\n"

out = ""

# handle collected data sent back over BLE 
def uart_data_received(sender, data):
    global out
    out = out + (str(data.decode()))

# scan for Puck devices and ask for data
async def runa():
    devices = await BleakScanner.discover()
    for d in devices:
        if 'Puck.js' in str(d.details):
             #print("Connecting...")
             #print(d.details)
             async with BleakClient(d) as client:
                 #print("Connected")
                 await client.start_notify(UUID_NORDIC_RX, uart_data_received)
                 #print("Writing command")
                 c=command
                 while len(c)>0:
                     await client.write_gatt_char(UUID_NORDIC_TX, bytearray(c[0:20]), True)
                     c = c[20:]
                 await asyncio.sleep(2.0) # wait for a response
                 global out
                 chIndex = out.find(">")
                 if chIndex != -1:
                      out = out[chIndex+1:]
                 chIndex = out.find(">")
                 if chIndex != -1:
                      out = out[:chIndex]
                 print(out)

current_dateTime = datetime.now()

while True:
    pause.until(datetime(current_dateTime.year, current_dateTime.month,
                         current_dateTime.day, 23, 55))
    loop = asyncio.get_event_loop()
    loop.run_until_complete(runa())
    pause.until(datetime(current_dateTime.year, current_dateTime.month,
                         current_dateTime.day+1, 0, 2))
    current_dateTime = datetime.now()
