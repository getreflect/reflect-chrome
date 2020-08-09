export class WeekStats {
    constructor() {
        this.dayStats = new Array(7);
        this.dayStats[0] = new DayStats();
        this.currentDay = this.dayStats[0];
    }
    static fromData(obj) {
        let parsedWeekStat = new WeekStats();
        Object.assign(parsedWeekStat, obj);
        return parsedWeekStat;
    }
    // get current day
    getCurrentDay() {
        return this.currentDay;
    }
    // check to see if the current day is not actually today
    // returns true if current day != today's actual date
    currentDayExpired() {
        return this.currentDay.getDate() != (new Date()).getDay();
    }
    pushbackDates() {
        let tempDayStats = this.dayStats;
        // take current dayStats and pop off the last element
        tempDayStats.pop();
        // concatenate a new DayStats object to the front of it
        tempDayStats.unshift(new DayStats());
        // replace dayStats with tempDayStats
        this.dayStats = tempDayStats;
    }
    incrementDayStats(type) {
        // check to see if currentDay is expired
        if (this.currentDayExpired()) {
            // if it is expired, push dates back and create new date
            this.pushbackDates();
        }
        // modify currentDay based off of the type of visit
        console.log(`${type} count has been incremented`);
        switch (type) {
            case "visited":
                this.currentDay.visited++;
                break;
            case "blocked":
                this.currentDay.blocked++;
                break;
            case "passed":
                this.currentDay.passed++;
                break;
        }
    }
}
class DayStats {
    constructor() {
        this.visited = 0;
        this.blocked = 0;
        this.passed = 0;
        this.date = (new Date()).getDay();
    }
    getDate() {
        return this.date;
    }
}
