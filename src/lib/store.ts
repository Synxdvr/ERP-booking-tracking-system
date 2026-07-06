import { create } from "zustand";
import { Booking, Room, Staff, StaffAttendance } from "@/types";

interface ScheduleStore {
  selectedDate: Date;
  bookings: Booking[];
  rooms: Room[];
  staff: Staff[];
  attendance: StaffAttendance[];
  isLoading: boolean;
  modalOpen: boolean;
  editingBooking: Booking | null;
  draftSlot: { slot: string; staff_id: string } | null;

  setSelectedDate: (date: Date) => void;
  setBookings: (bookings: Booking[]) => void;
  setRooms: (rooms: Room[]) => void;
  setStaff: (staff: Staff[]) => void;
  setAttendance: (attendance: StaffAttendance[]) => void;
  upsertAttendance: (record: StaffAttendance) => void;
  setLoading: (v: boolean) => void;
  openNewBooking: (slot?: string, staff_id?: string) => void;
  openEditBooking: (booking: Booking) => void;
  closeModal: () => void;
  upsertBooking: (booking: Booking) => void;
  removeBooking: (id: string) => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  selectedDate: new Date(),
  bookings: [],
  rooms: [],
  staff: [],
  attendance: [],
  isLoading: false,
  modalOpen: false,
  editingBooking: null,
  draftSlot: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setBookings:     (bookings) => set({ bookings }),
  setRooms:        (rooms) => set({ rooms }),
  setStaff:        (staff) => set({ staff }),
  setAttendance:   (attendance) => set({ attendance }),
  upsertAttendance: (record) =>
    set((s) => ({
      attendance: s.attendance.some((a) => a.id === record.id)
        ? s.attendance.map((a) => (a.id === record.id ? record : a))
        : [...s.attendance, record],
    })),
  setLoading:      (v) => set({ isLoading: v }),

  openNewBooking: (slot, staff_id) =>
    set({ modalOpen: true, editingBooking: null, draftSlot: slot && staff_id ? { slot, staff_id } : null }),
  openEditBooking: (booking) =>
    set({ modalOpen: true, editingBooking: booking, draftSlot: null }),
  closeModal: () =>
    set({ modalOpen: false, editingBooking: null, draftSlot: null }),

  upsertBooking: (booking) =>
    set((s) => ({
      bookings: s.bookings.some((b) => b.id === booking.id)
        ? s.bookings.map((b) => (b.id === booking.id ? booking : b))
        : [...s.bookings, booking],
    })),
  removeBooking: (id) =>
    set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
}));
