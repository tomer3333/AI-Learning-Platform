import { useState } from 'react';
import { CheckCircle2, Copy, Check, MessageCircle } from 'lucide-react';
import type { HomeworkResult } from '../types/homework';
import { formatHomeworkAsText } from '../utils/formatHomework';

interface ResultViewProps {
  result: HomeworkResult;
}

export function ResultView({ result }: ResultViewProps) {
  const [copied, setCopied] = useState(false);

  const formattedText = formatHomeworkAsText(result);

  function handleCopy() {
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(formattedText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">

      {/* Success banner */}
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle2 size={16} className="shrink-0" />
        <span>
          שיעורי הבית נשמרו &mdash; מזהה{' '}
          <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs text-green-800">
            {result.id}
          </code>
        </span>
      </div>

      {/* Message preview */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* Preview header */}
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            תצוגת הודעה — Message Preview
          </p>
        </div>

        {/* Scrollable text */}
        <textarea
          id="homework-preview"
          readOnly
          dir="rtl"
          value={formattedText}
          rows={18}
          className="w-full resize-none bg-white px-5 py-4 font-mono text-sm leading-relaxed text-gray-800 focus:outline-none"
        />

        {/* Action buttons */}
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row">

          {/* Copy to Clipboard */}
          <button
            id="copy-homework-btn"
            type="button"
            onClick={handleCopy}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200',
              copied
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
            ].join(' ')}
            aria-label="העתק מטלה ללוח"
          >
            {copied ? (
              <><Check size={15} className="shrink-0" /> הועתק!</>
            ) : (
              <><Copy size={15} className="shrink-0" /> העתק ללוח</>
            )}
          </button>

          {/* Send via WhatsApp */}
          <button
            id="whatsapp-homework-btn"
            type="button"
            onClick={handleWhatsApp}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition-all duration-200 hover:border-[#25D366]/60 hover:bg-[#25D366]/20"
            aria-label="שלח מטלה בווטסאפ"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <MessageCircle size={15} className="shrink-0 sm:hidden" />
            שלח בווטסאפ
          </button>

        </div>
      </div>

    </div>
  );
}
