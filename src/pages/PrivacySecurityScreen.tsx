import { useState } from 'react';
import { Info, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { apiConfig } from '../config/api';
import { useI18n } from '../i18n/I18nProvider';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

export function PrivacySecurityScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const sessionStartedAt = localStorage.getItem(apiConfig.storage.sessionStartedAtKey);

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      setDeleteError('');
      await authService.deleteAccount();
      logout();
      navigate('/', { replace: true });
    } catch {
      setDeleteError(t.privacy.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader title={t.privacy.title} subtitle={t.privacy.subtitle} backTo="/profile" />

      <GlassCard className="aurora-panel premium-card rounded-[36px]">
        <div className="flex items-center gap-3">
          <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(156,112,255,0.16),rgba(255,173,128,0.18))] p-3 text-[var(--brand-deep)]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">{t.privacy.currentSession}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              {sessionStartedAt
                ? `${new Date(sessionStartedAt).toLocaleString()}`
                : t.privacy.localSession}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[32px] space-y-3">
        <p className="text-sm font-semibold text-[var(--text-main)]">{t.privacy.accountStatus}</p>
        <div className="grid gap-2">
          <div className="rounded-[20px] bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {user?.email}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-main)]">
              {user?.isEmailVerified ? t.privacy.emailVerified : t.privacy.emailPending}
            </p>
          </div>
          <div className="rounded-[20px] bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t.privacy.twoFactor}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-main)]">
              {user?.twoFactorEnabled ? t.privacy.twoFactorOn : t.privacy.twoFactorOff}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[32px] space-y-3">
        <p className="text-sm font-semibold text-[var(--text-main)]">{t.privacy.goodPractices}</p>
        <ul className="space-y-2 text-sm leading-7 text-[var(--text-soft)]">
          {t.privacy.practices.map((practice) => (
            <li key={practice}>{practice}</li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="premium-card rounded-[32px] space-y-3">
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-1 text-[var(--brand-deep)]" />
          <p className="text-sm leading-7 text-[var(--text-soft)]">{t.privacy.localSession}</p>
        </div>
        <Button
          fullWidth
          variant="secondary"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          {t.privacy.logoutHere}
        </Button>
      </GlassCard>

      <GlassCard className="premium-card rounded-[32px] space-y-3 border border-rose-100/80">
        <p className="text-sm font-semibold text-[var(--text-main)]">{t.privacy.sensitiveActions}</p>
        <div className="flex items-start gap-3">
          <Trash2 size={18} className="mt-1 text-rose-500" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">{t.privacy.deleteTitle}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{t.privacy.deleteText}</p>
          </div>
        </div>
        <Button fullWidth variant="secondary" onClick={() => setShowDeleteModal(true)}>
          {t.privacy.deleteButton}
        </Button>
        {deleteError ? <p className="text-sm text-rose-500">{deleteError}</p> : null}
      </GlassCard>

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/42 px-4 py-5 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-[30px] bg-white px-5 py-5 shadow-[0_30px_80px_rgba(60,35,100,0.26)]">
            <p className="text-lg font-semibold text-[var(--text-main)]">{t.privacy.confirmTitle}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{t.privacy.confirmText}</p>
            <p className="mt-3 rounded-[20px] bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {t.privacy.deleteText}
            </p>
            <div className="mt-5 grid gap-2">
              <Button
                fullWidth
                disabled={deleting}
                onClick={() => void deleteAccount()}
                className="min-h-12 bg-rose-500 text-white shadow-[0_18px_32px_rgba(225,29,72,0.24)]"
              >
                {deleting ? t.privacy.deleting : t.privacy.finalConfirm}
              </Button>
              <Button
                fullWidth
                variant="secondary"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                {t.common.cancel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
