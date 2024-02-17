# espruinoCollect
Data collection framework based on the Espruino sensor boards, which buffers data locally over several days in 15-minute segments and collects it over Bluetooth Low Energy (BLE) on base stations nearby for later visualization. 

The code consists of a python script that routinely collects sensor data over BLE from nearby [Espruino boards](https://www.espruino.com/), and embedded javascript code on these boards that routinely samples the data. This allows long-term sensor data collection and visualization.

Example: My office temperature (left, in degrees Celcius) and ambient light (right), measured by a nearby [Puck.js](https://www.puck-js.com/) over the past days:
![example plot](https://github.com/kristofvl/espruinoCollect/blob/main/plot.png?raw=true)
