import React from 'react';
import {
  Clock,
  MapPin,
  DollarSign,
  Ticket,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  ExternalLink,
  Utensils,
  Landmark,
  Compass,
  Trees,
  ShoppingBag,
  Sparkles,
  Coffee
} from 'lucide-react';
import { Activity, ActivityCategory } from '../../types';
import { formatCurrency } from '../../lib/currency';

interface ActivityCardProps {
  activity: Activity;
  index: number;
  totalActivities: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; icon: React.ReactNode }
> = {
  cultural: {
    label: 'Cultural',
    icon: <Landmark className="w-3.5 h-3.5 text-[#F97316]" />,
  },
  dining: {
    label: 'Dining',
    icon: <Utensils className="w-3.5 h-3.5 text-[#F97316]" />,
  },
  sightseeing: {
    label: 'Sightseeing',
    icon: <Compass className="w-3.5 h-3.5 text-[#F97316]" />,
  },
  outdoor: {
    label: 'Outdoor',
    icon: <Trees className="w-3.5 h-3.5 text-[#F97316]" />,
  },
  shopping: {
    label: 'Shopping',
    icon: <ShoppingBag className="w-3.5 h-3.5 text-[#F97316]" />,
  },
  entertainment: {
    label: 'Entertainment',
    icon: <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />,
  },
  relaxation: {
    label: 'Hangout & Relax',
    icon: <Coffee className="w-3.5 h-3.5 text-[#F97316]" />,
  },
  transit: {
    label: 'Traveling',
    icon: <Clock className="w-3.5 h-3.5 text-[#F97316]" />,
  },
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  index,
  totalActivities,
  isSelected = true,
  onToggleSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const catConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.sightseeing;
  const googleMapsSearchUrl =
    activity.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${activity.location_name || activity.title} ${activity.location_address || ''}`.trim()
    )}`;

  // Extract speciality or dietary from notes if present
  let displaySpeciality = activity.speciality;
  let displayDietary = activity.dietary_tag;

  if (activity.notes) {
    if (!displaySpeciality && activity.notes.includes('Speciality:')) {
      const match = activity.notes.match(/Speciality:\s*([^|•]+)/i);
      if (match) displaySpeciality = match[1].trim();
    }
    if (!displayDietary && activity.notes.includes('Dietary:')) {
      const match = activity.notes.match(/Dietary:\s*([^|•]+)/i);
      if (match) {
        const d = match[1].trim().toLowerCase();
        if (d.includes('veg') && !d.includes('non')) displayDietary = 'veg';
        else if (d.includes('non')) displayDietary = 'non_veg';
        else displayDietary = 'both';
      }
    }
  }

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
      isSelected
        ? 'border-[#E5E7EB] shadow-card hover:border-[#F97316]/50 hover:shadow-md'
        : 'border-[#E5E7EB] opacity-60 bg-[#F3F4F6]/50'
    }`}>
      {/* Top status bar accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 pt-3.5 pb-2.5 border-b border-[#E5E7EB] bg-[#F3F4F6]/50">
        <div className="flex items-center gap-2.5">
          {/* Activity Selection Checkbox */}
          {onToggleSelect && (
            <label className="flex items-center cursor-pointer select-none" title="Select to include in final trip">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 rounded text-[#F97316] focus:ring-[#F97316] border-[#E5E7EB] cursor-pointer accent-[#F97316]"
              />
            </label>
          )}

          {/* Order Badge */}
          <span className="w-6 h-6 rounded-full bg-[#171717] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {index + 1}
          </span>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#171717] bg-white px-2.5 py-1 rounded-md border border-[#E5E7EB]">
            <Clock className="w-3.5 h-3.5 text-[#F97316]" />
            <span>
              {activity.start_time} - {activity.end_time}
            </span>
            <span className="text-[#525252] font-normal">({activity.duration_minutes}m)</span>
          </div>

          {/* Category Tag */}
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border border-[#E5E7EB] bg-white text-[#171717]">
            {catConfig.icon}
            <span>{catConfig.label}</span>
          </div>

          {/* Dietary Tag Badge */}
          {displayDietary && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                displayDietary === 'veg'
                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                  : displayDietary === 'non_veg'
                  ? 'bg-[#171717] text-white border-neutral-800'
                  : 'bg-[#F3F4F6] text-[#171717] border-[#E5E7EB]'
              }`}
            >
              {displayDietary === 'veg' ? '🥬 Pure Veg' : displayDietary === 'non_veg' ? '🍗 Non-Veg' : '🥗 Veg & Non-Veg'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          {/* Move Up / Down */}
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              title="Move activity earlier"
              className="p-1 rounded text-neutral-400 hover:text-[#171717] hover:bg-[#F3F4F6] disabled:opacity-20 disabled:hover:bg-transparent"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              disabled={index === totalActivities - 1}
              title="Move activity later"
              className="p-1 rounded text-neutral-400 hover:text-[#171717] hover:bg-[#F3F4F6] disabled:opacity-20 disabled:hover:bg-transparent"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => onEdit(activity)}
            className="p-1.5 rounded-lg text-[#525252] hover:text-[#F97316] hover:bg-orange-50 transition-colors"
            title="Edit activity"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(activity.id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#DC2626] hover:bg-red-50 transition-colors"
            title="Remove activity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View place on Google Maps"
            className="text-base font-bold text-[#171717] hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5 group/link"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="hover:underline">{activity.title}</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover/link:text-[#F97316] shrink-0" />
          </a>

          {displaySpeciality && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-900 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
              <span>Speciality: {displaySpeciality}</span>
            </div>
          )}
        </div>

        {activity.description && (
          <p className="text-sm text-[#525252] leading-relaxed">{activity.description}</p>
        )}

        {/* Location & Address */}
        <div className="flex items-start gap-2 text-xs text-[#525252]">
          <MapPin className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
          <div>
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open location on Google Maps"
              className="font-semibold text-[#171717] hover:text-[#F97316] hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{activity.location_name}</span>
              <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
            </a>
            {activity.location_address && (
              <span className="block text-[#525252]">{activity.location_address}</span>
            )}
          </div>
        </div>

        {/* Notes */}
        {activity.notes && (
          <div className="p-2.5 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] text-xs text-[#171717] leading-normal">
            <span className="font-bold text-[#F97316]">Local tip: </span>
            {activity.notes}
          </div>
        )}

        {/* Footer Meta: Cost & Booking */}
        <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-semibold text-[#171717]">
            <span>
              {activity.estimated_cost === 0
                ? 'Free entry'
                : `Est. ${formatCurrency(activity.estimated_cost, activity.currency)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activity.booking_status === 'booked' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Ticket className="w-3 h-3 text-[#16A34A]" />
                Booked
              </span>
            ) : activity.booking_required ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
                <Ticket className="w-3 h-3 text-[#F97316]" />
                Booking Required
              </span>
            ) : (
              <span className="text-[#525252] text-[11px]">No reservation needed</span>
            )}

            {activity.booking_url && (
              <a
                href={activity.booking_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#F97316] hover:text-[#EA580C] font-semibold hover:underline ml-1"
              >
                <span>Tickets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
