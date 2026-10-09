import { Link } from 'react-router-dom';
import { FaRegCopy } from 'react-icons/fa';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {Input} from '../components/Input';
import { useAuth } from '../context/AuthContext';
import {
  getProviderProfile,
  getProviderAvailability,
  createProviderAvailability,
  updateProviderAvailability,
  deleteProviderAvailability,
  getProviderAvailabilitySlots,
  setProviderAvailabilitySlotCancelled,
  getProviderAppointments,
  updateProviderAppointmentStatus,
} from '../api.js';
import {
  useEffect,
  useMemo,
  useRef,
  useState } from 'react';

import logoImg from '../assets/book35_logo_full.png';
import '../styles/ProviderDashboard.css';








// Status button label -> PATCH /appointments/:id/<action>
const statusActions = { Confirmed: 'confirm', Cancelled: 'cancel', Completed: 'complete' };

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const parseDate = (date) => new Date(`${date}T00:00:00`);

const maxDescriptionLength = 1000;

const startOfWeek = (date) => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const toTimeKey = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

// Backend window { _id, startTime, endTime (ISO), slotDuration, slotSummary } -> the
// { id, date, startTime, endTime, duration, summary } shape the dashboard renders, in local time.
// summary is { total, open, booked, cancelled } slot counts.
const toAvailabilitySlot = (window) => {
  const start = new Date(window.startTime);
  const end = new Date(window.endTime);
  return {
    id: window._id,
    date: toDateKey(start),
    startTime: toTimeKey(start),
    endTime: toTimeKey(end),
    duration: window.slotDuration,
    summary: window.slotSummary,
  };
};

// Backend appointment { _id, customerName, customerEmail, serviceName, notes, startTime,
// endTime (ISO), status ("pending"...), completedAt } -> the shape the bookings table and
// calendar render, in local time.
const toBooking = (appointment) => {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  return {
    id: appointment._id,
    client: appointment.customerName,
    email: appointment.customerEmail,
    service: appointment.serviceName || 'Appointment',
    notes: appointment.notes || '',
    startTime: appointment.startTime,
    date: toDateKey(start),
    time: toTimeKey(start),
    duration: Math.round((end - start) / 60000),
    status: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
    completedAt: appointment.completedAt ? toDateKey(new Date(appointment.completedAt)) : null,
  };
};

const defaultAvatar =`data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#1B1F3B"/>
        <stop offset="100%" stop-color="#FF6B4A"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#g)"/>
    <circle cx="60" cy="46" r="20" fill="#fff" fill-opacity="0.92"/>
    <path d="M28 92c10-16 25-24 32-24s22 8 32 24" fill="#fff" fill-opacity="0.92"/>
  </svg>
`)}`;








export const ProviderDashboard = () => {
  const { logout, user, token, updateProfile } = useAuth();


  
  const [provider, setProvider] = useState({
    name: user?.name || 'Provider Name',
    // TODO: once the backend (MongoDB Atlas) is connected, replace this
    // client-side initial state with a real fetch, e.g.:
    //   const res = await fetch(`/api/providers/${user.id}`);
    //   const data = await res.json();
    //   setProvider(data); // { name, businessName, location, services, ... } from the providers collection
    businessName: user?.businessName || '',
    rating: 4.8,
    location: '',
    services: ['Service A', 'Service B'],
    businessDescription: '',
    slogan: '',
    phone: '',
    avatar: defaultAvatar,
  });

  
  const [bookings, setBookings] = useState([]);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [filter, setFilter] = useState('All bookings');
  const [search, setSearch] = useState('');
  const [expandedBooking, setExpandedBooking] = useState(null);

  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('30');
  const [availabilityFormError, setAvailabilityFormError] = useState('');
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null); // null = adding a new window
  const [windowSlots, setWindowSlots] = useState([]); // slots of the window being edited
  const [isLoadingWindowSlots, setIsLoadingWindowSlots] = useState(false);
  const [pendingSlotStart, setPendingSlotStart] = useState(null); // slot being cancelled/restored
  const [availabilityFormNotice, setAvailabilityFormNotice] = useState('');

  const [profileBusinessName, setProfileBusinessName] = useState(provider.businessName);
  const [profileLocation, setProfileLocation] = useState(provider.location);
  const [profileServices, setProfileServices] = useState(provider.services);
  const [serviceInputValue, setServiceInputValue] = useState('');
  const [profileBusinessDescription, setProfileBusinessDescription] = useState(provider.businessDescription);
  const [profileSlogan, setProfileSlogan] = useState(provider.slogan);
  const [profilePhone, setProfilePhone] = useState(provider.phone);
  const [profileImage, setProfileImage] = useState(provider.avatar || defaultAvatar);
  const [imageUploadError, setImageUploadError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [calendarWeekStart, setCalendarWeekStart] = useState(() => startOfWeek(new Date()));
  const [formMessage, setFormMessage] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopNavCollapsed, setIsDesktopNavCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(() => window.location.hash.slice(1) || 'dashboard');
  const mobileMenuButtonRef = useRef(null);

  
  useEffect(() => {
    const syncActiveSection = () => {
      const section = window.location.hash.slice(1);
      setActiveSection(
        ['dashboard', 'bookings', 'availability', 'calendar', 'profile'].includes(section) ? section : 'dashboard',
      );
    };
    window.addEventListener('hashchange', syncActiveSection);
    syncActiveSection();
    return () => window.removeEventListener('hashchange', syncActiveSection);
  }, []);

  
  useEffect(() => {
    if (!isMobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };
    const closeOnDesktop = () => {
      if (window.innerWidth > 860) setIsMobileNavOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [isMobileNavOpen]);

  
  useEffect(() => {
    if (!showAvailabilityForm) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowAvailabilityForm(false);
    };
    document.body.classList.add('pd-modal-open');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('pd-modal-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showAvailabilityForm]);

  useEffect(() => {
    if (!token) return;

    let isCurrent = true;
    getProviderProfile(token)
      .then((profile) => {
        if (!isCurrent) return;
        setProvider((currentProvider) => ({
          ...currentProvider,
          ...profile,
          businessDescription: profile.bio || '',
        }));
        setProfileBusinessName(profile.businessName || '');
        setProfileLocation(profile.location || '');
        setProfileServices(profile.services || []);
        setProfileBusinessDescription(profile.bio || '');
        setProfileSlogan(profile.slogan || '');
        setProfilePhone(profile.phone || '');
        setProfileImage(profile.avatar || defaultAvatar);
      })
      .catch((error) => {
        if (!isCurrent) return;
        if (error.status === 401) {
          logout(); // token expired mid-session; ProtectedRoute redirects to /login
          return;
        }
        setFormMessage(`Unable to load profile: ${error.message}`);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;

    let isCurrent = true;
    getProviderAvailability(token)
      .then((windows) => {
        if (isCurrent) setAvailability(windows.map(toAvailabilitySlot));
      })
      .catch((error) => {
        if (!isCurrent) return;
        if (error.status === 401) {
          logout();
          return;
        }
        setFormMessage(`Unable to load availability: ${error.message}`);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;

    let isCurrent = true;
    getProviderAppointments(token)
      .then((appointments) => {
        if (isCurrent) setBookings(appointments.map(toBooking));
      })
      .catch((error) => {
        if (!isCurrent) return;
        if (error.status === 401) {
          logout();
          return;
        }
        setFormMessage(`Unable to load bookings: ${error.message}`);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, logout]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = filter === 'All bookings' || booking.status === filter;
      const matchesSearch =
        !query ||
        [booking.client, booking.service, booking.date, booking.status].join(' ').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, filter, search]);

  const pendingCount = bookings.filter((booking) => booking.status === 'Pending').length;
  const currentWeekStart = startOfWeek(new Date());
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const completedThisWeekCount = bookings.filter((booking) => {
    const completedAt = booking.completedAt;
    return (
      booking.status === 'Completed' &&
      completedAt >= toDateKey(currentWeekStart) &&
      completedAt < toDateKey(nextWeekStart)
    );
  }).length;

  const displayedServices = (activeSection === 'profile' ? profileServices : provider.services).filter(Boolean);
  const activeBooking = bookings.find((booking) => booking.id === expandedBooking);
  const calendarItems = [
    ...bookings
      .filter((booking) => booking.status !== 'Cancelled')
      .map((booking) => ({
        id: `booking-${booking.id}`,
        date: booking.date,
        time: booking.time,
        title: `${booking.client} · ${booking.service}`,
        detail: booking.status,
      })),
    ...availability.map((slot) => ({
      id: `availability-${slot.id}`,
      date: slot.date,
      time: slot.startTime,
      timeLabel: `${slot.startTime}–${slot.endTime}`,
      title: `${slot.duration}-minute slots`,
      detail: 'Open for booking',
    })),
  ].sort((first, second) => `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`));
  const calendarDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(calendarWeekStart);
    date.setDate(date.getDate() + index);
    const dateKey = toDateKey(date);
    return { date, dateKey, items: calendarItems.filter((item) => item.date === dateKey) };
  });

  
  const updateBookingStatus = async (id, status) => {
    setUpdatingBookingId(id);
    setFormMessage('');
    try {
      const appointment = await updateProviderAppointmentStatus({ token, id, action: statusActions[status] });
      const updatedBooking = toBooking(appointment);
      setBookings((currentBookings) =>
        currentBookings.map((booking) => (booking.id === id ? updatedBooking : booking)),
      );

      // A cancelled booking frees its slot, so refresh the windows' open/booked counts
      if (status === 'Cancelled') {
        const windows = await getProviderAvailability(token);
        setAvailability(windows.map(toAvailabilitySlot));
      }
    } catch (error) {
      if (error.status === 401) {
        logout();
        return;
      }
      setFormMessage(`Unable to update booking: ${error.message}`);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  
  const addServiceTag = () => {
    const trimmed = serviceInputValue.trim();
    if (!trimmed || profileServices.includes(trimmed)) {
      setServiceInputValue('');
      return;
    }
    setProfileServices((services) => [...services, trimmed]);
    setServiceInputValue('');
  };

  
  const removeServiceTag = (tag) => {
    setProfileServices((services) => services.filter((service) => service !== tag));
  };

  
  const handleServiceInputKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addServiceTag();
    }
  };

  
  const saveProfile = async (event) => {
    event.preventDefault();

    const pendingTag = serviceInputValue.trim();
    const finalServices =
      pendingTag && !profileServices.includes(pendingTag) ? [...profileServices, pendingTag] : profileServices;

    if (profileBusinessDescription.length > maxDescriptionLength) {
      setFormMessage('Business description must be 1,000 characters or fewer.');
      return;
    }
    if (!profileBusinessName.trim() || !profileLocation.trim() || finalServices.length === 0) {
      setFormMessage('Business name, location, and at least one service are required.');
      return;
    }
    

    if (!token) {
      setFormMessage('Your session has expired. Please sign in again.');
      return;
    }

    setIsSavingProfile(true);
    setFormMessage('');
    setImageUploadError('');

    try {
      const updatedProfile = await updateProfile({
        name: provider.name,
        businessName: profileBusinessName.trim(),
        location: profileLocation.trim(),
        services: finalServices,
        slogan: profileSlogan.trim(),
        phone: profilePhone.trim(),
        bio: profileBusinessDescription.trim(),
        avatar: profileImage || defaultAvatar,
      });

      setProvider((currentProvider) => ({
        ...currentProvider,
        ...updatedProfile,
        businessDescription: updatedProfile.bio || '',
      }));
      window.location.hash = 'dashboard';
      setActiveSection('dashboard');
      setFormMessage('Profile updated.');
    } catch (error) {
      setFormMessage(`Unable to save profile: ${error.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please choose an image file.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setImageUploadError('Profile image must be smaller than 1 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(typeof reader.result === 'string' ? reader.result : defaultAvatar);
      setImageUploadError('');
    };
    reader.onerror = () => setImageUploadError('Unable to read the selected image.');
    reader.readAsDataURL(file);
  };

  
  const openProfileSection = () => {
    setProfileBusinessName(provider.businessName);
    setProfileLocation(provider.location);
    setProfileServices(provider.services);
    setServiceInputValue('');
    setProfileBusinessDescription(provider.businessDescription);
    setProfileSlogan(provider.slogan);
    setProfilePhone(provider.phone);
    setProfileImage(provider.avatar || defaultAvatar);
    setImageUploadError('');
    setFormMessage('');
    window.location.hash = 'profile';
    setActiveSection('profile');
    setIsMobileNavOpen(false);
  };

  const closeProfileSection = () => {
    window.location.hash = 'dashboard';
    setActiveSection('dashboard');
  };

  const sortSlots = (slots) =>
    [...slots].sort((first, second) =>
      `${first.date}T${first.startTime}`.localeCompare(`${second.date}T${second.startTime}`),
    );

  // Replaces one window in the list with the version the backend just returned
  const replaceAvailabilityWindow = (savedWindow) => {
    const savedSlot = toAvailabilitySlot(savedWindow);
    setAvailability((current) => sortSlots(current.map((slot) => (slot.id === savedSlot.id ? savedSlot : slot))));
  };

  const handleAvailabilityError = (error, showError) => {
    if (error.status === 401) {
      logout();
      return;
    }
    showError(error.message);
  };

  // Handles both adding a new window and saving edits to an existing one
  const saveAvailability = async (event) => {
    event.preventDefault();
    if (slotStartTime >= slotEndTime) {
      setAvailabilityFormError('End time must be later than start time.');
      return;
    }
    if (!token) {
      setAvailabilityFormError('Your session has expired. Please sign in again.');
      return;
    }

    setIsSavingAvailability(true);
    setAvailabilityFormError('');
    setAvailabilityFormNotice('');
    try {
      // Date + time inputs are local; toISOString() sends the exact instant
      const windowFields = {
        token,
        startTime: new Date(`${slotDate}T${slotStartTime}`).toISOString(),
        endTime: new Date(`${slotDate}T${slotEndTime}`).toISOString(),
        slotDuration: Number(slotDuration),
      };

      if (editingSlotId) {
        // Stay in the modal so the provider sees the re-cut slots
        const { availability: savedWindow, slots } = await updateProviderAvailability({ ...windowFields, id: editingSlotId });
        replaceAvailabilityWindow(savedWindow);
        setWindowSlots(slots);
        setAvailabilityFormNotice('Changes saved.');
      } else {
        const savedWindow = await createProviderAvailability(windowFields);
        setAvailability((current) => sortSlots([...current, toAvailabilitySlot(savedWindow)]));
        setShowAvailabilityForm(false);
        setFormMessage('Availability added.');
      }
      setCalendarWeekStart(startOfWeek(parseDate(slotDate)));
    } catch (error) {
      handleAvailabilityError(error, setAvailabilityFormError);
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const removeAvailability = async (id) => {
    if (!token) return;
    setAvailabilityFormError('');
    try {
      await deleteProviderAvailability({ token, id });
      setAvailability((current) => current.filter((item) => item.id !== id));
      setShowAvailabilityForm(false);
      setEditingSlotId(null);
      setFormMessage('Availability removed.');
    } catch (error) {
      handleAvailabilityError(error, setAvailabilityFormError);
    }
  };

  // Cancel an open slot, or restore a cancelled one. The window's start and
  // end times are left as they are.
  const toggleSlotCancelled = async (slot) => {
    if (!token || !editingSlotId) return;
    setPendingSlotStart(slot.startTime);
    setAvailabilityFormError('');
    setAvailabilityFormNotice('');
    try {
      const { availability: savedWindow, slots } = await setProviderAvailabilitySlotCancelled({
        token,
        id: editingSlotId,
        startTime: slot.startTime,
        cancelled: slot.status !== 'cancelled',
      });
      replaceAvailabilityWindow(savedWindow);
      setWindowSlots(slots);
    } catch (error) {
      handleAvailabilityError(error, setAvailabilityFormError);
    } finally {
      setPendingSlotStart(null);
    }
  };

  const resetAvailabilityModal = () => {
    setWindowSlots([]);
    setAvailabilityFormError('');
    setAvailabilityFormNotice('');
    setFormMessage('');
    setShowAvailabilityForm(true);
  };

  const openAvailabilityForm = () => {
    setEditingSlotId(null);
    setSlotDate('');
    setSlotStartTime('');
    setSlotEndTime('');
    setSlotDuration('30');
    resetAvailabilityModal();
  };

  const openEditAvailabilityForm = async (selected) => {
    setEditingSlotId(selected.id);
    setSlotDate(selected.date);
    setSlotStartTime(selected.startTime);
    setSlotEndTime(selected.endTime);
    setSlotDuration(String(selected.duration));
    resetAvailabilityModal();

    if (!token) return;
    setIsLoadingWindowSlots(true);
    try {
      const { availability: savedWindow, slots } = await getProviderAvailabilitySlots({ token, id: selected.id });
      replaceAvailabilityWindow(savedWindow);
      setWindowSlots(slots);
    } catch (error) {
      handleAvailabilityError(error, setAvailabilityFormError);
    } finally {
      setIsLoadingWindowSlots(false);
    }
  };

  // The window being edited, as last saved, to tell whether the inputs have unsaved changes
  const editingWindow = availability.find((slot) => slot.id === editingSlotId);
  const hasUnsavedWindowChanges =
    !!editingWindow &&
    (editingWindow.date !== slotDate ||
      editingWindow.startTime !== slotStartTime ||
      editingWindow.endTime !== slotEndTime ||
      String(editingWindow.duration) !== slotDuration);
  const openSlotCount = availability.reduce((count, slot) => count + (slot.summary?.open ?? 0), 0);


  
  const handleShareAvailability = async () => {
    // The slug is generated by the backend at signup (from the business name,
    // de-duplicated with -1, -2, ...) and returned by GET /providers/me.
    if (!provider.slug) {
      setFormMessage('Your booking link is not ready yet. Please refresh and try again.');
      return;
    }
    const link = `${window.location.origin}/book/${provider.slug}`;

    try {
      await navigator.clipboard.writeText(link);
      setFormMessage('Availability link copied to clipboard!');
    } catch {
      setFormMessage(`Couldn't copy automatically — your link is: ${link}`);
    }
  };

  const showDashboard = activeSection === 'dashboard';
  const showBookings = activeSection === 'bookings';
  const showAvailability = activeSection === 'availability';
  const showCalendar = activeSection === 'calendar';
  const showProfile = activeSection === 'profile';






  
  return (
    <div className="flex items-stretch min-h-screen">
      
      <aside
        className={`pd-sidebar${isMobileNavOpen ? ' pd-sidebar-open' : ''}${isDesktopNavCollapsed ? ' pd-sidebar-collapsed' : ''}`}
        aria-label="Provider dashboard navigation"
      >
        <div className="flex items-center">
          <div className="pd-sidebar-welcome">
            <p>Welcome</p>
            <strong>{provider.name}</strong>
          </div>
          <button
            className="pd-desktop-sidebar-toggle"
            type="button"
            aria-label={isDesktopNavCollapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
            aria-expanded={!isDesktopNavCollapsed}
            aria-controls="pd-navigation"
            onClick={() => setIsDesktopNavCollapsed((collapsed) => !collapsed)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={isDesktopNavCollapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
            </svg>
          </button>
          <button
            className="pd-mobile-menu-toggle"
            type="button"
            ref={mobileMenuButtonRef}
            aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileNavOpen}
            aria-controls="pd-navigation"
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            <span className={`pd-menu-icon${isMobileNavOpen ? ' pd-menu-icon-open' : ''}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>{isMobileNavOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>

        <p className="pd-nav-heading">Manage</p>

        <nav className="pd-nav" id="pd-navigation" aria-label="Dashboard sections">
          <a
            href="#dashboard"
            aria-current={activeSection === 'dashboard' ? 'location' : undefined}
            onClick={() => { setActiveSection('dashboard'); setIsMobileNavOpen(false); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
            </svg>
            <span>Dashboard</span>
          </a>
          <a
            href="#availability"
            aria-current={activeSection === 'availability' ? 'location' : undefined}
            onClick={() => { setActiveSection('availability'); setIsMobileNavOpen(false); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
              <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3m2.5 0H16m-8 3.5h3" />
            </svg>
            <span>Availability</span>
          </a>
          <a
            href="#bookings"
            aria-current={activeSection === 'bookings' ? 'location' : undefined}
            onClick={() => { setActiveSection('bookings'); setIsMobileNavOpen(false); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5h12M8 12h12M8 18.5h12" />
              <circle cx="4.5" cy="5.5" r=".75" />
              <circle cx="4.5" cy="12" r=".75" />
              <circle cx="4.5" cy="18.5" r=".75" />
            </svg>
            <span>Bookings</span>
            {pendingCount > 0 && (
              <>
                <span className="pd-nav-badge" aria-hidden="true">{pendingCount}</span>
                <span className="sr-only">{pendingCount} pending booking requests</span>
              </>
            )}
          </a>
          <a
            href="#calendar"
            aria-current={activeSection === 'calendar' ? 'location' : undefined}
            onClick={() => { setActiveSection('calendar'); setIsMobileNavOpen(false); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
              <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h2m3 0h3M8 16.5h2m3 0h3" />
            </svg>
            <span>Calendar</span>
          </a>
        </nav>

        <div className="pd-sidebar-account">
          <button
            type="button"
            className="pd-account-avatar pd-account-avatar-button"
            aria-label={`Edit profile for ${provider.name}`}
            title="Edit profile"
            onClick={openProfileSection}
          >
            {provider.avatar ? (
              <img className="pd-account-image" src={provider.avatar} alt="" aria-hidden="true" />
            ) : (
              provider.name.trim().charAt(0).toUpperCase()
            )}
          </button>
          <div className="pd-account-details">
            <strong title={provider.name}>{provider.name}</strong>
          </div>
          <Link to="/" title="Sign out" onClick={logout}>
            Sign out
          </Link>
        </div>
      </aside>

      <main className="provider-dashboard" id="dashboard">
        <header className="pd-header">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              className="pd-header-avatar-wrap"
              aria-label={`Edit profile for ${provider.name}`}
              title="Edit profile"
              onClick={openProfileSection}
            >
              {provider.avatar ? (
                <img className="pd-header-avatar" src={provider.avatar} alt="" aria-hidden="true" />
              ) : (
                <span className="pd-header-avatar pd-header-avatar-fallback" aria-hidden="true">
                  {provider.name.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="pd-avatar-edit-icon" aria-hidden="true">✎</span>
            </button>
            <div>
              <h1>{provider.name}</h1>
              <p className="pd-location">
                {[provider.businessName, provider.location, displayedServices.join(' · ')].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          <img className="pd-brand-logo" src={logoImg} alt="Book35" />

          <div className="flex flex-wrap items-center gap-2.5">
            <Button size="sm" variant="primary" onClick={handleShareAvailability}>
              <span className="inline-flex items-center gap-1.5">
                <FaRegCopy /> Share Availability
              </span>
            </Button>
          </div>
        </header>

        {formMessage && <p className="pd-toast" role="status">{formMessage}</p>}

        {showAvailabilityForm && (
          <div
            className="fixed inset-0 z-20 flex items-center justify-center p-5 overflow-y-auto bg-[rgba(27,31,59,0.54)] backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowAvailabilityForm(false);
            }}
          >
            <Card className="pd-elevated-card" style={{ width: 'min(100%, 520px)', maxHeight: 'min(100%, 720px)', overflowY: 'auto', padding: 24 }}>
              <form className="flex flex-col gap-4" role="dialog" aria-modal="true" aria-labelledby="pd-availability-title" onSubmit={saveAvailability}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="pd-eyebrow">Manage your schedule</p>
                    <h2 id="pd-availability-title">{editingSlotId ? 'Edit availability' : 'Set availability'}</h2>
                  </div>
                  <button className="pd-modal-close" type="button" aria-label="Close availability form" onClick={() => setShowAvailabilityForm(false)}>
                    ×
                  </button>
                </div>

                <Input
                  label="Date"
                  type="date"
                  required
                  min={toDateKey(new Date())}
                  value={slotDate}
                  onChange={(event) => setSlotDate(event.target.value)}
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-3.5 max-[420px]:grid-cols-1">
                  <Input label="Start time" type="time" required value={slotStartTime} onChange={(event) => setSlotStartTime(event.target.value)} />
                  <Input label="End time" type="time" required value={slotEndTime} min={slotStartTime || undefined} onChange={(event) => setSlotEndTime(event.target.value)} />
                </div>

                <Input
                  label="Appointment duration"
                  type="select"
                  value={slotDuration}
                  onChange={(event) => setSlotDuration(event.target.value)}
                  options={[
                    { value: '10', label: '10 minutes' },
                    { value: '15', label: '15 minutes' },
                    { value: '20', label: '20 minutes' },
                    { value: '30', label: '30 minutes' },
                    { value: '45', label: '45 minutes' },
                    { value: '60', label: '60 minutes' },
                  ]}
                />

                {editingSlotId && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <strong className="text-sm">Slots</strong>
                      {editingWindow?.summary && (
                        <span className="pd-availability-duration">
                          {editingWindow.summary.open} of {editingWindow.summary.total} available
                          {editingWindow.summary.booked > 0 && ` · ${editingWindow.summary.booked} booked`}
                          {editingWindow.summary.cancelled > 0 && ` · ${editingWindow.summary.cancelled} cancelled`}
                        </span>
                      )}
                    </div>

                    {hasUnsavedWindowChanges && (
                      <p className="pd-availability-duration">Save changes to update the slots below.</p>
                    )}

                    {isLoadingWindowSlots ? (
                      <p className="pd-availability-empty" role="status">Loading slots...</p>
                    ) : windowSlots.length === 0 ? (
                      <p className="pd-availability-empty">No slots in this window.</p>
                    ) : (
                      <ul className="pd-slot-grid">
                        {windowSlots.map((slot) => {
                          const label = `${toTimeKey(new Date(slot.startTime))}–${toTimeKey(new Date(slot.endTime))}`;
                          return (
                            <li key={slot.startTime} className={`pd-slot pd-slot-${slot.status}`}>
                              <time dateTime={slot.startTime}>{label}</time>
                              {slot.status === 'booked' ? (
                                <span className="pd-status pd-status-confirmed">Booked</span>
                              ) : (
                                <button
                                  type="button"
                                  className="pd-text-button"
                                  disabled={pendingSlotStart !== null}
                                  aria-label={`${slot.status === 'cancelled' ? 'Restore' : 'Cancel'} the ${label} slot`}
                                  onClick={() => toggleSlotCancelled(slot)}
                                >
                                  {pendingSlotStart === slot.startTime
                                    ? '...'
                                    : slot.status === 'cancelled'
                                      ? 'Restore'
                                      : 'Cancel'}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {availabilityFormError && <p className="field-error" role="alert">{availabilityFormError}</p>}
                {availabilityFormNotice && <p className="pd-availability-duration" role="status">{availabilityFormNotice}</p>}

                <div className="flex justify-end gap-2">
                  {editingSlotId && (
                    <span className="mr-auto">
                      <Button size="sm" variant="secondary" type="button" onClick={() => removeAvailability(editingSlotId)}>
                        Delete availability
                      </Button>
                    </span>
                  )}
                  <Button size="sm" variant="secondary" type="button" onClick={() => setShowAvailabilityForm(false)}>
                    {editingSlotId ? 'Close' : 'Cancel'}
                  </Button>
                  <Button size="sm" variant="primary" type="submit" disabled={isSavingAvailability}>
                    {isSavingAvailability ? 'Saving...' : editingSlotId ? 'Save changes' : 'Save availability'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {showProfile ? (
          <section className="pd-panel mt-5" id="profile">
            <div className="mb-4">
              <p className="pd-eyebrow">Your business profile</p>
              <h2>Edit profile</h2>
            </div>
            <form className="flex flex-col gap-4" onSubmit={saveProfile}>
              <div className="flex flex-col items-center gap-3">
                <img src={profileImage || defaultAvatar} alt="" aria-hidden="true" className="pd-profile-photo" />
                <div className="w-full max-w-[320px]">
                  <Input label="Update profile photo" type="file" accept="image/*" onChange={handleImageUpload} />
                  {imageUploadError && <p className="field-error">{imageUploadError}</p>}
                </div>
              </div>

              <Input
                label="Full Name"
                value={user?.name || provider.name}
                disabled
                onChange={() => {}}
                hint="Full name comes from your account and can't be changed here."
              />

              <Input
                label="Business Name"
                required
                value={profileBusinessName}
                onChange={(event) => setProfileBusinessName(event.target.value)}
              />

              <div className="field">
                <label className="field-label text-label">Services</label>
                <div className="pd-tag-input">
                  {profileServices.map((service) => (
                    <span className="pd-tag" key={service}>
                      {service}
                      <button type="button" aria-label={`Remove ${service}`} onClick={() => removeServiceTag(service)}>
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    className="pd-tag-input-field"
                    placeholder={profileServices.length === 0 ? 'Type a service and press Enter' : 'Add another...'}
                    value={serviceInputValue}
                    onChange={(event) => setServiceInputValue(event.target.value)}
                    onKeyDown={handleServiceInputKeyDown}
                    onBlur={addServiceTag}
                  />
                </div>
              </div>

              <Input
                label="Business Description"
                multiline
                rows={4}
                value={profileBusinessDescription}
                maxLength={maxDescriptionLength}
                hint={`${profileBusinessDescription.length} / ${maxDescriptionLength} characters`}
                onChange={(event) => setProfileBusinessDescription(event.target.value)}
              />

              <Input
                label="Location / Address"
                required
                value={profileLocation}
                onChange={(event) => setProfileLocation(event.target.value)}
              />

              <Input
                label="Slogan"
                placeholder="A short tagline for your business"
                value={profileSlogan}
                onChange={(event) => setProfileSlogan(event.target.value)}
              />

              <Input label="Phone" type="tel" value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} />

              <div className="flex justify-end gap-2">
                <Button size="sm" variant="secondary" type="button" onClick={closeProfileSection}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <>
            {showDashboard && (
              <section className="grid grid-cols-3 gap-4 mt-6 max-[860px]:grid-cols-2" aria-label="Dashboard summary">
                <Card className="pd-elevated-card flex flex-col gap-1.5 min-h-[122px]" style={{ padding: 18 }}>
                  <span className="pd-stat-label">Completed this week</span>
                  <strong className="pd-stat-value">{completedThisWeekCount}</strong>
                  <span className="pd-stat-note">Completed appointments</span>
                </Card>
                <Card className="pd-elevated-card flex flex-col gap-1.5 min-h-[122px]" style={{ padding: 18 }}>
                  <span className="pd-stat-label">Total pending requests</span>
                  <strong className="pd-stat-value">{pendingCount}</strong>
                  <span className="pd-stat-note">Waiting for review</span>
                </Card>
                <Card className="pd-elevated-card flex flex-col gap-1.5 min-h-[122px]" style={{ padding: 18 }}>
                  <span className="pd-stat-label">Total bookings</span>
                  <strong className="pd-stat-value">{bookings.length}</strong>
                  <span className="pd-stat-note">All-time, every status</span>
                </Card>
              </section>
            )}

            {(showDashboard || showBookings) && (
              <section className="pd-panel mt-5" id="bookings">
                <div className="flex items-end justify-between gap-5 mb-4 max-[860px]:flex-col max-[860px]:items-stretch">
                  <div>
                    <p className="pd-eyebrow">Keep everything on track</p>
                    <h2>Bookings</h2>
                  </div>
                  <div className="flex gap-2.5 max-[860px]:flex-col">
                    <div className="w-full max-w-[260px] max-[860px]:max-w-none">
                      <Input type="search" placeholder="Search clients or services" aria-label="Search bookings" value={search} onChange={(event) => setSearch(event.target.value)} />
                    </div>
                    <Input
                      type="select"
                      aria-label="Filter bookings"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      options={['All bookings', 'Pending', 'Confirmed', 'Completed', 'Cancelled']}
                    />
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="pd-empty-state">
                    <strong>No bookings found</strong>
                    <p>Try another search or choose a different status filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="pd-table">
                      <thead>
                        <tr>
                          <th scope="col">Client</th>
                          <th scope="col">Date &amp; time</th>
                          <th scope="col">Service</th>
                          <th scope="col">Status</th>
                          <th scope="col"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td>
                              <strong>{booking.client}</strong>
                              <span className="pd-cell-subtitle">{booking.email}</span>
                            </td>
                            <td>{formatDate(booking.date)}<span className="pd-cell-subtitle">{booking.time}</span></td>
                            <td>{booking.service}<span className="pd-cell-subtitle">{booking.duration} min</span></td>
                            <td><span className={`pd-status pd-status-${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                            <td>
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  aria-expanded={expandedBooking === booking.id}
                                  onClick={() => setExpandedBooking((current) => (current === booking.id ? null : booking.id))}
                                >
                                  {expandedBooking === booking.id ? 'Hide details' : 'Details'}
                                </Button>
                                {booking.status === 'Pending' && (
                                  <>
                                    <button className="pd-action pd-action-accept" disabled={updatingBookingId === booking.id} onClick={() => updateBookingStatus(booking.id, 'Confirmed')}>
                                      Accept
                                    </button>
                                    <button className="pd-action pd-action-decline" disabled={updatingBookingId === booking.id} onClick={() => updateBookingStatus(booking.id, 'Cancelled')}>
                                      Decline
                                    </button>
                                  </>
                                )}
                                {booking.status === 'Confirmed' && (
                                  <>
                                    {new Date(booking.startTime) <= new Date() && (
                                      <button className="pd-action pd-action-complete" disabled={updatingBookingId === booking.id} onClick={() => updateBookingStatus(booking.id, 'Completed')}>
                                        Mark complete
                                      </button>
                                    )}
                                    <button className="pd-action pd-action-decline" disabled={updatingBookingId === booking.id} onClick={() => updateBookingStatus(booking.id, 'Cancelled')}>
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeBooking && (
                  <div className="pd-detail-panel">
                    <strong>Booking details</strong>
                    <p>
                      {activeBooking.client} booked {activeBooking.service} on {formatDate(activeBooking.date)} at {activeBooking.time}.
                    </p>
                    {activeBooking.notes && <p>Purpose: {activeBooking.notes}</p>}
                  </div>
                )}
              </section>
            )}

            {(showDashboard || showAvailability) && (
              <section className="pd-panel mt-5" id="availability">
                <div className="flex items-center justify-between gap-5 mb-4 flex-wrap">
                  <div>
                    <p className="pd-eyebrow">Manage your schedule</p>
                    <h2>Availability</h2>
                    <p className="pd-stat-note mt-1">
                      {availability.length} availability window{availability.length === 1 ? '' : 's'} · {openSlotCount} open slot
                      {openSlotCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Button size="sm" variant="primary" onClick={openAvailabilityForm}>
                    Create Availability
                  </Button>
                </div>
                {availability.length === 0 ? (
                  <p className="pd-availability-empty">No extra availability added yet. Add a time to let clients book you.</p>
                ) : (
                  <ul className="flex flex-col gap-2 list-none p-0 m-0">
                    {availability.map((slot) => (
                      <li key={slot.id}>
                        <button
                          type="button"
                          className="pd-availability-item"
                          aria-label={`Edit availability on ${formatDate(slot.date)}, ${slot.startTime} to ${slot.endTime}`}
                          onClick={() => openEditAvailabilityForm(slot)}
                        >
                          <span className="grid gap-0.5">
                            {formatDate(slot.date)} <strong>{slot.startTime}–{slot.endTime}</strong>
                            <span className="pd-availability-duration">{slot.duration}-minute slots</span>
                          </span>
                          {slot.summary && (
                            <span className="pd-availability-count">
                              <strong>
                                {slot.summary.open} of {slot.summary.total}
                              </strong>{' '}
                              slots available
                              {(slot.summary.booked > 0 || slot.summary.cancelled > 0) && (
                                <span className="pd-availability-duration block">
                                  {[
                                    slot.summary.booked > 0 && `${slot.summary.booked} booked`,
                                    slot.summary.cancelled > 0 && `${slot.summary.cancelled} cancelled`,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {(showDashboard || showCalendar) && (
              <section className="pd-panel mt-5" id="calendar">
                <div className="flex items-center justify-between gap-5 mb-4 max-[860px]:items-start max-[860px]:flex-col">
                  <div>
                    <p className="pd-eyebrow">Your schedule</p>
                    <h2>Week of {calendarWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h2>
                  </div>
                  <div className="flex items-center gap-2 max-[860px]:self-stretch max-[860px]:justify-between">
                    <span className="pd-muted">{calendarItems.length} scheduled</span>
                    <button
                      className="pd-calendar-nav"
                      type="button"
                      aria-label="Previous week"
                      onClick={() => setCalendarWeekStart((week) => { const p = new Date(week); p.setDate(p.getDate() - 7); return p; })}
                    >
                      ‹
                    </button>
                    <button
                      className="pd-calendar-nav"
                      type="button"
                      aria-label="Next week"
                      onClick={() => setCalendarWeekStart((week) => { const n = new Date(week); n.setDate(n.getDate() + 7); return n; })}
                    >
                      ›
                    </button>
                  </div>
                </div>

                {calendarItems.length === 0 ? (
                  <p className="pd-availability-empty">Your calendar is clear. Add availability or accept a booking to get started.</p>
                ) : (
                  <div className="grid grid-cols-7 gap-2 max-[860px]:grid-cols-2" aria-label="Weekly calendar">
                    {calendarDays.map((day) => (
                      <section
                        className="min-w-0"
                        key={day.dateKey}
                        aria-label={day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      >
                        <h3 className="flex justify-between gap-1 mb-2 pd-calendar-day-title">
                          <span>{day.date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</span>
                          <time dateTime={day.dateKey}>{day.date.toLocaleDateString(undefined, { day: 'numeric' })}</time>
                        </h3>
                        <div className="min-h-[52px]">
                          {day.items.length === 0 ? (
                            <span className="pd-calendar-empty" aria-label="No appointments">—</span>
                          ) : (
                            day.items.map((item) => (
                              <article
                                className={`pd-calendar-slot${item.detail === 'Open for booking' ? ' pd-calendar-slot-open' : ' pd-calendar-slot-booked'}`}
                                key={item.id}
                              >
                                <time dateTime={`${item.date}T${item.time}`}>{item.timeLabel || item.time}</time>
                                <strong>{item.title}</strong>
                                <span>{item.detail}</span>
                              </article>
                            ))
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};