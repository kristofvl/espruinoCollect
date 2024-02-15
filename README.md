# espruinoCollect
Data collection framework based on the Espruino sensor boards. 

The code consists of a python script that routinely collects sensor data over BLE from nearby [Espruino boards](https://www.espruino.com/), and embedded javascript code on these boards that routinely samples the data. This allows to do long-term sensor data collection and visualization.

Example: My office temperature over the past days:
![example plot](https://github.com/kristofvl/espruinoCollect/blob/main/plot_example.png?raw=true)
