# plot Espruino Data from CSV:
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
  
