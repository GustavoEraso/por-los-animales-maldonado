'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { FormComment } from '@/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Hoy';
  if (isSameDay(date, yesterday)) return 'Ayer';

  return date.toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Groups a sorted array of FormComments by calendar day for date separator rendering.
 */
function groupByDay(comments: FormComment[]): { date: string; items: FormComment[] }[] {
  const groups: { date: string; items: FormComment[] }[] = [];

  for (const comment of comments) {
    const dayKey = comment.createdAt.slice(0, 10); // YYYY-MM-DD
    const last = groups[groups.length - 1];
    if (last && last.date === dayKey) {
      last.items.push(comment);
    } else {
      groups.push({ date: dayKey, items: [comment] });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FormChatProps {
  formId: string;
}

/**
 * Real-time WhatsApp-style discussion thread for an adoption form.
 * Accessible only to rescatistas, admins, and superadmins.
 * Uses Firestore `onSnapshot` for live updates.
 *
 * @example
 * <FormChat formId={form.id} />
 */
export default function FormChat({ formId }: FormChatProps) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<FormComment[]>([]);
  const [text, setText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---------------------------------------------------------------------------
  // Real-time subscription
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const q = query(collection(db, 'googleFormComments'), orderBy('createdAt', 'asc'));

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((doc) => ({
          ...(doc.data() as Omit<FormComment, 'id'>),
          id: doc.id,
        })) as FormComment[];

        setComments(all.filter((c) => c.formId === formId));
      },
      (error) => {
        logger({ level: 'error', code: 'FORM_CHAT_SUBSCRIPTION_ERROR', message: 'FormChat subscription error:', data: error });
      }
    );

    return () => unsubscribe();
  }, [formId]);

  // Scroll to bottom on new messages (only within the chat container)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [comments]);

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser || sending) return;

    setSending(true);

    try {
      const comment: Omit<FormComment, 'id'> = {
        formId,
        text: trimmed,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'googleFormComments'), comment);
      setText('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      logger({ level: 'error', code: 'SEND_COMMENT_ERROR', message: 'Error sending comment:', data: error });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-grow
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const groups = groupByDay(comments);

  return (
    <div className="border border-gray-200 rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-semibold text-gray-700">Discusión interna</p>
        <p className="text-xs text-gray-400">Solo visible para el equipo</p>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1 min-h-[260px] max-h-[480px] bg-[#efeae2]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4c9b9' fill-opacity='0.3'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {comments.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400 bg-white/70 px-3 py-1.5 rounded-full">
              Sin comentarios aún. ¡Sé el primero!
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date} className="flex flex-col gap-1">
            {/* Date separator */}
            <div className="flex justify-center my-2">
              <span className="text-xs text-gray-500 bg-white/80 px-3 py-0.5 rounded-full shadow-sm">
                {formatDateHeader(group.items[0].createdAt)}
              </span>
            </div>

            {/* Bubbles */}
            {group.items.map((comment) => {
              const isOwn = comment.authorId === currentUser?.id;

              return (
                <div
                  key={comment.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-0.5`}
                >
                  <div
                    className={`max-w-[75%] px-3 pt-2 pb-1.5 rounded-2xl shadow-sm text-sm leading-relaxed relative ${
                      isOwn
                        ? 'bg-[#dcf8c6] text-gray-900 rounded-br-sm'
                        : 'bg-white text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {/* Author name (only for others) */}
                    {!isOwn && (
                      <p className="text-xs font-semibold text-green-forest mb-0.5">
                        {comment.authorName}
                      </p>
                    )}

                    {/* Message text */}
                    <p className="whitespace-pre-wrap break-words">{comment.text}</p>

                    {/* Timestamp */}
                    <p className="text-[10px] text-gray-400 text-right mt-0.5 -mb-0.5">
                      {formatTime(comment.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-gray-50">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comentario..."
          rows={1}
          disabled={sending}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-green-forest transition-colors bg-white disabled:opacity-50 overflow-hidden"
          style={{ minHeight: '38px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-full bg-green-forest text-white flex items-center justify-center hover:bg-green-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Enviar comentario"
        >
          {/* Send icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 translate-x-0.5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
