import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-modal";
import { useQuery, useMutation, gql } from "@apollo/client";
import { FileText, X, XCircle } from "lucide-react";

Modal.setAppElement("#root");

// Replace with dynamic realtor id as needed.
const realtorId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null;

const GET_ALL_BOOKINGS = gql`
  query getBookings {
    getBookings {
      id
      date
      startTime
      endTime
      mode
      status
      name
      email
      phone
      notes
      client {
        id
        firstName
        lastName
        email
      }
      property {
        id
        title
        location
      }
      created_by {
        id
      }
    }
  }
`;

const GET_REALTOR_AVAILABILITY = gql`
  query getRealtorAvailability($realtorId: ID) {
    getRealtorAvailability(realtorId: $realtorId) {
      id
      type
      date
      startTime
      endTime
      startDate
      endDate
      note
      createdAt
    }
  }
`;

const CREATE_BOOKING = gql`
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      id
      date
      startTime
      endTime
      mode
      status
      name
      email
      phone
      notes
    }
  }
`;

const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id)
  }
`;

const UPDATE_BOOKING_STATUS = gql`
  mutation UpdateBookingStatus($id: ID!, $status: String!) {
    updateBookingStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const CREATE_REALTOR_AVAILABILITY = gql`
  mutation CreateRealtorAvailability($input: RealtorAvailabilityInput!) {
    createRealtorAvailability(input: $input) {
      id
      type
      date
      startTime
      endTime
      startDate
      endDate
      note
      createdAt
    }
  }
`;

const CANCEL_REALTOR_AVAILABILITY = gql`
  mutation CancelRealtorAvailability($input: RealtorCancelAvailabilityInput!) {
    cancelRealtorAvailability(input: $input) {
      id
    }
  }
`;

const GET_CLIENTS = gql`
  query getUniqueClients($realtorId: ID!) {
    getUniqueClients(realtorId: $realtorId) {
      id
      firstName
      lastName
      email
    }
  }
`;
const GET_REALTOR_PROPERTIES = gql`
  query getRealtorProperties($realtorId: ID!) {
    getRealtorProperties(realtorId: $realtorId) {
      id
      title
      location
    }
  }
`;

const CREATE_REALTOR_BOOKING = gql`
  mutation CreateRealtorBooking($input: RealtorBookingInput!) {
    createRealtorBooking(input: $input)
  }
`;


const AppointmentsPage = () => {
  const [createRealtorBooking] = useMutation(CREATE_REALTOR_BOOKING);

  const [events, setEvents] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [confirmCancelBlockOpen, setConfirmCancelBlockOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTimeOffBlock, setSelectedTimeeOffBlock] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showBlockTimeForm, setShowBlockTimeForm] = useState(false);
  const [blockNote, setBlockNote] = useState("");
  const [blockSingleDate, setBlockSingleDate] = useState("");
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("17:00");
  const [unavailableType, setUnavailableType] = useState("day");
  const [user, setUser] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState("");
  const { data: propertiesData } = useQuery(GET_REALTOR_PROPERTIES, {
    variables: { realtorId }
  });

  const [selectedClient, setSelectedClient] = useState("");
  // For time slot dropdown
  const [availableSlots, setAvailableSlots] = useState([]);

  // Fetch unique clients for the realtor.
  const { data: clientsData, loading: clientsLoading } = useQuery(GET_CLIENTS, {
    variables: { realtorId }
  });

  const [formData, setFormData] = useState({
    notes: "",
    startTime: "09:00",
    endTime: "10:00",
    meetingType: "Zoom",
    status: "PENDING"
  });
  const [message, setMessage] = useState("");

  // Fetch bookings and availability.
  const { data: bookingsData, loading: bookingsLoading, refetch } = useQuery(GET_ALL_BOOKINGS);
  const { data: availabilityData } = useQuery(GET_REALTOR_AVAILABILITY, {
    variables: { realtorId }
  });

  const [createBooking] = useMutation(CREATE_BOOKING);
  const [cancelBooking] = useMutation(CANCEL_BOOKING);
  const [updateBookingStatus] = useMutation(UPDATE_BOOKING_STATUS);
  const [createRealtorAvailability] = useMutation(CREATE_REALTOR_AVAILABILITY);
  const [cancelRealtorAvailability] = useMutation(CANCEL_REALTOR_AVAILABILITY);

  // Compute available time slots for booking (1-hour slots between 9:00 and 16:00)
  useEffect(() => {
    if (!selectedDate || !bookingsData?.getBookings) return;
    const allSlots = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];
    // Filter bookings for selected date
    const bookedSlots = bookingsData.getBookings
      .filter(b => new Date(b.date).toISOString().split("T")[0] === selectedDate)
      .map(b => {
        // Normalize startTime (assuming it is in HH:mm format)
        if (b.startTime.includes("AM") || b.startTime.includes("PM")) {
          const [t, modifier] = b.startTime.split(" ");
          let [hour, minute] = t.split(":").map(Number);
          if (modifier === "PM" && hour !== 12) hour += 12;
          if (modifier === "AM" && hour === 12) hour = 0;
          return `${String(hour).padStart(2, "0")}:${minute}`;
        }
        return b.startTime;
      });
    // Remove booked slots from allSlots
    const freeSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    setAvailableSlots(freeSlots);
  }, [selectedDate, bookingsData]);

  // Merge bookings and realtor availability events.
  useEffect(() => {
    const bookingEvents = bookingsData?.getBookings
      ? bookingsData.getBookings.map(b => {
          const date = new Date(b.date).toISOString().split("T")[0];
          const normalizeTime = (time) => {
            if (time.includes("AM") || time.includes("PM")) {
              const [t, modifier] = time.split(" ");
              let [hour, minute] = t.split(":").map(Number);
              if (modifier === "PM" && hour !== 12) hour += 12;
              if (modifier === "AM" && hour === 12) hour = 0;
              return `${String(hour).padStart(2, "0")}:${minute}`;
            }
            return time;
          };
          const startTime = normalizeTime(b.startTime);
          const endTime = normalizeTime(b.endTime);

          // Set colors based on status.
          let bgColor = "";
          let txtColor = "";
          switch (b.status) {
            case "PENDING":
              bgColor = "red";
              txtColor = "white";
              break;
            case "CONFIRMED":
              bgColor = "green";
              txtColor = "white";
              break;
            case "PTO":
              bgColor = "gray";
              txtColor = "black";
              break;
            case "SOLD":
              bgColor = "yellow";
              txtColor = "black";
              break;
            case "CANCELLED":
              bgColor = "darkred";
              txtColor = "white";
              break;
            default:
              bgColor = "blue";
              txtColor = "white";
          }
          let title = "";
          if (b.created_by && b.created_by.id === realtorId) {
            // If the booking was created by the realtor, use the client's name and property details.
            title = `${b.client ? `${b.client.firstName} ${b.client.lastName}` : "No Client"}${
              b.property ? ` - ${b.property.title} (${b.property.location})` : ""
            } (${b.mode})`;
          } else {
            // Otherwise, use the booking's own name and mode.
            title = `${b.name || "No Name"}${
              b.property ? ` - ${b.property.title} (${b.property.location})` : ""
            } (${b.mode})`;
          }
          return {
            id: b.id,
            title,
            start: `${date}T${startTime}`,
            end: `${date}T${endTime}`,
            backgroundColor: bgColor,
            textColor: txtColor,
            extendedProps: b
          };
        })
      : [];

    const availabilityEvents = availabilityData?.getRealtorAvailability
      ? availabilityData.getRealtorAvailability.map(a => {
          const event = {
            id: a.id,
            title: "Time Off",
            backgroundColor: "grey",
            textColor: "black",
            editable: false
          };
          if (a.type === "DAY") {
            event.start = new Date(Number(a.date)).toISOString().split("T")[0];
            event.allDay = true;
          } else if (a.type === "TIME") {
            const dateStr = new Date(Number(a.date)).toISOString().split("T")[0];
            event.start = `${dateStr}T${a.startTime}`;
            event.end = `${dateStr}T${a.endTime}`;
          } else if (a.type === "RANGE") {
            event.start = new Date(Number(a.startDate)).toISOString().split("T")[0];
            event.end = new Date(Number(a.endDate)).toISOString().split("T")[0];
            event.allDay = true;
          }
          return event;
        })
      : [];

    setEvents([...bookingEvents, ...availabilityEvents]);
  }, [bookingsData, availabilityData]);

  const handleMarkUnavailable = async (e) => {
    e.preventDefault();
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    // Retrieve current bookings from the query data.
    const bookings = bookingsData?.getBookings || [];
    let conflict = false;

    if (unavailableType === "day") {
      conflict = bookings.some(b => {
        const bookingDate = new Date(b.date).toISOString().split("T")[0];
        return bookingDate === blockSingleDate;
      });
    } else if (unavailableType === "time") {
      conflict = bookings.some(b => {
        const bookingDate = new Date(b.date).toISOString().split("T")[0];
        if (bookingDate !== blockSingleDate) return false;
        const toMinutes = time => {
          const [h, m] = time.split(":").map(Number);
          return h * 60 + m;
        };
        const blockStart = toMinutes(blockStartTime);
        const blockEnd = toMinutes(blockEndTime);
        const bookingStart = toMinutes(b.startTime);
        const bookingEnd = toMinutes(b.endTime);
        return blockStart < bookingEnd && blockEnd > bookingStart;
      });
    } else if (unavailableType === "range") {
      const start = new Date(blockStartDate);
      const end = new Date(blockEndDate);
      conflict = bookings.some(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= start && bookingDate <= end;
      });
    }

    if (conflict) {
      alert("There is an existing booking on that time or date. Please choose a different time.");
      return;
    }

    let payload = {};
    if (unavailableType === "day") {
      if (!blockSingleDate) return alert("Please select a date.");
      payload = {
        realtor: parsedUser ? parsedUser.id : null,
        type: "DAY",
        date: blockSingleDate,
        note: blockNote
      };
    }
    if (unavailableType === "time") {
      if (!blockSingleDate || !blockStartTime || !blockEndTime)
        return alert("Please complete all fields.");
      payload = {
        realtor: parsedUser ? parsedUser.id : null,
        type: "TIME",
        date: blockSingleDate,
        startTime: blockStartTime,
        endTime: blockEndTime,
        note: blockNote
      };
    }
    if (unavailableType === "range") {
      if (!blockStartDate || !blockEndDate)
        return alert("Please select start and end date.");
      payload = {
        realtor: parsedUser ? parsedUser.id : null,
        type: "RANGE",
        startDate: blockStartDate,
        endDate: blockEndDate,
        note: blockNote
      };
    }

    try {
      await createRealtorAvailability({ variables: { input: payload } });
      setShowBlockTimeForm(false);
      setUnavailableType("day");
      setBlockNote("");
      setBlockSingleDate("");
      setBlockStartDate("");
      setBlockEndDate("");
      setBlockStartTime("09:00");
      setBlockEndTime("17:00");
      setMessage("Time successfully marked as unavailable.");
      refetch();
    } catch (error) {
      console.error("Error marking time off:", error);
      setMessage("Failed to mark time off.");
    }
  };

  const handleDateClick = (info) => {
    console.log(info);
    const clickedDate = info.dateStr;
    // Check if there is a full-day time off on the clicked date.
    const fullDayTimeOffExists = events.some(
      (event) =>
        event.allDay &&
        event.title === "Time Off" &&
        event.start === clickedDate
    );
    if (fullDayTimeOffExists) {
      alert("This day is marked as unavailable for the full day.");
      return;
    }
    setSelectedDate(clickedDate);
    setBlockSingleDate(clickedDate);
    setBlockStartDate(clickedDate);
    setModalIsOpen(true);
  };

  const handleEventClick = (info) => {
    if (info.event.title !== "Time Off") {
      setSelectedBooking(info.event.extendedProps);
      setSummaryModalOpen(true);
    } else {
      setSelectedTimeeOffBlock(info.event);
      setConfirmCancelBlockOpen(true);
    }
  };

  const handleCancelBlockTime = async () => {
    try {
      await cancelRealtorAvailability({ variables: { input: { id: selectedTimeOffBlock.id } } });
      setConfirmCancelBlockOpen(false);
      setMessage("Time off cancelled successfully.");
      await refetch();
    } catch (error) {
      console.error("Error cancelling time off block:", error);
      setMessage("Failed to cancel time off.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      if (digits.length > 3 && digits.length <= 6) {
        formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else if (digits.length > 6) {
        formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else {
        formatted = digits;
      }
    }
    setFormData({ ...formData, [name]: formatted });
  };

  const handleApprovalChange = async (event) => {
    const status = event.target.value;

    try {
      if (status === "CONFIRMED" || status === "CANCELLED") {
        const { data } = await updateBookingStatus({
          variables: { id: selectedBooking.id, status },
        });

        setSelectedBooking({ ...selectedBooking, status: data.updateBookingStatus.status });

        setMessage(`Booking status updated to ${status}`);
      } else {
        setMessage("Invalid status selected.");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      setMessage("Error updating booking status. Please try again.");
    }
  };

  const handleSaveBooking = async () => {
    if (!selectedClient) {
      setMessage("Please select a client from the list.");
      return;
    }
    if (!availableSlots.includes(formData.startTime)) {
      setMessage("Please select a valid time slot.");
      return;
    }
    // Automatically set endTime as startTime + 1 hour.
    const [hour, minute] = formData.startTime.split(":").map(Number);
    const endHour = hour + 1;
    // Force minutes to be two digits.
    const endTime = `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  
    // Check if realtor has blocked the time slot.
    const slotDate = selectedDate;
    const toMinutes = time => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };
    const blockConflict = availabilityData?.getRealtorAvailability?.some(a => {
      const aDate = new Date(Number(a.date)).toISOString().split("T")[0];
      if (aDate !== slotDate) return false;
      if (a.type === "DAY" || a.type === "RANGE") {
        return true;
      }
      if (a.type === "TIME") {
        const blockStart = toMinutes(a.startTime);
        const blockEnd = toMinutes(a.endTime);
        const bookingStart = toMinutes(formData.startTime);
        const bookingEnd = toMinutes(endTime);
        return bookingStart < blockEnd && bookingEnd > blockStart;
      }
      return false;
    });
    if (blockConflict) {
      setMessage("The selected time slot is blocked by realtor availability.");
      return;
    }
  
    // Retrieve the current realtor id (assume it's stored in localStorage)
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const created_by = currentUser ? currentUser.id : null;
  
    try {
      await createRealtorBooking({
        variables: {
          input: {
            date: selectedDate,
            startTime: formData.startTime,
            endTime: endTime,
            mode: formData.meetingType.toUpperCase(),
            notes: formData.notes,
            status: "PENDING",
            clientId: selectedClient,
            created_by: created_by,
            propertyId: selectedProperty,
            realtorId: created_by
          }
        }
      });
      setMessage("Booking request sent! Waiting for client approval.");
      await refetch();
    } catch (error) {
      console.error("Error creating booking:", error);
      setMessage("Failed to create booking.");
    }
    setModalIsOpen(false);
    setShowBookingForm(false);
    setFormData({ notes: "", startTime: "09:00", endTime: "10:00", meetingType: "Zoom" });
    setSelectedClient("");
  };
  

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateBookingStatus({ variables: { id, status } });
      await refetch();
      setSummaryModalOpen(false);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Appointments</h2>
      {message && <div className="mb-4 text-purple-700 font-medium">{message}</div>}
      <div className="bg-white shadow rounded-lg p-6">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek,dayGridDay"
          }}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          events={events}
          displayEventTime={true}
          displayEventEnd={true}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false
          }}
        />
      </div>
      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={{
        content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '500px', borderRadius: '10px', padding: '20px' },
        overlay: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)' }
      }}>
        <div className="bg-white w-full max-w-md mx-auto p-6 text-center space-y-6">
          <button onClick={() => setModalIsOpen(false)} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition"><X size={18} /></button>
          <h2 className="text-xl font-semibold text-gray-800">What would you like to do?</h2>
          <p className="text-sm text-gray-500">Select an option for <span className="font-medium">{selectedDate}</span></p>
          <div className="flex flex-col gap-4">
            <button className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition" onClick={() => { setModalIsOpen(false); setShowBookingForm(true); }}>
              📅 Book Appointment
            </button>
            <button className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition" onClick={() => { setModalIsOpen(false); setShowBlockTimeForm(true); }}>
              🚫 Mark Time as Unavailable
            </button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showBlockTimeForm} onRequestClose={() => setShowBlockTimeForm(false)} style={{
        content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '700px', borderRadius: '12px', padding: '24px', position: 'relative' },
        overlay: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)' }
      }}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => { setShowBlockTimeForm(false); setModalIsOpen(true); }} className="text-sm text-gray-500 hover:text-purple-600 transition">← Back</button>
          <button onClick={() => setShowBlockTimeForm(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <form onSubmit={handleMarkUnavailable} className="space-y-4 w-full">
          <h2 className="text-lg font-semibold text-center text-gray-700">Mark Time as Unavailable</h2>
          <div>
            <label className="block text-gray-700 mb-1">I am unavailable for:</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="day" checked={unavailableType === "day"} onChange={() => setUnavailableType("day")} />
                <span>Whole Day</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="time" checked={unavailableType === "time"} onChange={() => setUnavailableType("time")} />
                <span>Specific Hours</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="range" checked={unavailableType === "range"} onChange={() => setUnavailableType("range")} />
                <span>Multiple Days</span>
              </label>
            </div>
          </div>
          {unavailableType === "range" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Start Date</label>
                <input type="date" value={blockStartDate} onChange={(e) => setBlockStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700">End Date</label>
                <input type="date" value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-gray-700">Date</label>
              <input type="date" value={blockSingleDate} onChange={(e) => setBlockSingleDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          )}
          {unavailableType === "time" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Start Time</label>
                <input type="time" value={blockStartTime} onChange={(e) => setBlockStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700">End Time</label>
                <input type="time" value={blockEndTime} onChange={(e) => setBlockEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-gray-700">Note (optional)</label>
            <textarea value={blockNote} onChange={(e) => setBlockNote(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-md">
            Block Time
          </button>
        </form>
      </Modal>
      <Modal isOpen={showBookingForm} onRequestClose={() => setShowBookingForm(false)} style={{
        content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '700px', borderRadius: '10px', padding: '20px' },
        overlay: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)' }
      }}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => { setShowBookingForm(false); setModalIsOpen(true); }} className="text-sm text-gray-500 hover:text-purple-600 transition">← Back</button>
          <button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <h2 className="text-xl font-semibold mb-4">Book Appointment for {selectedDate}</h2>
        

            
        {/* Dropdown for selecting a property */}
        <select 
          name="property"
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">Select a property</option>
          {propertiesData?.getRealtorProperties && propertiesData.getRealtorProperties.map(property => (
            <option key={property.id} value={property.id}>
              {property.title} ({property.location})
            </option>
          ))}
        </select>


        {/* Dropdown for selecting an existing client */}
        <select 
          name="client"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">Select a client</option>
          {clientsData?.getUniqueClients && clientsData.getUniqueClients.map(client => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName} ({client.email})
            </option>
          ))}
        </select>
        
        {/* Dropdown for available time slots */}
        <select 
          name="startTime"
          value={formData.startTime}
          onChange={(e) => {
            const selectedSlot = e.target.value;
            setFormData({
              ...formData,
              startTime: selectedSlot,
              endTime: (() => {
                const [h] = selectedSlot.split(":");
                // Always set minutes to "00"
                return `${String(Number(h) + 1).padStart(2, "0")}:00`;
              })()
            });
          }}
          className="w-full p-2 border rounded mb-2"
        >
        <option value="">Select a time slot</option>
        {availableSlots.map(slot => (
          <option key={slot} value={slot}>
            {slot} - {(() => {
              const [h] = slot.split(":");
              return `${String(Number(h) + 1).padStart(2, "0")}:00`;
            })()}
          </option>
        ))}
        </select>

        
        <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} className="w-full p-2 border rounded mb-2" />
        <select name="meetingType" value={formData.meetingType} onChange={handleInputChange} className="w-full p-2 border rounded mb-4">
          <option value="ZOOM">Zoom</option>
          <option value="IN_PERSON">In Person</option>
        </select>
        <button onClick={handleSaveBooking} className="bg-purple-600 text-white px-4 py-2 rounded w-full">Save</button>
      </Modal>

      <Modal
  isOpen={summaryModalOpen}
  onRequestClose={() => setSummaryModalOpen(false)}
  style={{
    content: {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '0',
      border: 'none',
      background: 'transparent',
      height: '600px',
      width: '90%',  
      borderRadius: '12px', 
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Darkened background overlay
      zIndex: 1000,
    },
  }}
>
  {selectedBooking && (
    <div className="bg-white max-w-md w-full mx-auto rounded-xl shadow-xl p-6 relative text-center space-y-4">
      <button onClick={() => setSummaryModalOpen(false)} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition">
        <X size={18} />
      </button>
      <div className="flex items-center justify-center gap-2">
        <FileText size={22} className="text-purple-600" />
        <h2 className="text-lg font-bold text-purple-600">Booking Summary</h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 mt-4">
        <table className="min-w-full text-sm text-left text-gray-700">
          <tbody>
            {selectedBooking.created_by && selectedBooking.created_by.id === realtorId ? (
              <>
                <tr className="border-b">
                  <th className="bg-gray-50 px-4 py-2 font-medium w-1/3">Name</th>
                  <td className="px-4 py-2">
                    {selectedBooking.client
                      ? `${selectedBooking.client.firstName} ${selectedBooking.client.lastName}`
                      : "N/A"}
                  </td>
                </tr>
                <tr className="border-b">
                  <th className="bg-gray-50 px-4 py-2 font-medium">Email</th>
                  <td className="px-4 py-2">
                    {selectedBooking.client
                      ? selectedBooking.client.email
                      : "N/A"}
                  </td>
                </tr>
                {/* Phone row removed for client details */}
              </>
            ) : (
              <>
                <tr className="border-b">
                  <th className="bg-gray-50 px-4 py-2 font-medium w-1/3">Name</th>
                  <td className="px-4 py-2">{selectedBooking.name || "N/A"}</td>
                </tr>
                <tr className="border-b">
                  <th className="bg-gray-50 px-4 py-2 font-medium">Email</th>
                  <td className="px-4 py-2">{selectedBooking.email || "N/A"}</td>
                </tr>
                <tr className="border-b">
                  <th className="bg-gray-50 px-4 py-2 font-medium">Phone</th>
                  <td className="px-4 py-2">{selectedBooking.phone || "N/A"}</td>
                </tr>
              </>
            )}
            <tr className="border-b">
              <th className="bg-gray-50 px-4 py-2 font-medium">Date</th>
              <td className="px-4 py-2">{selectedBooking.date}</td>
            </tr>
            <tr className="border-b">
              <th className="bg-gray-50 px-4 py-2 font-medium">Time</th>
              <td className="px-4 py-2">
                {selectedBooking.startTime} - {selectedBooking.endTime}
              </td>
            </tr>
            <tr className="border-b">
              <th className="bg-gray-50 px-4 py-2 font-medium">Mode</th>
              <td className="px-4 py-2">
                {selectedBooking.mode === "IN_PERSON" ? "In Person" : "Zoom"}
              </td>
            </tr>
            <tr className="border-b">
              <th className="bg-gray-50 px-4 py-2 font-medium">Status</th>
              <td className="px-4 py-2">
                <span
                  className={`inline-block px-2 py-0.5 border rounded-full text-xs font-medium ${
                    selectedBooking.status === "CONFIRMED"
                      ? "text-green-700 border-green-300 bg-green-50"
                      : selectedBooking.status === "PENDING"
                      ? "text-yellow-800 border-yellow-300 bg-yellow-50"
                      : "text-red-700 border-red-300 bg-red-50"
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </td>
            </tr>
            <tr>
              <th className="bg-gray-50 px-4 py-2 font-medium">Notes</th>
              <td className="px-4 py-2">{selectedBooking.notes || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {selectedBooking.status === "PENDING" && (
        <div className="my-4 text-center text-sm text-gray-600">
          {selectedBooking.created_by && selectedBooking.created_by.id === realtorId ? (
            // If the created_by ID matches realtorId, show the text message
            <p>We're waiting for client's approval.</p>
          ) : (
            // Otherwise, show the approval/rejection dropdown
            <div className="flex justify-center gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all ease-in-out duration-200 hover:bg-purple-100 bg-white text-gray-700 shadow-sm hover:shadow-md"
                onChange={(e) => handleApprovalChange(e)}
                defaultValue=""
              >
                <option value="" disabled>
                  Select Approval Status
                </option>
                <option value="CONFIRMED">Confirm</option>
                <option value="CANCELLED">Cancel</option>
              </select>

            </div>
          )}
        </div>
      )}

    </div>
  )}
</Modal>

      <Modal isOpen={confirmCancelBlockOpen} onRequestClose={() => setConfirmCancelBlockOpen(false)} style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '480px',
          borderRadius: '16px',
          padding: '0',
          border: 'none',
          background: 'transparent'
        },
        overlay: {
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
      }}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <XCircle size={48} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Cancel Time Off?</h2>
          <p className="text-sm text-gray-600">
            Are you sure you want to remove this time off block? This action cannot be undone.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => setConfirmCancelBlockOpen(false)}
              className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
            >
              No, Keep It
            </button>
            <button
              onClick={handleCancelBlockTime}
              className="px-5 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium shadow-md"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
