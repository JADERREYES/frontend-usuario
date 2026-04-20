import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CreditCard,
  LogOut,
  Palette,
  Repeat,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { resolveApiAssetUrl } from '../config/api';
import { useI18n } from '../i18n/I18nProvider';
import type { LanguageCode } from '../i18n/translations';
import { profileService } from '../services/profile.service';
import { subscriptionService } from '../services/subscription.service';
import { useAuthStore } from '../store/auth.store';
import type { UserProfile } from '../types/profile';
import type { SubscriptionInfo } from '../types/subscription';

const isLanguageCode = (value: string | undefined): value is LanguageCode =>
  value === 'es' || value === 'en' || value === 'pt' || value === 'fr';

const getCommercialPlanName = (planName?: string, planCode?: string) => {
  const value = `${planName || ''} ${planCode || ''}`.toLowerCase();

  if (value.includes('free') || value.includes('gratis')) return 'Free';
  if (value.includes('medio') || value.includes('medium') || value.includes('standard')) return 'Medio';
  if (value.includes('premium')) return 'Premium';

  return planName || 'Free';
};

export function ProfileScreen() {
  const navigate = useNavigate();
  const { language, languageOptions, setLanguage, t } = useI18n();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    pronouns: '',
    bio: '',
  });
  const [message, setMessage] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, subscriptionData] = await Promise.allSettled([
          profileService.getMe(),
          subscriptionService.getMySubscription(),
        ]);

        if (profileData.status === 'fulfilled') {
          const data = profileData.value;
          setProfile(data);
          setForm({
            displayName: data?.displayName ?? user?.name ?? '',
            pronouns: data?.pronouns ?? '',
            bio: data?.bio ?? '',
          });

          if (isLanguageCode(data?.preferences?.language)) {
            setLanguage(data.preferences.language);
          }
        } else {
          setProfile(null);
          setForm({
            displayName: user?.name ?? '',
            pronouns: '',
            bio: '',
          });
        }

        if (subscriptionData.status === 'fulfilled') {
          setSubscription(subscriptionData.value);
        }
      } catch {
        setProfile(null);
      }
    };

    void load();
  }, [setLanguage, user?.name]);

  const avatarLabel = useMemo(
    () =>
      (profile?.displayName ?? user?.name ?? user?.email ?? 'M')
        .slice(0, 1)
        .toUpperCase(),
    [profile?.displayName, user?.email, user?.name],
  );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const updated = await profileService.upsertMe(form);
      setProfile(updated);
      setMessage(t.profile.saved);
      setShowEditor(false);
    } catch {
      setMessage(t.profile.saveError);
    }
  };

  const updateLanguage = async (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage);
    try {
      const updated = await profileService.upsertMe({
        preferences: {
          ...(profile?.preferences ?? {}),
          language: nextLanguage,
        },
      });
      setProfile(updated);
    } catch {
      setMessage(t.profile.saveError);
    }
  };

  const logoutWithConfirmation = () => {
    if (!window.confirm(t.profile.logoutConfirm)) {
      return;
    }

    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
          {t.profile.title}
        </p>
        <h1 className="mt-2 text-[30px] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--text-main)]">
          {profile?.displayName ?? user?.name ?? t.profile.title}
        </h1>
        <p className="mt-2 max-w-md text-sm font-medium leading-6 text-[var(--text-soft)]">{t.profile.subtitle}</p>
      </div>

      <GlassCard className="aurora-panel premium-card rounded-[32px] border border-white/55 px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,240,247,0.78))] text-xl font-semibold text-[var(--brand-deep)] shadow-[0_18px_30px_rgba(126,84,198,0.14)]">
            {profile?.avatarUrl ? (
              <img
                src={resolveApiAssetUrl(profile.avatarUrl)}
                alt="Avatar"
                className="h-20 w-20 rounded-[26px] object-cover"
              />
            ) : (
              avatarLabel
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[22px] font-semibold tracking-[-0.05em] text-[var(--text-main)]">
                  {profile?.displayName ?? user?.name ?? t.profile.noDisplayName}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-[var(--text-soft)]">{user?.email}</p>
              </div>
              <UserRound size={18} className="shrink-0 text-[var(--brand-deep)]" />
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-[var(--text-soft)]">
              {profile?.bio || t.profile.noBio}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgba(118,93,181,0.14)] bg-white px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
                {profile?.pronouns || t.profile.pronouns}
              </span>
              <span className="rounded-full border border-[rgba(118,93,181,0.14)] bg-white px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
                {getCommercialPlanName(subscription?.planName, subscription?.planCode)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-12 rounded-[22px] px-4"
            onClick={() => setShowEditor((current) => !current)}
          >
            {showEditor ? t.profile.hideEdit : t.profile.edit}
          </Button>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-[22px] border border-white/70 bg-white/70 px-4 text-sm font-semibold text-[var(--text-main)] shadow-[0_18px_28px_rgba(134,101,190,0.12)] backdrop-blur-xl">
            {t.profile.avatar}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const updated = await profileService.uploadAvatar(file);
                  setProfile(updated);
                  setAvatarMessage(t.profile.avatarSaved);
                } catch {
                  setAvatarMessage(t.profile.avatarError);
                }
              }}
            />
          </label>
        </div>

        {avatarMessage ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-[var(--text-muted)]">{avatarMessage}</p>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="premium-card rounded-[28px] border border-white/55 px-4 py-4">
        <button
          type="button"
          onClick={() => setShowEditor((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">
              {t.profile.pronouns} / {t.profile.bio}
            </p>
            <p className="text-xs font-medium text-[var(--text-soft)]">{t.profile.bioPlaceholder}</p>
          </div>
          {showEditor ? (
            <ChevronUp size={18} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={18} className="text-[var(--text-muted)]" />
          )}
        </button>

        {!showEditor ? (
          <div className="mt-3 grid gap-2">
            <div className="rounded-[16px] border border-[rgba(118,93,181,0.14)] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(124,91,183,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {t.profile.displayName}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-main)]">
                {(profile?.displayName ?? form.displayName) || t.profile.noDisplayName}
              </p>
            </div>
            <div className="rounded-[16px] border border-[rgba(118,93,181,0.14)] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(124,91,183,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {t.profile.pronouns}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-soft)]">
                {profile?.pronouns || form.pronouns || t.common.noData}
              </p>
            </div>
            <div className="rounded-[16px] border border-[rgba(118,93,181,0.14)] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(124,91,183,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {t.profile.bio}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-soft)]">
                {profile?.bio || form.bio || t.profile.noBio}
              </p>
            </div>
          </div>
        ) : null}

        {showEditor ? (
          <form className="mt-3 space-y-3" onSubmit={save}>
            <Input
              label={t.profile.displayName}
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
            />
            <Input
              label={t.profile.pronouns}
              value={form.pronouns}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  pronouns: event.target.value,
                }))
              }
            />
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[var(--text-soft)]">{t.profile.bio}</span>
              <textarea
                value={form.bio}
                placeholder={t.profile.bioPlaceholder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bio: event.target.value }))
                }
                className="min-h-24 rounded-[16px] border border-[rgba(118,93,181,0.18)] bg-white px-4 py-3 text-[15px] font-medium text-[var(--text-main)] outline-none"
              />
            </label>
            <Button
              type="submit"
              fullWidth
              className="min-h-14 bg-[linear-gradient(135deg,#4f36ff,#ff8a61)] text-[15px] font-bold text-white shadow-[0_24px_44px_rgba(101,70,214,0.34)]"
            >
              {t.common.save}
            </Button>
          </form>
        ) : null}

        {message ? <p className="mt-3 text-sm text-[var(--text-muted)]">{message}</p> : null}
      </GlassCard>

      <GlassCard className="premium-card rounded-[30px] border border-white/55 px-4 py-4">
        <p className="text-sm font-semibold text-[var(--text-main)]">{t.profile.emotionalSpace}</p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {[
            { to: '/personalization', label: t.profile.personalization, icon: Palette },
            { to: '/reminders', label: t.profile.reminders, icon: Bell },
            { to: '/weekly-summary', label: t.profile.weeklySummary, icon: Repeat },
          ].map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <div className="flex min-h-14 items-center gap-3 rounded-[16px] border border-[rgba(118,93,181,0.14)] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(124,91,183,0.08)]">
                <Icon size={17} className="text-[var(--brand-deep)]" />
                <span className="text-sm font-medium text-[var(--text-main)]">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[30px] border border-white/55 px-4 py-4">
        <div className="flex items-start gap-3">
          <CreditCard size={18} className="mt-1 text-[var(--brand-deep)]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-main)]">{t.profile.plan}</p>
            <div className="mt-3 grid gap-2 text-sm font-medium text-[var(--text-soft)]">
              <p>
                <span className="font-medium text-[var(--text-main)]">{t.profile.currentPlan}:</span>{' '}
                {subscription ? getCommercialPlanName(subscription.planName, subscription.planCode) : t.profile.noPlan}
              </p>
              <p>
                <span className="font-medium text-[var(--text-main)]">{t.profile.planStatus}:</span>{' '}
                {subscription?.status ?? t.profile.noPlan}
              </p>
              {subscription?.endDate ? (
                <p>
                  <span className="font-medium text-[var(--text-main)]">{t.profile.planEnds}:</span>{' '}
                  {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              ) : null}
            </div>
            <Link
              to="/subscription"
              className="mt-4 inline-flex min-h-11 items-center rounded-[16px] border border-[rgba(118,93,181,0.14)] bg-white px-4 text-sm font-semibold text-[var(--text-main)] shadow-[0_14px_24px_rgba(110,77,175,0.1)]"
            >
              {t.profile.viewPlans}
            </Link>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[30px] border border-white/55 px-4 py-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-1 text-[var(--brand-deep)]" />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-main)]">{t.profile.privacy}</p>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {t.profile.language}
              </span>
              <select
                value={language}
                onChange={(event) => void updateLanguage(event.target.value as LanguageCode)}
                className="mt-2 min-h-12 w-full rounded-[16px] border border-[rgba(118,93,181,0.18)] bg-white px-4 text-sm font-semibold text-[var(--text-main)] outline-none"
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Link
              to="/privacy-security"
              className="block rounded-[16px] border border-[rgba(118,93,181,0.14)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text-main)] shadow-[0_10px_22px_rgba(124,91,183,0.08)]"
            >
              {t.profile.privacy}
            </Link>
            <p className="text-xs leading-5 text-[var(--text-muted)]">
              {t.profile.deleteAccount}
            </p>
          </div>
        </div>
      </GlassCard>

      <button
        type="button"
        onClick={logoutWithConfirmation}
        className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[rgba(118,93,181,0.14)] bg-white px-5 py-3 text-sm font-semibold text-[var(--text-main)] shadow-[0_16px_28px_rgba(110,77,175,0.1)]"
      >
        <LogOut size={16} />
        {t.profile.logout}
      </button>
    </div>
  );
}
