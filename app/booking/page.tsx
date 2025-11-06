'use client';

import { useState } from 'react';

interface FormData {
  branch: string;
  service: string;
  staff: string;
  room: string;
  date: string;
  selectedTime: string;
}

interface SelectOption {
  id: number;
  name: string;
}

export default function BookingPage() {
  const [formData, setFormData] = useState<FormData>({
    branch: '',
    service: '',
    staff: '',
    room: '',
    date: '',
    selectedTime: ''
  });

  // Sample data - replace with your actual data sources
  const branches: SelectOption[] = [
    { id: 1, name: 'Downtown Branch' },
    { id: 2, name: 'Uptown Branch' },
    { id: 3, name: 'Westside Branch' }
  ];

  const services: SelectOption[] = [
    { id: 1, name: 'Haircut' },
    { id: 2, name: 'Massage' },
    { id: 3, name: 'Consultation' },
    { id: 4, name: 'Spa Treatment' }
  ];

  const staff: SelectOption[] = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' }
  ];

  const rooms: SelectOption[] = [
    { id: 1, name: 'Room A' },
    { id: 2, name: 'Room B' },
    { id: 3, name: 'Room C' }
  ];

  const timeSlots: string[] = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimeSlotClick = (time: string): void => {
    setFormData(prev => ({
      ...prev,
      selectedTime: time
    }));
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    
    // Validate all fields
    if (!formData.branch || !formData.service || !formData.staff || 
        !formData.room || !formData.date || !formData.selectedTime) {
      alert('Please fill in all fields');
      return;
    }

    console.log('Booking Details:', formData);
    alert('Booking confirmed! Check console for details.');
    
    // Reset form or redirect as needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Book an Appointment</h1>
          <p className="text-gray-600 mb-8">Fill in the details below to schedule your visit</p>

          <div className="space-y-6">
            {/* Branch */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                Branch Location
              </label>
              <select
                id="branch"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                required
              >
                <option value="" disabled className="text-gray-400">Choose a branch...</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            {/* Service */}
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <select
                id="service"
                value={formData.service}
                onChange={(e) => handleInputChange('service', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                required
              >
                <option value="" disabled className="text-gray-400">Choose a service...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>

            {/* Staff */}
            <div>
              <label htmlFor="staff" className="block text-sm font-medium text-gray-700 mb-2">
                Staff
              </label>
              <select
                id="staff"
                value={formData.staff}
                onChange={(e) => handleInputChange('staff', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                required
              >
                <option value="" disabled className="text-gray-400">Choose a staff member...</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                Room
              </label>
              <select
                id="room"
                value={formData.room}
                onChange={(e) => handleInputChange('room', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                required
              >
                <option value="" disabled className="text-gray-400">Choose a room...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Time
              </label>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSlotClick(time)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      formData.selectedTime === time
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {!formData.selectedTime && (
                <p className="text-sm text-gray-500 mt-2">Please select a time slot</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}