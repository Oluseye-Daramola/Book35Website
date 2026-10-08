import { useState } from 'react';
import {Input} from './Input';
import {Button} from './Button';
import { createPublicAppointment } from '../api.js';
import { formatLongDateTime } from '../utils/formatters';





const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;





export const BookingForm = ({ providerId, selectedSlot, onSuccess, onSlotTaken, onClose, onSubmittingChange }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const slotLabel = formatLongDateTime(selectedSlot.startTime);

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!emailPattern.test(email.trim())) newErrors.email = 'Enter a valid email address';
    if (!purpose.trim()) newErrors.purpose = 'Please tell us what this appointment is for';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setIsLoading(true);
    onSubmittingChange?.(true);
    try {
      const appointment = await createPublicAppointment({
        provider: providerId,
        startTime: selectedSlot.startTime,
        customerName: name.trim(),
        customerEmail: email.trim(),
        notes: purpose.trim(), // the backend stores the purpose as notes
      });
      setConfirmedBooking(appointment);
      onSuccess?.(appointment);
    } catch (err) {
      setSubmitError(err.message);
      if (err.status === 409) onSlotTaken?.();
    } finally {
      setIsLoading(false);
      onSubmittingChange?.(false);
    }
  };

  // Success state replaces the form
  if (confirmedBooking) {
    return (
      <div className="text-center">
        <div className="booking-check" aria-hidden="true">✓</div>
        <h2>Request sent!</h2>
        <p className="tabular booking-confirm-time">{slotLabel}</p>
        <p className="text-caption">
          You'll get an email at {confirmedBooking.customerEmail} once it's confirmed.
        </p>
        <div className="mt-5">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Confirm your details</h2>
      <p className="tabular booking-form-slot">{slotLabel}</p>

      <Input
        label="Name"
        placeholder="Full name"
        autoComplete="name"
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <Input
        label="Purpose"
        multiline
        placeholder="What's this appointment for?"
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
        error={errors.purpose}
      />

      {submitError && <p className="field-error" role="alert">{submitError}</p>}

      <div className="flex justify-end gap-2 mt-2">
        <Button variant="secondary" type="button" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="accent" type="submit" disabled={isLoading}>
          {isLoading ? 'Booking...' : 'Confirm booking'}
        </Button>
      </div>
    </form>
  );
};