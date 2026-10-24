import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Users, Mail, Copy, Check, Shield, UserPlus } from 'lucide-react';
import { Trip, TripCollaborator } from '../../types';
import { useTrips } from '../../context/TripContext';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  collaborators: TripCollaborator[];
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  trip,
  collaborators,
}) => {
  const { addCollaborator } = useTrips();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [copied, setCopied] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    addCollaborator(email, role);
    setEmail('');
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href);
      } else {
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Sharing & Collaboration" maxWidth="lg">
      <div className="space-y-6 text-[#171717]">
        {/* Copy share link */}
        <div className="p-4 bg-[#F3F4F6] rounded-2xl border border-[#E5E7EB] space-y-2">
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
            Shareable Trip Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 px-3 py-2 bg-white rounded-xl border border-[#E5E7EB] text-xs text-[#525252] select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#F3F4F6] transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-[#F97316]" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Invite by Email */}
        <form onSubmit={handleInvite} className="space-y-3">
          <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
            Invite Friend or Co-Planner
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="colleague@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white text-[#171717]"
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="editor">Can Edit & Add Activities</option>
              <option value="viewer">Viewer Only</option>
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors shrink-0 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Send Invite</span>
            </button>
          </div>
        </form>

        {/* Current Collaborators List */}
        <div>
          <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider mb-3">
            Active Members ({collaborators.length})
          </h4>
          <div className="space-y-2">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {c.avatar_url ? (
                    <img
                      src={c.avatar_url}
                      alt={c.full_name || 'Member'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#E5E7EB]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
                      <Users className="w-4 h-4 text-[#F97316]" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-[#171717]">{c.full_name || (c.role === 'owner' ? 'Trip owner' : 'Collaborator')}</p>
                    <p className="text-[10px] text-[#525252]">{c.invited_email || 'Development sample member'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.role === 'owner'
                        ? 'bg-orange-50 text-orange-800 border border-orange-200'
                        : c.role === 'editor'
                        ? 'bg-[#171717] text-white'
                        : 'bg-[#F3F4F6] text-[#525252] border border-[#E5E7EB]'
                    }`}
                  >
                    {c.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-[11px] text-[#525252] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
          <span>Supabase Row-Level-Security (RLS) guarantees editor permissions are validated.</span>
        </div>
      </div>
    </Modal>
  );
};
