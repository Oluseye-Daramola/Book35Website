const formatDate = (date) => {
  return new Date(date).toISOString();
};

const parseDate = (dateString) => {
  return new Date(dateString);
};

const addMinutes = (date, minutes) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getDayOfWeek = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

const isPastDate = (date) => {
  return new Date(date) < new Date();
};

const getTimeDifference = (date1, date2) => {
  const diff = new Date(date2) - new Date(date1);
  return Math.floor(diff / 60000); // difference in minutes
};

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateTime = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
};

const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const roundToNearestMinutes = (date, minutes = 15) => {
  const d = new Date(date);
  const roundedMinutes = Math.round(d.getMinutes() / minutes) * minutes;
  d.setMinutes(roundedMinutes);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

module.exports = {
  formatDate,
  parseDate,
  addMinutes,
  addHours,
  addDays,
  getDayOfWeek,
  isSameDay,
  isFutureDate,
  isPastDate,
  getTimeDifference,
  formatTime,
  formatDateTime,
  isValidDate,
  getStartOfDay,
  getEndOfDay,
  roundToNearestMinutes
};