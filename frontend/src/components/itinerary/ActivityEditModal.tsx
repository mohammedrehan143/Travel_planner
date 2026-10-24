import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Activity, ActivityCategory, BookingStatus } from '../../types';

interface ActivityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activityData: Partial<Activity>) => void;
  initialActivity?: Activity | null;
  dayId: string;
}

export const ActivityEditModal: React.FC<ActivityEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialActivity,
  dayId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [dietaryTag, setDietaryTag] = useState<'veg' | 'non_veg' | 'both' | 'none'>('none');
  const [category, setCategory] = useState<ActivityCategory>('sightseeing');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [bookingRequired, setBookingRequired] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('not_booked');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialActivity) {
      setTitle(initialActivity.title);
      setDescription(initialActivity.description || '');
      setSpeciality(initialActivity.speciality || '');
      setDietaryTag(initialActivity.dietary_tag || 'none');
      setCategory(initialActivity.category);
      setStartTime(initialActivity.start_time);
      setEndTime(initialActivity.end_time);
      setLocationName(initialActivity.location_name);
      setLocationAddress(initialActivity.location_address || '');
      setEstimatedCost(initialActivity.estimated_cost);
      setBookingRequired(initialActivity.booking_required);
      setBookingStatus(initialActivity.booking_status);
      setNotes(initialActivity.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setSpeciality('');
      setDietaryTag('none');
      setCategory('sightseeing');
      setStartTime('10:00');
      setEndTime('12:00');
      setLocationName('');
      setLocationAddress('');
      setEstimatedCost(0);
      setBookingRequired(false);
      setBookingStatus('not_booked');
      setNotes('');
    }
  }, [initialActivity, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) return;

    // Calculate duration in minutes (handles crossing midnight)
    const [startH, startM] = (startTime || '10:00').split(':').map(Number);
    const [endH, endM] = (endTime || '12:00').split(':').map(Number);
    let diff = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
    if (diff <= 0) diff += 24 * 60;
    const durationMinutes = Math.max(15, diff);

    onSave({
      title,
      description,
      speciality: speciality.trim() || undefined,
      dietary_tag: dietaryTag !== 'none' ? dietaryTag : undefined,
      category,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      location_name: locationName,
      location_address: locationAddress,
      estimated_cost: Math.max(0, Number(estimatedCost) || 0),
      booking_required: bookingRequired,
      booking_status: bookingStatus,
      notes,
      trip_day_id: dayId,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialActivity ? 'Edit Activity' : 'Add New Activity'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-[#171717]">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
            Activity Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Asakusa Senso-ji Temple & Street Food"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
          />
        </div>

        {/* Category & Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
            >
              <option value="sightseeing">Sightseeing</option>
              <option value="cultural">Cultural</option>
              <option value="dining">Dining</option>
              <option value="outdoor">Outdoor</option>
              <option value="entertainment">Entertainment</option>
              <option value="shopping">Shopping</option>
              <option value="relaxation">Hangout & Relaxation</option>
              <option value="transit">Traveling</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
              Estimated Cost
            </label>
            <input
              type="number"
              min="0"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
            />
          </div>
        </div>

        {/* Speciality of the Place & Dietary Preference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
              ✨ Speciality of the Place
            </label>
            <input
              type="text"
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
              placeholder="e.g. Crispy Ghee Masala Dosa, 300m Skybridge"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
              Dietary Food Tag
            </label>
            <select
              value={dietaryTag}
              onChange={(e) => setDietaryTag(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
            >
              <option value="none">Not Applicable / None</option>
              <option value="veg">🥬 Pure Vegetarian (Veg)</option>
              <option value="non_veg">🍗 Non-Vegetarian</option>
              <option value="both">🥗 Veg & Non-Veg Friendly</option>
            </select>
          </div>
        </div>

        {/* Time start & end */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
            />
          </div>
        </div>

        {/* Location Name & Address */}
        <div>
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
            Location Name *
          </label>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Senso-ji Temple"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
            Address / Neighborhood (Optional)
          </label>
          <input
            type="text"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="e.g. Asakusa, Taito City, Tokyo"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of the activity..."
            className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
          />
        </div>

        {/* Booking details */}
        <div className="p-3 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#171717]">Requires advance booking/ticket?</label>
            <input
              type="checkbox"
              checked={bookingRequired}
              onChange={(e) => setBookingRequired(e.target.checked)}
              className="w-4 h-4 rounded text-[#F97316] focus:ring-[#F97316] accent-[#F97316]"
            />
          </div>

          {bookingRequired && (
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs text-[#525252] font-medium">Status:</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#171717]"
              >
                <option value="not_booked">Not Booked Yet</option>
                <option value="booked">Booked & Confirmed</option>
                <option value="optional">Optional Fast Pass</option>
              </select>
            </div>
          )}
        </div>

        {/* Local tips / notes */}
        <div>
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
            Travel Notes & Tips
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Best photography spot is near five-story pagoda at 9 AM"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#171717] hover:bg-[#F3F4F6]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold shadow-sm transition-colors active:scale-95"
          >
            {initialActivity ? 'Save Changes' : 'Add Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
