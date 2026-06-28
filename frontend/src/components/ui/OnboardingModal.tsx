import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'onboarding_seen';

// ─── Slide illustrations ───────────────────────────────────────────────────

const WelcomeIllustration = () => (
  <div className="flex items-center justify-center gap-3 flex-wrap">
    {['📝 Applied', '🎙️ Interview', '🧪 Test', '🎉 Offer'].map((s, i) => (
      <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
        {s}
      </span>
    ))}
  </div>
);

const ApplicationsIllustration = () => (
  <div className="w-full max-w-xs mx-auto space-y-2">
    {[
      { company: 'Google', role: 'Frontend Dev', status: 'bg-blue-400', label: 'Applied' },
      { company: 'Stripe', role: 'Full Stack', status: 'bg-amber-400', label: 'Interview' },
      { company: 'Vercel', role: 'Engineer', status: 'bg-green-400', label: 'Offer' },
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
        <span className={`h-2.5 w-2.5 rounded-full ${item.status} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{item.role}</p>
          <p className="text-xs text-white/70">{item.company}</p>
        </div>
        <span className="text-xs text-white/60">{item.label}</span>
      </div>
    ))}
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/30 px-3 py-2">
      <span className="text-white/50 text-lg">⚡</span>
      <p className="text-xs text-white/60">Auto-fill from URL</p>
    </div>
  </div>
);

const JobsIllustration = () => (
  <div className="w-full max-w-xs mx-auto space-y-3">
    <div className="flex gap-1 rounded-xl bg-white/10 p-1">
      <div className="flex-1 rounded-lg bg-white/20 py-1.5 text-center text-xs font-medium text-white">🌐 Remote</div>
      <div className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-white/50">📍 Near me</div>
    </div>
    <div className="flex flex-wrap gap-1.5 justify-center">
      {['1 km', '5 km', '25 km', '50 km'].map((r) => (
        <span key={r} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${r === '25 km' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'}`}>{r}</span>
      ))}
    </div>
    <div className="flex flex-wrap gap-1.5 justify-center">
      {['España', 'Europa', 'USA', 'Worldwide'].map((r) => (
        <span key={r} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70">{r}</span>
      ))}
    </div>
  </div>
);

const DashboardIllustration = () => (
  <div className="w-full max-w-xs mx-auto space-y-2">
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Total', value: '24', color: 'bg-indigo-400/30' },
        { label: 'Interviews', value: '6', color: 'bg-amber-400/30' },
        { label: 'Offers', value: '2', color: 'bg-green-400/30' },
      ].map((kpi) => (
        <div key={kpi.label} className={`${kpi.color} rounded-xl p-2 text-center backdrop-blur`}>
          <p className="text-lg font-bold text-white">{kpi.value}</p>
          <p className="text-xs text-white/70">{kpi.label}</p>
        </div>
      ))}
    </div>
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🔔</span>
        <p className="text-xs font-medium text-white">Email reminders</p>
        <div className="ml-auto h-4 w-8 rounded-full bg-indigo-400/60 flex items-center px-0.5">
          <div className="h-3 w-3 rounded-full bg-white translate-x-4" />
        </div>
      </div>
      <p className="text-xs text-white/60">Alerts after 7 days without reply</p>
    </div>
  </div>
);

// ─── Slide data ────────────────────────────────────────────────────────────

const SLIDES = [
  { key: 'welcome', Illustration: WelcomeIllustration, action: null },
  { key: 'applications', Illustration: ApplicationsIllustration, action: '/applications' },
  { key: 'jobs', Illustration: JobsIllustration, action: '/jobs' },
  { key: 'dashboard', Illustration: DashboardIllustration, action: '/profile' },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const isFirst = step === 0;

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
    if (slide.action) navigate(slide.action);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
        {/* Gradient background */}
        <div className="bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700 p-8 pb-6">
          {/* Skip button */}
          {!isLast && (
            <button
              onClick={handleSkip}
              className="absolute right-4 top-4 rounded-lg px-2.5 py-1 text-xs text-white/60 transition hover:text-white"
            >
              {t('onboarding.skip')}
            </button>
          )}

          {/* Step indicator */}
          <div className="mb-6 flex justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Illustration */}
          <div className="mb-6 min-h-[140px] flex items-center justify-center">
            <slide.Illustration />
          </div>

          {/* Text */}
          <h2 className="text-center text-xl font-bold text-white">
            {t(`onboarding.slides.${slide.key}.title`)}
          </h2>
          <p className="mt-2 text-center text-sm text-indigo-100 leading-relaxed">
            {t(`onboarding.slides.${slide.key}.description`)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between bg-white px-6 py-4 dark:bg-gray-800">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={isFirst}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 disabled:invisible dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← {t('onboarding.prev')}
          </button>

          {isLast ? (
            <button
              onClick={handleFinish}
              className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              {t('onboarding.finish')} →
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              {t('onboarding.next')} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const shouldShowOnboarding = () =>
  localStorage.getItem(STORAGE_KEY) !== 'true';
