import matplotlib.pyplot as plt
import mplcursors
import csv
import os

# plot all days from CSV log file:
def plotCSV(logFileName):
    date = ""
    try:
        # first read file once to see how many lines & dimensions we have:
        file = open(logFileName)
        readsPerHour = 4
        devID = logFileName[-8:-4]  # extract device ID
        numDays = int( sum(1 for line in file) / (24*readsPerHour) )
        file.seek(0)  # go back to file's start and check out 1st line:
        numSensors = file.readline().count(',')-1
        ts = [str(x) for x in range(24*readsPerHour)]
        data = [ [0.0 for x in range(24*readsPerHour)]
                      for y in range(numSensors) ]
        fig, axs = plt.subplots(1,numSensors)
        fig.set_size_inches(10, 5)
        file.seek(0)
    except FileNotFoundError:
        print('Error: '+file.name+' not found')
    else:
        with file:
            print("reading "+str(numDays)+" days")
            csv_reader = csv.reader(file)
            for i, line in enumerate(csv_reader, 0):
                j = i % 96
                if len(line)==(numSensors+2):
                    # a line holds:  0:date, 1:timestamp, 2,...:sensor data
                    ts[j] = line[1];
                    for s in range(numSensors):
                        data[s][j] = float(line[2+s])
                    if date != line[0]:
                        if i >= (24*readsPerHour):  # end of day reached
                            thisDay = int(i/(24*readsPerHour))-1
                            for s in range(numSensors):
                                plotDay(axs[s], date, ts, data[s][:],
                                        thisDay, numDays)
                        date = line[0];
            # plot last day
            for s in range(numSensors):
                plotDay(axs[s], date, ts, data[s][:], numDays-1, numDays)
            plotShow(axs, ts, devID)

# plot a single day, use showPlot to display all after the last day
def plotDay(ax, date, ts, data, day, numDays):
    greyLvl = 1-((day+1)/numDays)
    ax.plot(ts, data, label=date, linestyle="-",
        marker="o", alpha=0.95, markersize=2,
        color=(greyLvl,greyLvl,greyLvl) )

# finish the plots, add interactivty and a legend
def plotShow(axes, ts, devID):
    for ax in axes:
        ax.set_xticks(ts[::8])
        ax.tick_params(axis='x', labelrotation=90)
        ax.grid(visible=True, which='major', axis='both')
        ax.legend()
        ax.set_xlim([0,len(ts)-1])
    plt.tight_layout()
    plt.gcf().canvas.manager.set_window_title(devID)
    # add interactive cursor:
    cursor = mplcursors.cursor( hover=mplcursors.HoverMode.Transient,
        highlight=True, highlight_kwargs=dict(linewidth=3, color="blue") )
    cursor.connect(  # display time and temperature:
        "add", lambda sel: sel.annotation.set_text(
            sel.artist.get_label() + "\n" +
            ts[ int(sel.target[0]) ] + ": " +
            "{:3.1f}".format(sel.target[1]) ) )

# start the plotting:
logDir = "./logs"
for file in os.listdir(logDir):
    if file.endswith(".csv"):
        plotCSV(os.path.join(logDir, file))
plt.show()
