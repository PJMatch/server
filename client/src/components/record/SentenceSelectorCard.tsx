import { Card, Select } from "../ui";
import { SENTENCE_OPTIONS } from "../../constants/sentences";

interface SentenceSelectorCardProps {
  selectedSentence: string;
  onSentenceChange: (sentence: string) => void;
  isExpanded: boolean;
}

export function SentenceSelectorCard({
  selectedSentence,
  onSentenceChange,
  isExpanded
}: SentenceSelectorCardProps) {
  return (
    <div
      className={`transition-all duration-500 ease-in-out flex-shrink-0 ${
        isExpanded
          ? 'w-0 max-w-0 opacity-0 -translate-x-16 pointer-events-none m-0 overflow-hidden p-0'
          : 'w-full max-w-xs sm:max-w-sm opacity-100 translate-x-0 pb-2 pr-2 overflow-visible'
      }`}
    >
      <Card variant="flat" noPadding className="p-4 sm:p-5">
        <div className="w-[260px] sm:w-[300px] flex flex-col gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-center tracking-tight text-blue-900">
            Wybierz zdanie
          </h2>

          <Select
            label="Zdanie do zamigania"
            value={selectedSentence}
            onChange={(e) => {
              onSentenceChange(e.target.value);
            }}
            disabled={isExpanded}
            options={SENTENCE_OPTIONS}
          />
        </div>
      </Card>
    </div>
  );
}

interface SentenceBannerProps {
  selectedSentence: string;
  glossesText: string;
  isExpanded: boolean;
}

export function SentenceBanner({
  selectedSentence,
  glossesText,
  isExpanded
}: SentenceBannerProps) {
  return (
    <Card
      variant="flat"
      noPadding
      className={`w-full transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${
      isExpanded
        ? 'max-h-28 opacity-100 mb-2 py-2 px-4 max-w-3xl'
        : 'max-h-0 opacity-0 mb-0 py-0 px-0 pointer-events-none'
      }`}
    >
      <p className="text-lg sm:text-xl text-center font-black tracking-tight leading-tight">
        „{selectedSentence}”
      </p>
      <p className="text-base sm:text-lg text-center font-black tracking-tight text-blue-900/70 mt-1">
        „{glossesText}”
      </p>
    </Card>
  );
}
