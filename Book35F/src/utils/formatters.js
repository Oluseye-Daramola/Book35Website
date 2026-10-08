// All helpers take an ISO timestamp (e.g. a slot's startTime from the backend)
// and format it in the viewer's local time zone.

// "Mon, Oct 12"
export const formatDayLabel = (isoTime) =>
  new Date(isoTime).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// "9:00 AM"
export const formatTime = (isoTime) =>
  new Date(isoTime).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

// "Saturday, Jan 25 at 3:00 PM"
export const formatLongDateTime = (isoTime) => {
  const datePart = new Date(isoTime).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return `${datePart} at ${formatTime(isoTime)}`;
};
