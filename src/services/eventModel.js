/**
 * Transforms a raw Google Calendar API item into a clean event object.
 */
export class CalendarEvent {
    constructor(item) {
        const startStr = item.start?.dateTime || item.start?.date || '';
        const endStr = item.end?.dateTime || item.end?.date || '';

        this.id = item.id || '';
        this.title = item.summary || 'Untitled Event';
        this.description = item.description || '';
        this.location = item.location || '';
        this.startTime = startStr;
        this.endTime = endStr;
        this.isAllDay = !item.start?.dateTime;
        this.organizer = item.organizer?.email || '';
    }

    /** Slim JSON representation sent to the LLM (keeps token count low). */
    toPromptJSON() {
        return {
            id: this.id,
            title: this.title,
            location: this.location,
            startTime: this.startTime,
            endTime: this.endTime,
            isAllDay: this.isAllDay,
        };
    }
}

/**
 * Convert an array of raw Google Calendar API items → CalendarEvent[].
 */
export function parseRawEvents(items = []) {
    return items.map((item) => new CalendarEvent(item));
}

/**
 * Parses an ISO date string as the browser's local time, stripping its original timezone.
 */
export function parseLocalTime(dateStr, isAllDay) {
    if (!dateStr) return new Date();
    if (isAllDay) {
        return new Date(dateStr + "T00:00:00");
    }
    return new Date(dateStr.replace(/([+-]\d{2}:\d{2}|Z)$/, ''));
}
