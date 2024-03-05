import matplotlib.pyplot as plt
import mplcursors
from matplotlib.widgets import Button
from calPlot import *
import csv
import os

class plotData:

    # plot all days from CSV log file:
    def plotCSV(self, logFileName):
        date = ""
        try:
            # first read file once to see how many lines & dimensions we have:
            file = open(logFileName)
            readsPerHour = 4
            self.fillDays = []
            self.devID = logFileName[-8:-4]  # extract device ID
            self.numDays = int( sum(1 for line in file) / (24*readsPerHour) )
            file.seek(0)  # go back to file's start and check out 1st line:
            self.numSensors = file.readline().count(',')-1
            self.ts = [str(x) for x in range(24*readsPerHour)]
            self.data = [ [0.0 for x in range(24*readsPerHour)]
                        for y in range(self.numSensors) ]
            self.fig, self.axs = plt.subplots(1,self.numSensors+1)
            self.fig.canvas.manager.set_window_title(self.devID)
            self.fig.set_size_inches(17, 4)
            self.date = ""
            file.seek(0)  # go back to file's start for reading data
        except FileNotFoundError:
            print('Error: '+file.name+' not found')
        else:
            with file:
                print("reading "+str(self.numDays)+" days")
                csv_reader = csv.reader(file)
                for i, line in enumerate(csv_reader, 0):
                    j = i % 96
                    if len(line)==(self.numSensors+2):
                        # a line holds:  0:date, 1:timestamp, 2,...:sensor data
                        self.ts[j] = line[1];
                        for s in range(self.numSensors):
                            self.data[s][j] = float(line[2+s])
                        if self.date != line[0]:
                            if i >= (24*readsPerHour):  # end of day reached
                                thisDay = int(i/(24*readsPerHour))-1
                                for s in range(self.numSensors):
                                    self.plotDay(self.axs[s], self.data[s][:],
                                            thisDay)
                            self.date = line[0];
                # plot last day and calendar
                for s in range(self.numSensors):
                    self.plotDay(self.axs[s], self.data[s][:], self.numDays-1)
                self.plotShow()

    # plot a single day, use showPlot to display all after the last day
    def plotDay(self, ax, data, day):
        greyLvl = 1-((day+1)/self.numDays)
        ax.plot(self.ts, data, label=self.date, linestyle="-",
            marker="o", alpha=0.95, markersize=2,
            color=(greyLvl,greyLvl,greyLvl) )
        self.fillDays.append( ( int(self.date[:4]), int(self.date[5:7]),
            int(self.date[8:10]) ) )

    # finish the plots, add interactivty and a legend
    def plotShow(self):
        for ax in self.axs[:-1]:
            ax.set_xticks(self.ts[::8])
            ax.tick_params(axis='x', labelrotation=90)
            ax.grid(visible=True, which='major', axis='both')
            ax.legend(fancybox=True, shadow=True).set_draggable(True)
            ax.set_xlim([0,len(self.ts)-1])
        cp = CalPlot(self.axs[-1], self.fillDays)
        plt.tight_layout()
        # add interactive cursor:
        cursor = mplcursors.cursor( hover=mplcursors.HoverMode.Transient,
            highlight=True, highlight_kwargs=dict(linewidth=3, color="blue"),
            pickables=self.axs[:-1] )  # avoid using mplcursors in calendar
        cursor.connect(  # display time and sensor data:
            "add", lambda sel: sel.annotation.set_text(
                sel.artist.get_label() + "\n" +
                self.ts[ int(sel.target[0]) ] + ": " +
                "{:3.1f}".format(sel.target[1]) ) )

# start the plotting:
plD = plotData()
logDir = "./logs"
for file in os.listdir(logDir):
    if file.endswith(".csv"):
        plD.plotCSV(os.path.join(logDir, file))

#ax = plt.gca()
#bcut = Button(ax, 'YES', color='red', hovercolor='green')

plt.show()
