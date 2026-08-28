import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Trash2, Plus, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import type { VocabularyItem, HomeworkResult } from '../types/homework';
import { useGenerateMutation } from '../hooks/useHomeworkAPI';

interface VerificationViewProps {
  vocab: VocabularyItem[];
  studentId: string;
  onProceed: (result: HomeworkResult) => void;
}

interface FormValues {
  items: VocabularyItem[];
}

export function VerificationView({ vocab, studentId, onProceed }: VerificationViewProps) {
  const { mutate, isPending, isError, error } = useGenerateMutation();

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { items: vocab },
  });

  // Re-sync form if parent passes a new vocab array (e.g. user goes back)
  useEffect(() => {
    reset({ items: vocab });
  }, [vocab, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = (data: FormValues) => {
    // Filter out any blanks before sending
    const cleaned = data.items.filter(
      (it) => it.arabic_phonetic.trim() !== '' || it.hebrew_definition.trim() !== ''
    );
    mutate(
      { studentId, verifiedVocabulary: cleaned },
      { onSuccess: (result) => onProceed(result) }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header counts */}
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-700">{fields.length}</span> vocabulary items extracted — edit or add before generating.
      </p>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Arabic / Phonetic</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Hebrew Definition</span>
        <span className="w-8" />
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Arabic phonetic */}
            <input
              {...register(`items.${index}.arabic_phonetic`)}
              id={`item-arabic-${index}`}
              placeholder="e.g. مَرْحَبًا"
              dir="auto"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />

            {/* Hebrew definition */}
            <input
              {...register(`items.${index}.hebrew_definition`)}
              id={`item-hebrew-${index}`}
              placeholder="e.g. שלום"
              dir="rtl"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />

            {/* Delete */}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Delete item ${index + 1}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Add word */}
      <button
        type="button"
        id="add-word-btn"
        onClick={() => append({ arabic_phonetic: '', hebrew_definition: '' })}
        className="flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-all w-full justify-center"
      >
        <Plus size={15} />
        Add Word
      </button>

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error?.message ?? 'An unexpected error occurred.'}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        id="generate-homework-btn"
        disabled={isPending || fields.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating homework…
          </>
        ) : (
          <>
            <Wand2 size={16} />
            Generate Homework
          </>
        )}
      </button>
    </form>
  );
}
