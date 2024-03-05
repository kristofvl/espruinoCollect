# clickable calender plot, based on https://medium.com/@shimo164/lets-plot-your-own-calendar-with-matplotlib-af6265f50831

import datetime
from calendar import monthrange
from datetime import timedelta
import matplotlib
import matplotlib.patches as patches
import matplotlib.pyplot as plt

class CalPlot:
    def __init__(self, ax, fillDays):
        self.fillDays = fillDays
        self.ax = ax
        year = self.fillDays[-1][0]
        month = self.fillDays[-1][1]
        self.main(year, month, grid=True, fill=True)
        #self.annualCalender(year)

    def onClick(self, event):
        print(event.xdata, event.ydata)

    def labelMonth(self, year, month, ax, i, j, cl="black"):
        months = ["Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"]
        month_label = f"{months[month-1]} {year}"
        ax.text(i, j, month_label, color=cl, va="center")

    def labelWeekday(self, ax, i, j, cl="black"):
        x_offset_rate = 1
        for weekday in ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]:
            ax.text(i, j, weekday, ha="center", va="center", color=cl)
            i += x_offset_rate

    def labelDay(self, ax, day, i, j, cl="black"):
        ax.text(i, j, int(day), ha="center", va="center", color=cl)

    def fillBox(self, ax, i, j):
        ax.add_patch(
            patches.Rectangle( (i - 0.5, j - 0.5), 1, 1,
                edgecolor="blue", facecolor="yellow",
                alpha=0.1, fill=True,
            )
        )

    def checkFillDay(self, year, month, day, weekday):
        if (year, month, day) in self.fillDays:
                return True

    def checkColorDay(self, year, month, day, weekday):
        if weekday == 6:  # Sunday
            return "red"
        if weekday == 5:  # Saturday
            return "blue"
        return "black"

    def monthCalendar(self, ax, year, month, fill):
        date = datetime.datetime(year, month, 1)
        weekday, num_days = monthrange(year, month)
        # adjust by 0.5 to set text at the ceter of grid square
        x_start = 1 - 0.5
        y_start = 5 + 0.5
        x_offset_rate = 1
        y_offset = -1
        self.labelMonth(year, month, ax, x_start, y_start + 2)
        self.labelWeekday(ax, x_start, y_start + 1)
        j = y_start
        for day in range(1, num_days + 1):
            i = x_start + weekday * x_offset_rate
            color = self.checkColorDay(year, month, day, weekday)
            if fill and self.checkFillDay(year, month, day, weekday):
                self.fillBox(ax, i, j)
            self.labelDay(ax, day, i, j, color)
            weekday = (weekday + 1) % 7
            if weekday == 0:
                j += y_offset

    def main(self, year, month, grid=False, fill=False):
        self.ax.axis([0, 7, 0, 7])
        self.ax.axis("off")
        if grid:
            self.ax.axis("on")
            self.ax.grid(grid)
            for tick in self.ax.xaxis.get_major_ticks():
                tick.tick1line.set_visible(False)
                tick.tick2line.set_visible(False)
                tick.label1.set_visible(False)
                tick.label2.set_visible(False)
            for tick in self.ax.yaxis.get_major_ticks():
                tick.tick1line.set_visible(False)
                tick.tick2line.set_visible(False)
                tick.label1.set_visible(False)
                tick.label2.set_visible(False)
        self.monthCalendar(self.ax, year, month, fill)
        #self.ax.canvas.mpl_connect('button_press_event', onclick)

    # annual calendar
    def annualCalender(self, year):
        nrow = 3
        ncol = 4
        figsize=(10,6)
        fig, axs = plt.subplots(figsize=figsize, nrows=nrow, ncols=ncol)
        month = 1
        for ax in axs.reshape(-1):
            ax.axis([0, 7, 0, 7])
            ax.set_axis_off()
            self.monthCalendar(ax, year, month, fill=False)
            month += 1
        plt.show()
