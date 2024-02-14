import matplotlib.pyplot as plt
import mplcursors
import csv

fig = plt.figure()
plot = fig.add_subplot(111)

# plot from CSV:
def plotCSV(logFileName):
    ts = [str(x) for x in range(0, 24*4)]
    temp = [x for x in range(0, 24*4)]
    lght = [x for x in range(0, 24*4)]
    date = ""
    try:
        file = open(logFileName)
    except FileNotFoundError:
        print('Error: '+file.name+' not found')
    else:
        with file:
            csv_reader = csv.reader(file)
            print('reading '+file.name)
            for i, line in enumerate(csv_reader, 0):
                j = i % 96
                if len(line)==4:
                    ts[j] = line[1];
                    temp[j] = float(line[2])
                    lght[j] = float(line[3])
                    if date != line[0]:
                        if i >= (24*4):  # end of day reached
                            plotDay(date, ts, temp, False)
                        date = line[0];
            # plot last day
            plotDay(date, ts, temp, True)


def plotDay(date, ts, temp, showPlot):
    plt.plot(ts, temp, label=date, linestyle="-",
        marker="o", alpha=0.85, markersize=2)
    plt.xticks(ts[::8])
    plt.tick_params(axis='x', labelrotation=90)
    if showPlot:
        plt.legend()
        plt.tight_layout()
        cursor = mplcursors.cursor(hover=True)
        cursor.connect(
            "add", lambda sel: sel.annotation.set_text(
                ts[ int(sel.target[0]) ] + ": " +
                "{:3.1f}".format(sel.target[1]) + "'C" ) )
        plt.show()

plotCSV('log.csv')
