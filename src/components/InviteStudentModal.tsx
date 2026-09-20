// @ts-nocheck
import { useState } from 'react';
import { X, Loader2, Send, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { createInvitation } from '../services/assessmentService';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface InviteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  studentUserId: string;
  studentName: string;
  conversationId?: string;
  onInvited?: () => void;
}

export default function InviteStudentModal({
  isOpen,
  onClose,
  assessmentId,
  studentUserId,
  studentName,
  conversationId,
  onInvited,
}: InviteStudentModalProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testLink, setTestLink] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInvite = async () => {
    setSending(true);
    setError('');
    try {
      const invitation = await createInvitation(assessmentId, studentUserId);
      const link = `${window.location.origin}/test/${invitation.token}`;
      setTestLink(link);

      // If conversation exists, inject the test link as a message
      if (conversationId && user?.id) {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (senderProfile) {
          await supabase.from('messages').insert([{
            sender_id: senderProfile.id,
            conversation_id: conversationId,
            text: `You've been invited to take a skill verification test. Please complete it within the time limit.\n\n🔗 ${link}`,
          }]);
        }
      }

      setSuccess(true);
      onInvited?.();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            {success ? 'Invitation Sent' : 'Send Verification Test'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="py-4 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-900">Test link sent to {studentName}</p>
              {conversationId && (
                <p className="text-xs text-slate-500">Message injected into the conversation.</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Test Link</p>
              <div className="flex items-center gap-2">
                <code className="text-[11px] text-slate-600 font-mono break-all flex-1">{testLink}</code>
                <a href={testLink} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 hover:bg-slate-200 rounded-lg">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl hover:bg-[#802223] cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#9E2A2B]" />
                <span className="text-xs font-bold text-slate-800">{studentName}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                A unique test link will be generated with a 15-minute time limit. The student will receive it in the chat.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-600 font-semibold">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={sending}
                className="px-5 py-2 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl hover:bg-[#802223] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {conversationId ? 'Approve & Send Link' : 'Send Invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
