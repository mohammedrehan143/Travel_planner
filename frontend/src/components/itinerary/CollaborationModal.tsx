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
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Sharing & Collaboration" maxWidth="lg">
      <div className="space-y-6">
        {/* Copy share link */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Shareable Trip Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 select-all"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Invite by Email */}
        <form onSubmit={handleInvite} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Invite Friend or Co-Planner
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="colleague@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="editor">Can Edit & Add Activities</option>
              <option value="viewer">Viewer Only</option>
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Send Invite</span>
            </button>
          </div>
        </form>

        {/* Current Collaborators List */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Active Members ({collaborators.length})
          </h4>
          <div className="space-y-2">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                    alt={c.full_name || 'Member'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{c.full_name || 'Collaborator'}</p>
                    <p className="text-[10px] text-slate-500">{c.invited_email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.role === 'owner'
                        ? 'bg-blue-100 text-blue-700'
                        : c.role === 'editor'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Supabase Row-Level-Security (RLS) guarantees editor permissions are validated.</span>
        </div>
      </div>
    </Modal>
  );
};
