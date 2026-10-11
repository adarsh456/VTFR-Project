import React from 'react';
import LatexRenderer from '../math/LatexRenderer';
import { AlertTriangle, Video, FileText, Image as ImageIcon, Sparkles, ArrowRight, X } from 'lucide-react';

export default function RemedialModal({
  isOpen,
  onClose,
  explanation,
  relatedContent,
  hasAlternate,
  onLaunchAlternate
}) {
  if (!isOpen) return null;

  const conceptSummary = relatedContent?.conceptSummary || 'Review the core theoretical principles before attempting again.';
  const youtube = relatedContent?.youtubeResource;
  const image = relatedContent?.imageResource;
  const pdf = relatedContent?.pdfResource;

  return (
    <div className="mkcl-modal-overlay">
      <div className="mkcl-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative border-red-200 shadow-2xl animate-fade-in-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tag */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center border border-red-200 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0B2545]">Misconception Identified</h2>
            <p className="text-xs text-red-600 font-medium">Diagnostic Feedback & Remedial Support</p>
          </div>
        </div>

        {/* Distractor / Feedback Explanation */}
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm leading-relaxed mb-6 font-medium">
          <LatexRenderer content={explanation} />
        </div>

        {/* Remedial Content Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0077B6]" />
            <span>Remedial Concept Resources</span>
          </h3>

          {/* Concept Refresher Card */}
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200">
            <div className="font-bold text-sm text-[#0077B6] mb-1">Concept Summary</div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              <LatexRenderer content={conceptSummary} />
            </p>
          </div>

          {/* Video Tutorial Resource */}
          {youtube && (
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">{youtube.title || 'Video Tutorial'}</div>
                  <div className="text-xs text-gray-500">{youtube.searchQuery || 'Curated educational video lesson'}</div>
                </div>
              </div>
              {youtube.url && (
                <a
                  href={youtube.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shrink-0"
                >
                  Watch Video
                </a>
              )}
            </div>
          )}

          {/* 5-Panel Educational Card Image */}
          {image && image.url && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 mb-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Educational Concept Card</span>
              </div>
              <img
                src={image.url}
                alt="Educational Concept Card"
                className="w-full rounded-lg max-h-64 object-contain bg-white border border-gray-200"
              />
            </div>
          )}

          {/* PDF Notes Resource */}
          {pdf && pdf.url && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0077B6] text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">{pdf.title || 'Textbook PDF Notes'}</div>
                  <div className="text-xs text-gray-500">Reference learning material</div>
                </div>
              </div>
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#0077B6] hover:bg-[#0B2545] text-white text-xs font-semibold transition-colors shrink-0"
              >
                View PDF
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-mkcl-secondary text-sm"
          >
            Review Step
          </button>

          {hasAlternate && (
            <button
              type="button"
              onClick={onLaunchAlternate}
              className="btn-mkcl-primary text-sm"
            >
              <span>Try Alternate Scaffolded Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
