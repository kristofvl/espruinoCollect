import pause
import asyncio
from parseBLE import *
from datetime import datetime

# get current day and time:
current_dateTime = datetime.now()
# main loop that wakes up at defined time and collects the data
while True:
    pause.until(datetime(current_dateTime.year, current_dateTime.month,
        current_dateTime.day, 23, 58))  # start two minutes before midnight
    loop = asyncio.get_event_loop()
    loop.run_until_complete(runa(0))
    pause.until(datetime(current_dateTime.year, current_dateTime.month,
                         current_dateTime.day+1, 0, 2))  # update date:
    current_dateTime = datetime.now()
