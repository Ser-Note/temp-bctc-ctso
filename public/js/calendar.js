const months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const d = new Date();
let currentYear = d.getFullYear();
let monthIndex = d.getMonth(); // 0-11 for the months

let c = [];

//#region Classes
class CalendarEvent {

    constructor(_Name, _Desc, _Date, _reoccuring = false, _id = null){
        this.name = _Name;
        this.desc = _Desc;
        this.date = _Date;
        this.reoccuring = _reoccuring;
        this.id = _id;
    }
    compareDates(_date){ // will happen every month if re-occuring
        if(this.reoccuring){
            return this.date.getDate() == _date.getDate();
        }
        else{
            
            return this.date.toDateString() == _date.toDateString();
        }
    }
}
//#endregion

// Function to get current week's start and end dates
function getWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const weekStart = new Date(now);
    const weekEnd = new Date(now);
    
    weekStart.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday)
    weekEnd.setDate(now.getDate() + (6 - dayOfWeek)); // End of week (Saturday)
    
    return { start: weekStart, end: weekEnd };
}

// Function to show weekly overview modal
function showWeeklyOverlay() {
    const { start, end } = getWeekRange();
    const weeklyEventsList = document.getElementById('weeklyEventsList');
    
    // Filter events for this week
    const weekEvents = c.filter(event => {
        let eventDate = event.date;
        return eventDate >= start && eventDate <= end;
    }).sort((a, b) => a.date - b.date);
    
    // Populate the modal
    if (weekEvents.length === 0) {
        weeklyEventsList.innerHTML = '<p style="text-align: center; color: #ccc; padding: 20px;">No events this week</p>';
    } else {
        weeklyEventsList.innerHTML = weekEvents.map(event => `
            <div class="weekly-event-item">
                <h4>${event.name}</h4>
                <p class="event-date">${event.date.toDateString()}</p>
                <p>${event.desc.substring(0, 80)}${event.desc.length > 80 ? '...' : ''}</p>
            </div>
        `).join('');
    }
    
    // Show the modal
    document.getElementById('weeklyOverlayBackdrop').style.display = 'block';
    document.getElementById('weeklyOverlayModal').style.display = 'block';
}

// Function to close weekly modal
function closeWeeklyModal() {
    document.getElementById('weeklyOverlayBackdrop').style.display = 'none';
    document.getElementById('weeklyOverlayModal').style.display = 'none';
}

window.onload = function() {
    GetData();
    // Show weekly overview after a short delay to ensure data is loaded
    setTimeout(() => {
        if (c.length > 0) {
            showWeeklyOverlay();
        }
    }, 500);
};

//#region Functions
function GetData(){

    fetch(`/getJotFormData`)
    .then(response => {
        if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        //console.log();
        

        while(c.length > 0){
            c.pop();
        }

        console.log('Jotform Submissions:', data);
        data.content
        .filter(element => element.status !== "DELETED")
        .forEach(element => {
            // Skip if explicitly marked as non-event submission
            if (element.answers['13'] && element.answers['13'].answer && 
                element.answers['13'].answer !== 'New Events') {
                console.log('Skipping non-event submission type:', element.answers['13'].answer);
                return;
            }

            // Debug log for processing submission
            console.log('Processing submission', element.id, Object.keys(element.answers || {}));

            // Check if all required event fields exist
            if (!element.answers['5']?.answer) {
                console.warn('Skipping submission - missing event name');
                return;
            }
            if (!element.answers['14']?.answer && !element.answers['7']?.answer) {
                console.warn('Skipping submission - missing event description');
                return;
            }

            // Determine date type and validate required date fields
            const dateType = element.answers['41']?.answer || 'Single Day (Happens Once)';
            
            if (dateType === 'Range of dates') {
                if (!element.answers['45']?.answer || !element.answers['46']?.answer) {
                    console.warn('Skipping submission - missing range start/end date', element.id);
                    return;
                }
            } else { // Single Day or Recurring
                if (!element.answers['1']?.answer) {
                    console.warn('Skipping submission - missing date field', element.id);
                    return;
                }
            }
            
            let repeat = false;
            let hasRangeofDates = false;
            let month, day, year;

            switch(element.answers['41']?.answer){
                case "Single Day (Happens Once)":
                        month = element.answers['1']?.answer?.month;
                        day = element.answers['1']?.answer?.day;
                        year = element.answers['1']?.answer?.year;
                        hasRangeofDates = false;
                    break;

                case "Range of dates":
                        hasRangeofDates = true;
                    break;

                case "Reoccuring (Monthly)":
                case "Recurring (Monthly)": // Handle potential spelling variations
                        month = element.answers['1']?.answer?.month;
                        day = element.answers['1']?.answer?.day;
                        year = element.answers['1']?.answer?.year;
                        repeat = true;
                        hasRangeofDates = false;
                    break;

                default:
                    console.warn('Unknown date type:', element.answers['41']?.answer, 'for submission', element.id);
                    // Default to single day
                    if (element.answers['1']?.answer) {
                        month = element.answers['1']?.answer?.month;
                        day = element.answers['1']?.answer?.day;
                        year = element.answers['1']?.answer?.year;
                        hasRangeofDates = false;
                    } else {
                        console.warn('Skipping submission - no valid date data', element.id);
                        return;
                    }
                    break;
            }

            const eventName = element.answers['5']?.answer;
            
            // Strip HTML tags from description
            let eventDesc = element.answers['14']?.answer || element.answers['7']?.answer;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = eventDesc;
            eventDesc = tempDiv.textContent || tempDiv.innerText || eventDesc;
            
            let date;

            if(hasRangeofDates){
                const endMonth = element.answers['46']?.answer?.month;
                const endDay = element.answers['46']?.answer?.day;
                const endYear = element.answers['46']?.answer?.year;

                if (!endMonth || !endDay || !endYear) {
                    console.warn('Skipping submission - invalid end date', element.id);
                    return;
                }

                let endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

                const startMonth = element.answers['45']?.answer?.month;
                const startDay = element.answers['45']?.answer?.day;
                const startYear = element.answers['45']?.answer?.year;

                if (!startMonth || !startDay || !startYear) {
                    console.warn('Skipping submission - invalid start date', element.id);
                    return;
                }

                let startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));

                const diff = Math.abs(startDate.getTime() - endDate.getTime());
                let distBtwDates = Math.round(diff / (24 * 60 * 60 * 1000)) + 1;

                for(let i = 0; i < distBtwDates;i++){
                    let curDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay) + i);
                    
                    // Create display name with range info
                    let displayName = eventName;
                    let displayDesc = eventDesc;
                    
                    if (distBtwDates > 1) {
                        const startDateStr = `${months[parseInt(startMonth) - 1]} ${parseInt(startDay)}`;
                        const endDateStr = `${parseInt(endYear) === parseInt(startYear) && parseInt(endMonth) === parseInt(startMonth) ? '' : months[parseInt(endMonth) - 1] + ' '}${parseInt(endDay)}`;
                        const yearStr = parseInt(endYear) !== parseInt(startYear) ? `, ${endYear}` : '';
                        
                        if (i === 0) {
                            // First day: show full range
                            displayName = `${eventName} (${startDateStr} - ${endDateStr}${yearStr})`;
                        } else {
                            // Subsequent days: show day indicator
                            displayName = `${eventName} (Day ${i + 1} of ${distBtwDates})`;
                        }
                        
                        // Add range info to description
                        displayDesc = `${eventDesc}\n\n📅 Multi-day event: ${startDateStr} - ${endDateStr}${yearStr}`;
                    }
                    
                    console.log('Adding event' + i + ':', displayName, curDate);
                    
                    let event = new CalendarEvent(displayName, displayDesc, curDate, repeat, element.id);
                    c.push(event);
                }
            }
            else{
                if (!month || !day || !year) {
                    console.warn('Skipping submission - invalid date data', element.id);
                    return;
                }

                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

                console.log('Adding event:', eventName, date);
                let event = new CalendarEvent(eventName, eventDesc, date, repeat, element.id);
                c.push(event);
            }

            
        });
        console.log('Total events loaded:', c.length);
        
        // Sort events by date
        c.sort((a, b) => a.date - b.date);
        
        // Populate upcoming events list
        const eventList = document.getElementById('eventList');
        eventList.innerHTML = ''; // Clear previous
        
        // Get current date for calculating next occurrences
        const now = new Date();
        const currentYear = now.getFullYear();
        
        c.forEach(event => {
            let displayDate;
            let eventName = event.name;
            let eventDesc = event.desc;
            
            
            if (event.reoccuring) {
                eventName += " 🔄";
                // For recurring events, find the next occurrence
                const eventDay = event.date.getDate();
                let nextDate = new Date(currentYear, monthIndex, eventDay);
                
                // If the date has passed this month, show next month
                if (nextDate < now) {
                    nextDate = new Date(currentYear, monthIndex + 1, eventDay);
                }
                
                //displayDate = nextDate.toISOString().split('T')[0];
                displayDate = nextDate;
            } else{
                displayDate = event.date;
                
                // For multi-day events, check if this is the first day and show full range
                if (eventDesc.includes('Multi-day event:')) {
                    const rangeMatch = eventDesc.match(/📅 Multi-day event: (.+)/);
                    if (rangeMatch && eventName.includes('(')) {
                        // This is a multi-day event, show the full range in the list
                        eventName = event.name.split(' (')[0] + ` (${rangeMatch[1]})`;
                        eventDesc = event.desc.split('\n\n📅')[0]; // Remove the range info from description
                    }
                }
            }
            if(displayDate >= now){
                const eventDiv = document.createElement('a');
                eventDiv.href = `event-details.html?id=${event.id || c.indexOf(event)}`;
                eventDiv.className = 'event-item';
                eventDiv.style.textDecoration = 'none';
                eventDiv.style.color = 'inherit';
                eventDiv.style.cursor = 'pointer';
                eventDiv.innerHTML = `
                    <h4>${eventName}</h4>
                    <p>${displayDate.toISOString().split('T')[0]}</p>
                    <p>${eventDesc.substring(0, 100)}${eventDesc.length > 100 ? '...' : ''}</p>
                `;
                eventDiv.addEventListener('click', (e) => {
                    // Store event data in sessionStorage to pass to event-details page
                    sessionStorage.setItem('selectedEvent', JSON.stringify({
                        name: event.name,
                        desc: event.desc,
                        date: event.date.toISOString(),
                        recurring: event.reoccuring,
                        id: event.id
                    }));
                });
                eventList.appendChild(eventDiv);
            }
            else{
                console.log("Not UPCOMING Removing: ", eventName);
            }
        });
        
        updateMonth();
        
    })
    .catch(error => {
        console.error('Error fetching data from Jotform:', error);
    });
    
}

let currentDayEvents = [];
let currrentEventIndex = 0;


function loadDays(){
    const list = document.getElementsByClassName('days')[0];
    // remove current children
    while(list.firstChild){
        list.removeChild(list.firstChild);
    }
    // add spacing before; months dont all start on a monday
    // get last day of last month (monday, tuesday, ect) 9 - 1
    let prevMonthDayIndex =  getMonth(MinMaxWrapAround(monthIndex, 0, 11)).getDay();
    let prevMonthDayCount = MinMaxWrapAround(prevMonthDayIndex, 0, 6);

    if(prevMonthDayCount != 6){
            // offset first day of month by num
            for (let i = 0; i < prevMonthDayCount + 1; i++){
                // add blank element to the calandar
                const newItem = document.createElement('li');
                newItem.textContent = "None";
                list.appendChild(newItem);
            }
    }
    // add children
    for(let i = 1;i < getMonth(MinMaxWrapAround(monthIndex + 1, 0, 11)).getDate() + 1;i++){
        
        const newItem = document.createElement('li');
        newItem.textContent = i.toString();
        
        // Check if this is today
        let curDate = new Date(currentYear, monthIndex, i);
        let today = new Date();
        if (curDate.toDateString() === today.toDateString()) {
            newItem.classList.add('today');
        }
        
        /* ADD EVENTS */
        let dayEvents = [];
        for(let j = 0; j < c.length; j++){ 
            // checks if events have matching dates
                if(c[j].compareDates(curDate)){
                    dayEvents.push(c[j]);
                }
            }
            
            // If there are events, add click handler and display
            if(dayEvents.length > 0){
                newItem.classList.add('has-events');
                newItem.addEventListener('click', () => OnClick(dayEvents));
                
                const subItem = document.createElement('a');
                subItem.textContent = `\n ${dayEvents[0].name}`;
                if(dayEvents.length > 1) {
                    // if there are more than one event add (+ more) to the event button
                    subItem.textContent += ` (+${dayEvents.length - 1})`;

                    document.querySelector('.prev-event').style.display = 'flex';
                    document.querySelector('.next-event').style.display = 'flex';
                }
                else{
                    // Hide Next and Prev Arrows 
                    document.querySelector('.prev-event').style.display = 'none';
                    document.querySelector('.next-event').style.display = 'none';
                }
                newItem.append(subItem);
            }
            
            list.appendChild(newItem);
        }
    }

function OnClick(events){
    currentDayEvents = events;
    currentEventIndex = 0;
    displayCurrentEvent();
    
    // open simple dialog box that shows details without changing the page
    const myDialog = document.getElementById('myDialog');
    const backdrop = document.getElementById('dialogBackdrop');
    if (myDialog) myDialog.show();
    if (backdrop) backdrop.style.display = 'block';
    
    // Prevent body scrolling
    document.body.classList.add('dialog-open');
}

function displayCurrentEvent(){
    if(currentDayEvents.length === 0) return;
    
    const event = currentDayEvents[currentEventIndex];
    
    const eventNameEl = document.getElementById("EventName");
    const briefSummaryEl = document.getElementById("BriefSummary");
    const eventDateEl = document.getElementById("EventDate");
    const viewDetailsLinkEl = document.getElementById("ViewDetailsLink");
    const currentEventEl = document.getElementById("currentEvent");
    const totalEventsEl = document.getElementById("totalEvents");
    
    if (eventNameEl) {
        let displayName = event.name;
        if (event.reoccuring) {
            displayName += " 🔄"; // Add recurring indicator
        }
        eventNameEl.textContent = displayName;
    }
    
    if (briefSummaryEl) {
        let summary = event.desc;
        // For multi-day events, remove the range info from the summary since it's in the name
        if (summary.includes('\n\n📅 Multi-day event:')) {
            summary = summary.split('\n\n📅')[0];
        }
        briefSummaryEl.textContent = summary.substring(0, 100) + (summary.length > 100 ? "..." : "");
    }
    
    if (eventDateEl) {
        let displayDate;
        if (event.reoccuring) {
            // For recurring events, show the date in the current month being viewed
            const recurringDate = new Date(currentYear, monthIndex, event.date.getDate());
            displayDate = recurringDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            displayDate = event.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        eventDateEl.textContent = displayDate;
    }
    
    if (viewDetailsLinkEl) viewDetailsLinkEl.href = `event-details.html?id=${encodeURIComponent(event.id)}`;
    if (currentEventEl) currentEventEl.textContent = currentEventIndex + 1;
    if (totalEventsEl) totalEventsEl.textContent = currentDayEvents.length;
}

function showPreviousEvent(){
    if(currentDayEvents.length === 0) return;
    
    currentEventIndex--;
    if(currentEventIndex < 0){
        currentEventIndex = currentDayEvents.length - 1;
    }
    displayCurrentEvent();
}

function showNextEvent(){
    if(currentDayEvents.length === 0) return;
    
    currentEventIndex++;
    if(currentEventIndex >= currentDayEvents.length){
        currentEventIndex = 0;
    }
    displayCurrentEvent();
}

function closeDialog(){
    const myDialog = document.getElementById('myDialog');
    const backdrop = document.getElementById('dialogBackdrop');
    if (myDialog) myDialog.close();
    if (backdrop) backdrop.style.display = 'none';
    
    // Re-enable body scrolling
    document.body.classList.remove('dialog-open');
}

// Close dialog when clicking backdrop
document.addEventListener('DOMContentLoaded', function() {
    const backdrop = document.getElementById('dialogBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeDialog);
    }
});

function MinMaxWrapAround(index, min, max){ 
    // if the number is less than min set to max vice versa else return self
    // Example Range = (1 - 10) if num is 0 that return 10 if it is 5 return 5 if 13 return 0
    if(index > max){
        
        return min;
    }
    else if(index < min){
        
        return max;
    }
    return index;
}
function getMonth(month){
    return new Date(currentYear, month, 0);
}
function changeMonthPositive(){  
    if(monthIndex < 11){
        monthIndex++;
        
    }
    else{
        currentYear++;
        monthIndex = 0;
    }
    updateMonth();
}
function changeMonthNegative(){
    if(monthIndex > 0){
        monthIndex--;
    }
    else{
        currentYear--;
        monthIndex = 11;
    }
    updateMonth();
}
function updateMonth(){
    const month = document.getElementById("month-year");
    month.innerHTML = months[monthIndex] + " " + currentYear;
    loadDays();
}
function addEvent(event = new CalendarEvent()){
    eventData.push(event);
}
// refresh data every 12 hrs
setInterval(GetData, 43200000);

// Initialize on page load
window.addEventListener('load', function() {
    GetData();
    // Show weekly overview after a short delay to ensure data is loaded
    setTimeout(() => {
        if (c.length > 0) {
            showWeeklyOverlay();
        }
    }, 500);
});

//#endregion