export const TimeSlot=({
  time,
  day,
  status = 'open',
  selected = false,
  onClick })=>{
  
  let className = 'time-slot tabular';
  
  if (status === 'booked') className += ' time-slot-booked';
  
  if (selected) className += ' time-slot-selected';

  return (
    
    <button
      type="button"
      className={className}
      aria-pressed={selected}
      onClick={status === 'booked' ? undefined : onClick}
    >
      {day && <span>{day}</span>}
      <span>{time}</span>
    </button>
  );

  
}