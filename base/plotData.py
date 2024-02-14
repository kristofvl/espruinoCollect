import matplotlib.pyplot as plt
import mplcursors
import csv

# plot all days from CSV log file:
def plotCSV(logFileName):
    date = ""
    try:
        file = open(logFileName)
        readsPerHour = 4
        numDays = int( sum(1 for line in file) / (24*readsPerHour) )
        ts = [str(x) for x in range(0, 24*readsPerHour)]
        temp = [x for x in range(0, 24*readsPerHour)]
        lght = [x for x in range(0, 24*readsPerHour)]
        file = open(logFileName)
    except FileNotFoundError:
        print('Error: '+file.name+' not found')
    else:
        with file:
            print("reading "+str(numDays)+" days")
            csv_reader = csv.reader(file)
            for i, line in enumerate(csv_reader, 0):
                j = i % 96
                if len(line)==4:
                    ts[j] = line[1];
                    temp[j] = float(line[2])
                    lght[j] = float(line[3])
                    if date != line[0]:
                        if i >= (24*readsPerHour):  # end of day reached
                            thisDay = int(i/(24*readsPerHour))-1
                            plotDay(date, ts, temp, thisDay, numDays)
                        date = line[0];
            # plot last day
            plotDay(date, ts, temp, numDays-1, numDays)

# plot a single day, use showPlot to display all after the last day
def plotDay(date, ts, temp, day, numDays):
    greyLvl = 1-((day+1)/numDays)
    print(greyLvl)
    plt.plot(ts, temp, label=date, linestyle="-",
        marker="o", alpha=0.95, markersize=2,
        color=(greyLvl,greyLvl,greyLvl) )
    plt.xticks(ts[::8])
    plt.tick_params(axis='x', labelrotation=90)
    if day+1 == numDays:
        plt.legend()
        plt.grid(visible=True, which='major', axis='both')
        plt.tight_layout()
        cursor = mplcursors.cursor(hover=mplcursors.HoverMode.Transient)
        cursor.connect(  # display time and temperature:
            "add", lambda sel: sel.annotation.set_text(
                sel.artist.get_label() + "\n" +
                ts[ int(sel.target[0]) ] + ": " +
                "{:3.1f}".format(sel.target[1]) + "'C" ) )
        plt.show()

plotCSV('log.csv')
