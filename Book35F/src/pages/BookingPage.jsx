import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {TopBar} from '../components/TopBar';
import {NavBar} from '../components/NavBar';
import {TimeSlot} from '../components/TimeSlot';
import { Modal } from '../components/Modal';
import { BookingForm } from '../components/BookingForm';
import { getPublicProvider, getPublicSlots } from '../api.js';
import { formatDayLabel, formatTime } from '../utils/formatters';
import '../styles/Booking.css';






// Keyed by slug so moving to another provider's link remounts the page with
// fresh state (loading, no error, nothing selected) instead of resetting it in an effect
export const BookingPage = () => {
  const { slug } = useParams();
  return <BookingPageContent key={slug} slug={slug} />;
};

const BookingPageContent = ({ slug }) => {
  const [provider, setProvider] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    Promise.all([getPublicProvider(slug), getPublicSlots(slug)])
      .then(([providerData, slotData]) => {
        if (!isActive) return;
        setProvider(providerData);
        setSlots(slotData);
      })
      .catch((err) => {
        if (isActive) setError(err.message);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [slug]);

  const handleCloseModal = () => setSelectedSlot(null);

  // A booked slot is no longer available, so remove it from the grid
  const handleBookingSuccess = (appointment) => {
    const bookedStart = new Date(appointment.startTime).getTime();
    setSlots((currentSlots) =>
      currentSlots.filter((slot) => new Date(slot.startTime).getTime() !== bookedStart),
    );
  };

  // Someone else took the slot first (409): reload so the grid shows what's really open
  const handleSlotTaken = () => {
    getPublicSlots(slug)
      .then(setSlots)
      .catch(() => {
        // keep the current grid; the form already shows the booking error
      });
  };

  return (
    <div className="booking-shell">
      <TopBar />
      <NavBar showLinks={false} />

      <main className="flex flex-col items-center px-5 pt-12 pb-20">
        {isLoading && <p className="booking-status">Loading…</p>}

        {!isLoading && error && (
          <div className="booking-status">
            <p>{error}</p>
            <p className="mt-2">
              <Link to="/">Back to home</Link>
            </p>
          </div>
        )}

        {!isLoading && !error && provider && (
          <>
            <section className="flex flex-col items-center text-center">
              <div className="booking-avatar">
                {provider.avatar ? (
                  <img src={provider.avatar} alt="" />
                ) : (
                  (provider.name || provider.businessName).charAt(0).toUpperCase()
                )}
              </div>

              <h1 className="text-display mt-6">{provider.businessName}</h1>
              {provider.slogan && <p className="booking-slogan">{provider.slogan}</p>}

              <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-6 p-0 list-none">
                {(provider.services || []).map((service) => (
                  <li key={service} className="booking-service">
                    {service}
                  </li>
                ))}
              </ul>
            </section>

            <section className="w-full max-w-[560px] mt-12">
              <h2 className="booking-slots-title">Select your Appointment Time</h2>

              {slots.length === 0 ? (
                <p className="booking-status" style={{ marginTop: 24 }}>
                  No available times in the next 14 days.
                </p>
              ) : (
                <div className="booking-slots grid grid-cols-2 gap-3.5 mt-4 max-[360px]:grid-cols-1">
                  {slots.map((slot) => (
                    <TimeSlot
                      key={slot.startTime}
                      day={formatDayLabel(slot.startTime)}
                      time={formatTime(slot.startTime)}
                      selected={selectedSlot?.startTime === slot.startTime}
                      onClick={() => setSelectedSlot(slot)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {selectedSlot && (
        <Modal label="Book appointment" onClose={handleCloseModal} dismissible={!isSubmitting}>
          <BookingForm
            providerId={provider.id}
            selectedSlot={selectedSlot}
            onSuccess={handleBookingSuccess}
            onSlotTaken={handleSlotTaken}
            onClose={handleCloseModal}
            onSubmittingChange={setIsSubmitting}
          />
        </Modal>
      )}
    </div>
  );
};
