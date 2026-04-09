import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Crown,
  GaugeCircle,
  ReceiptText,
  WalletCards,
  X,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { subscriptionService } from '../services/subscription.service';
import { subscriptionRequestsService } from '../services/subscription-requests.service';
import { plansService, type PublicPlan } from '../services/plans.service';
import {
  paymentMethodsService,
  type PaymentMethodItem,
} from '../services/payment-methods.service';
import type { SubscriptionInfo } from '../types/subscription';
import type { SubscriptionRequestItem } from '../types/premium-request';

const requestTypeLabels: Record<string, string> = {
  trial: 'Trial',
  premium: 'Premium mensual',
  extra_tokens: 'Extra capacidad',
  custom: 'Personalizado',
  subscription: 'Premium mensual',
  tokens: 'Extra capacidad',
};

const statusLabels: Record<string, string> = {
  new: 'Recibida',
  receipt_uploaded: 'Comprobante recibido',
  submitted: 'Enviada',
  under_review: 'En revision',
  contacted: 'Pendiente de contacto',
  pending_payment: 'Pendiente de pago',
  paid: 'Pago reportado',
  awaiting_validation: 'Validando pago',
  approved: 'Aprobada y activada',
  activated: 'Plan activo',
  rejected: 'Rechazada',
};

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const resolveAssetUrl = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${apiBaseUrl}${path}`;
};

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);

const usageCards = (subscription: SubscriptionInfo) => [
  {
    label: 'Mensajes',
    used: subscription.usageSnapshot.messages.used,
    limit: subscription.usageSnapshot.messages.limit,
    helper: 'Interacciones de este ciclo.',
  },
  {
    label: 'Chats',
    used: subscription.usageSnapshot.chats.used,
    limit: subscription.usageSnapshot.chats.limit,
    helper: 'Conversaciones activas o creadas.',
  },
  {
    label: 'Documentos',
    used: subscription.usageSnapshot.documents.used,
    limit: subscription.usageSnapshot.documents.limit,
    helper: 'Carga documental disponible.',
  },
  {
    label: 'Tokens',
    used: subscription.usageSnapshot.tokens.used,
    limit: subscription.usageSnapshot.tokens.limit,
    helper: 'Capacidad tecnica del plan.',
  },
];

const isPayablePlan = (plan: PublicPlan) =>
  ['premium', 'extra_tokens', 'custom', 'subscription', 'tokens'].includes(
    plan.category,
  ) ||
  ['premium', 'extra_tokens', 'custom'].includes(plan.code);

const resolveRequestType = (
  plan: PublicPlan,
): 'premium' | 'extra_tokens' | 'custom' => {
  if (plan.category === 'extra_tokens' || plan.category === 'tokens' || plan.code === 'extra_tokens') {
    return 'extra_tokens';
  }
  if (plan.category === 'custom') {
    return 'custom';
  }
  return 'premium';
};

type PanelView = 'request' | 'methods' | null;

export function SubscriptionScreen() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [requests, setRequests] = useState<SubscriptionRequestItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [reportedAmount, setReportedAmount] = useState('');
  const [paidAtReference, setPaidAtReference] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [activePanel, setActivePanel] = useState<PanelView>(null);
  const [showUsageDetail, setShowUsageDetail] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [sub, availablePlans, activePaymentMethods, myRequests] =
          await Promise.all([
            subscriptionService.getMySubscription(),
            plansService.getActive(),
            paymentMethodsService.getActive(),
            subscriptionRequestsService.getMine(),
          ]);

        const payablePlans = availablePlans.filter(isPayablePlan);

        setSubscription(sub);
        setPlans(payablePlans);
        setPaymentMethods(activePaymentMethods);
        setRequests(myRequests);
        setSelectedPlanId((current) => current || payablePlans[0]?._id || '');
        setSelectedPaymentMethodId(
          (current) => current || activePaymentMethods[0]?._id || '',
        );
      } catch {
        setError('No pudimos cargar tu informacion de suscripcion.');
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const refreshSubscriptionState = () => {
      if (document.visibilityState === 'visible') {
        void (async () => {
          try {
            const [sub, myRequests] = await Promise.all([
              subscriptionService.getMySubscription(),
              subscriptionRequestsService.getMine(),
            ]);
            setSubscription(sub);
            setRequests(myRequests);
          } catch {
            // keep current UI state if background refresh fails
          }
        })();
      }
    };

    window.addEventListener('focus', refreshSubscriptionState);
    document.addEventListener('visibilitychange', refreshSubscriptionState);

    return () => {
      window.removeEventListener('focus', refreshSubscriptionState);
      document.removeEventListener('visibilitychange', refreshSubscriptionState);
    };
  }, []);

  useEffect(() => {
    if (!activePanel) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activePanel]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan._id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const selectedPaymentMethod = useMemo(
    () =>
      paymentMethods.find((paymentMethod) => paymentMethod._id === selectedPaymentMethodId) ??
      null,
    [paymentMethods, selectedPaymentMethodId],
  );

  const hasPayablePlans = plans.length > 0;
  const hasActivePaymentMethods = paymentMethods.length > 0;
  const visibleRequests = showAllRequests ? requests : requests.slice(0, 2);

  const usageTone = useMemo(() => {
    if (!subscription) return '';
    if (subscription.planCategory === 'trial') {
      if ((subscription.trialDaysRemaining || 0) > 0) {
        return `Estas en Trial. Te quedan ${subscription.trialDaysRemaining} dia(s) antes de pasar a Free automaticamente.`;
      }
      return 'Tu trial ya finalizo y tu cuenta paso a Free automaticamente.';
    }
    if (subscription.status === 'expired') {
      return (
        subscription.notes ||
        'Tu plan anterior vencio y ahora estas en Free. Necesitas renovar para recuperar beneficios premium.'
      );
    }
    if (subscription.usageSnapshot.upgradeRecommended) {
      return 'Estas cerca de tu limite actual. Tiene sentido pedir un upgrade o un paquete extra.';
    }
    if (subscription.planCategory === 'free') {
      return 'Estas en el plan base. Puedes solicitar premium, mas capacidad o un plan a medida.';
    }
    return 'Tu cuenta tiene un plan activo. Si necesitas mas capacidad, puedes dejar una nueva solicitud.';
  }, [subscription]);

  const submitDisabledReason = useMemo(() => {
    if (submitting) {
      return 'Estamos enviando tu solicitud y el comprobante.';
    }
    if (!hasPayablePlans) {
      return 'No hay planes premium, extra capacidad o personalizados activos en este momento.';
    }
    if (!hasActivePaymentMethods) {
      return 'No hay medios de pago activos configurados por el super admin.';
    }
    if (!selectedPlanId) {
      return 'Selecciona un plan para continuar.';
    }
    if (!selectedPaymentMethodId) {
      return 'Selecciona un metodo de pago activo.';
    }
    if (!payerPhone.trim()) {
      return 'Escribe el telefono o contacto del pagador.';
    }
    if (!reportedAmount.trim() || Number(reportedAmount) <= 0) {
      return 'Indica el monto pagado o acordado.';
    }
    return '';
  }, [
    hasActivePaymentMethods,
    hasPayablePlans,
    payerPhone,
    reportedAmount,
    selectedPaymentMethodId,
    selectedPlanId,
    submitting,
  ]);

  const submitRequest = async () => {
    if (!selectedPlan || !selectedPaymentMethod) {
      setError('Selecciona un plan y un metodo de pago activo.');
      return;
    }

    try {
      setSubmitting(true);
      setFeedback('');
      setError('');
      const created = await subscriptionRequestsService.create({
        planId: selectedPlan._id,
        paymentMethodId: selectedPaymentMethod._id,
        requestType: resolveRequestType(selectedPlan),
        payerName,
        payerPhone,
        reportedAmount: Number(reportedAmount),
        paidAtReference,
        message: note,
        proof: proofFile,
      });

      setRequests((current) => [created, ...current]);
      setFeedback(
        proofFile
          ? 'Tu solicitud quedo registrada con comprobante. El super admin ya puede verla y activar tu plan.'
          : 'Tu solicitud quedo registrada con los datos del pago. El super admin ya puede verla aunque no hayas adjuntado imagen.',
      );
      setPayerName('');
      setPayerPhone('');
      setReportedAmount('');
      setPaidAtReference('');
      setNote('');
      setProofFile(null);
      setShowAllRequests(false);
      setActivePanel(null);
    } catch {
      setError('No pudimos enviar tu solicitud en este momento.');
    } finally {
      setSubmitting(false);
    }
  };

  const primaryMetrics = subscription
    ? [
        usageCards(subscription)[0],
        usageCards(subscription)[1],
        usageCards(subscription)[2],
      ]
    : [];

  return (
    <>
      <div className="space-y-3">
        <GlassCard className="aurora-panel premium-card rounded-[32px] border border-white/55 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Tu plan actual
              </p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.06em] text-[var(--text-main)]">
                {subscription?.planName || 'Free'}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Estado: {subscription?.status || 'sin datos'} x Vence:{' '}
                {subscription?.endDate
                  ? new Date(subscription.endDate).toLocaleDateString()
                  : 'sin fecha'}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                {usageTone}
              </p>
              {subscription?.notes ? (
                <p className="mt-2 text-sm font-medium text-[var(--brand-deep)]">
                  {subscription.notes}
                </p>
              ) : null}
            </div>
            <div className="rounded-[24px] bg-[var(--gradient-main)] p-3 text-white shadow-[0_20px_32px_rgba(126,84,198,0.22)]">
              <Crown size={20} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {subscription ? (
              primaryMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[20px] bg-white/74 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]"
                >
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
                    {metric.used}/{metric.limit}
                  </p>
                </div>
              ))
            ) : (
              [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-[18px] bg-white/60"
                />
              ))
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              fullWidth
              onClick={() => setActivePanel('request')}
              className="min-h-14 bg-[linear-gradient(135deg,#4c35ff,#ff7e5f)] text-[15px] font-bold tracking-[0.02em] text-white shadow-[0_24px_44px_rgba(96,66,214,0.34)]"
            >
              Solicitar plan
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                fullWidth
                variant="secondary"
                className="min-h-12 rounded-[22px]"
                onClick={() => setActivePanel('methods')}
              >
                Ver medios de pago
              </Button>
              <Button
                fullWidth
                variant="secondary"
                className="min-h-12 rounded-[22px]"
                onClick={() => setShowAllRequests((current) => !current)}
              >
                {showAllRequests ? 'Ocultar historial' : 'Ver historial'}
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="premium-card rounded-[28px] border border-white/55 px-4 py-4">
          <button
            type="button"
            onClick={() => setShowUsageDetail((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <GaugeCircle size={18} className="text-[var(--brand-deep)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Resumen de capacidad
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Mensajes, chats y documentos visibles. Tokens en detalle.
                </p>
              </div>
            </div>
            {showUsageDetail ? (
              <ChevronUp size={18} className="text-[var(--text-muted)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-muted)]" />
            )}
          </button>

          {subscription?.usageSnapshot.upgradeRecommended ? (
            <div className="mt-3 rounded-[18px] border border-[rgba(93,67,255,0.12)] bg-[linear-gradient(135deg,rgba(99,74,255,0.1),rgba(255,150,111,0.08))] px-4 py-3">
              <p className="text-sm font-medium text-[var(--text-main)]">
                Recomendacion
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                Tiene sentido pasar a{' '}
                {requestTypeLabels[subscription.usageSnapshot.recommendedPlanCategory]}.
              </p>
            </div>
          ) : null}

          {showUsageDetail && subscription ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {usageCards(subscription).map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[20px] bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]"
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-main)]">
                    {metric.used}/{metric.limit}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                    {metric.helper}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </GlassCard>

        {!hasPayablePlans ? (
          <GlassCard className="premium-card rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-900">
              No hay planes premium activos
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              El usuario no podra enviar una solicitud hasta que el super admin active
              al menos un plan Premium, Extra capacidad o Personalizado. Si en
              admin ya existe uno, revisa que el deployment actual este leyendo los
              planes activos correctos.
            </p>
          </GlassCard>
        ) : null}

        {!hasActivePaymentMethods ? (
          <GlassCard className="premium-card rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-900">
              No hay medios de pago activos
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              El super admin debe activar al menos un medio de pago para habilitar la
              solicitud real con comprobante.
            </p>
          </GlassCard>
        ) : null}

        <GlassCard className="premium-card rounded-[28px] border border-white/55 px-4 py-4">
          <button
            type="button"
            onClick={() => setShowAllRequests((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <ReceiptText size={18} className="text-[var(--brand-deep)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Historial de solicitudes
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {requests.length > 0
                    ? `${requests.length} solicitud(es) registradas`
                    : 'Todavia no has enviado solicitudes'}
                </p>
              </div>
            </div>
            {showAllRequests ? (
              <ChevronUp size={18} className="text-[var(--text-muted)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-muted)]" />
            )}
          </button>

          {showAllRequests ? (
            <div className="mt-3 space-y-2">
              {visibleRequests.length > 0 ? (
                visibleRequests.map((request) => (
                  <div
                    key={request._id}
                    className="rounded-[20px] bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-main)]">
                          {request.planName}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {statusLabels[request.status] || request.status} x{' '}
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-[rgba(109,80,255,0.1)] px-2 py-1 text-[11px] font-medium text-[var(--brand-deep)]">
                        {request.paymentMethodSnapshot.name}
                      </span>
                    </div>
                    {request.message ? (
                      <p className="mt-2 text-sm text-[var(--text-soft)]">
                        {request.message}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                      <span>
                        {formatMoney(
                          request.planSnapshot.price,
                          request.planSnapshot.currency,
                        )}
                      </span>
                      <span>{request.planSnapshot.durationDays} dias</span>
                      <span>{requestTypeLabels[request.requestType]}</span>
                      {request.proofOriginalName ? (
                        <span>{request.proofOriginalName}</span>
                      ) : null}
                      {request.proofUrl ? (
                        <a
                          href={resolveAssetUrl(request.proofUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--brand-deep)] underline"
                        >
                          Ver comprobante
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {request.payerName || 'Sin nombre'} ·{' '}
                      {request.payerPhone || 'Sin telefono'} ·{' '}
                      {request.reportedAmount
                        ? formatMoney(request.reportedAmount, request.planSnapshot.currency)
                        : 'Monto no reportado'}
                      {request.paidAtReference ? ` · ${request.paidAtReference}` : ''}
                    </p>
                    {request.adminNotes ? (
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Nota admin: {request.adminNotes}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  Todavia no has enviado solicitudes.
                </p>
              )}
            </div>
          ) : null}
        </GlassCard>

        {feedback ? (
          <p className="text-sm text-[var(--text-muted)]">{feedback}</p>
        ) : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </div>

      {activePanel ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-[rgba(25,16,44,0.42)] backdrop-blur-[3px]"
            onClick={() => setActivePanel(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,251,255,0.98),rgba(246,235,255,0.95))] shadow-[0_-24px_60px_rgba(69,48,120,0.2)]">
            <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-[rgba(109,80,255,0.2)]" />
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {activePanel === 'request' ? 'Solicitar plan' : 'Medios de pago'}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--text-main)]">
                  {activePanel === 'request'
                    ? 'Solicitud de plan'
                    : 'Datos para pagar'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="rounded-full bg-white/80 p-2 text-[var(--text-soft)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(86vh-5rem)] space-y-3 overflow-y-auto px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
              {activePanel === 'methods' ? (
                <GlassCard className="premium-card rounded-[26px] border border-white/55 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <WalletCards size={18} className="mt-1 text-[var(--brand-deep)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Medios activos
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                        El super admin define aqui los datos visibles para pagar antes de
                        enviar el comprobante.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {paymentMethods.map((paymentMethod) => (
                      <div
                        key={paymentMethod._id}
                        className="rounded-[22px] border border-white/60 bg-white/74 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--text-main)]">
                            {paymentMethod.name}
                          </p>
                          <span className="text-xs text-[var(--text-muted)]">
                            {paymentMethod.provider || paymentMethod.code}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-soft)]">
                          {(paymentMethod.accountLabel || 'Dato de pago')}:{' '}
                          {paymentMethod.accountValue ||
                            paymentMethod.accountNumber ||
                            'sin dato visible'}
                        </p>
                        {(paymentMethod.holderName || paymentMethod.accountHolder) ? (
                          <p className="mt-1 text-sm text-[var(--text-soft)]">
                            Titular:{' '}
                            {paymentMethod.holderName || paymentMethod.accountHolder}
                          </p>
                        ) : null}
                        <p className="mt-2 whitespace-pre-line text-sm text-[var(--text-soft)]">
                          {paymentMethod.instructions || 'Sin instrucciones adicionales.'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {!hasActivePaymentMethods ? (
                    <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                      No hay medios de pago activos configurados por el super admin.
                    </div>
                  ) : null}
                </GlassCard>
              ) : null}

              {activePanel === 'request' ? (
                <>
                  <GlassCard className="premium-card rounded-[26px] border border-white/55 px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Paso 1. Selecciona el plan deseado
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Premium mensual, mas capacidad o plan personalizado.
                    </p>
                    <div className="mt-3 grid gap-2">
                      {plans.map((plan) => {
                        const isSelected = plan._id === selectedPlanId;
                        return (
                          <button
                            key={plan._id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan._id)}
                            className={`rounded-[24px] border px-4 py-4 text-left transition ${
                              isSelected
                                ? 'border-[var(--brand-deep)] bg-[linear-gradient(135deg,#efe8ff,#ffffff)]'
                                : 'border-white/55 bg-white/70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-main)]">
                                  {plan.name}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                                  {plan.description ||
                                    'Plan configurable desde administracion.'}
                                </p>
                              </div>
                              <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-[var(--text-soft)]">
                                {requestTypeLabels[plan.category]}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                              <span>{formatMoney(plan.price, plan.currency)}</span>
                              <span>{plan.durationDays} dias</span>
                              <span>{plan.limits.maxMessagesPerMonth || 0} mensajes</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </GlassCard>

                  <GlassCard className="premium-card rounded-[26px] border border-white/55 px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Paso 2. Datos del pago
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Metodo usado y datos minimos para validar tu solicitud.
                    </p>
                    <div className="mt-3 grid gap-2">
                      {paymentMethods.map((paymentMethod) => {
                        const isSelected =
                          paymentMethod._id === selectedPaymentMethodId;
                        return (
                          <button
                            key={paymentMethod._id}
                            type="button"
                            onClick={() => setSelectedPaymentMethodId(paymentMethod._id)}
                            className={`rounded-[22px] border px-4 py-3 text-left ${
                              isSelected
                                ? 'border-[var(--brand-deep)] bg-white'
                                : 'border-white/60 bg-white/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[var(--text-main)]">
                                {paymentMethod.name}
                              </p>
                              <span className="text-xs text-[var(--text-muted)]">
                                {paymentMethod.provider || paymentMethod.code}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[var(--text-soft)]">
                              {(paymentMethod.accountLabel || 'Dato de pago')}:{' '}
                              {paymentMethod.accountValue ||
                                paymentMethod.accountNumber ||
                                'sin dato visible'}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {selectedPaymentMethod ? (
                      <div className="mt-4 rounded-[22px] bg-white/74 px-4 py-4 text-sm text-[var(--text-soft)]">
                        <p className="font-medium text-[var(--text-main)]">
                          Detalle para pagar
                        </p>
                        <p className="mt-2">
                          <span className="font-medium text-[var(--text-main)]">
                            {selectedPaymentMethod.accountLabel || 'Dato de pago'}:
                          </span>{' '}
                          {selectedPaymentMethod.accountValue ||
                            selectedPaymentMethod.accountNumber ||
                            'Sin dato visible'}
                        </p>
                        {(selectedPaymentMethod.holderName ||
                          selectedPaymentMethod.accountHolder) ? (
                          <p className="mt-1">
                            <span className="font-medium text-[var(--text-main)]">
                              Titular:
                            </span>{' '}
                            {selectedPaymentMethod.holderName ||
                              selectedPaymentMethod.accountHolder}
                          </p>
                        ) : null}
                        <p className="mt-2 whitespace-pre-line">
                          {selectedPaymentMethod.instructions ||
                            'Sin instrucciones adicionales.'}
                        </p>
                      </div>
                    ) : null}
                  </GlassCard>

                  <GlassCard className="premium-card rounded-[26px] border border-white/55 px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Paso 3. Informacion del pago
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Obligatorio: telefono, monto y metodo. Nombre y fecha son recomendados.
                    </p>
                    <div className="mt-3 grid gap-3">
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          Nombre del pagador
                        </span>
                        <input
                          value={payerName}
                          onChange={(event) => setPayerName(event.target.value)}
                          placeholder="Nombre de quien pago"
                          className="mt-2 h-12 w-full rounded-[22px] border border-white/70 bg-white/78 px-4 text-sm text-[var(--text-main)] outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          Telefono o contacto
                        </span>
                        <input
                          value={payerPhone}
                          onChange={(event) => setPayerPhone(event.target.value)}
                          placeholder="Ejemplo: 3001234567"
                          className="mt-2 h-12 w-full rounded-[22px] border border-white/70 bg-white/78 px-4 text-sm text-[var(--text-main)] outline-none"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                            Monto pagado
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={reportedAmount}
                            onChange={(event) => setReportedAmount(event.target.value)}
                            placeholder="0"
                            className="mt-2 h-12 w-full rounded-[22px] border border-white/70 bg-white/78 px-4 text-sm text-[var(--text-main)] outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                            Cuando pagaste
                          </span>
                          <input
                            value={paidAtReference}
                            onChange={(event) => setPaidAtReference(event.target.value)}
                            placeholder="Opcional: hoy 3pm / 8 abril"
                            className="mt-2 h-12 w-full rounded-[22px] border border-white/70 bg-white/78 px-4 text-sm text-[var(--text-main)] outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/50 pt-4">
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Paso 4. Mensaje adicional
                      </p>
                    </div>

                    <label className="mt-3 block">
                      <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Mensaje adicional
                      </span>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Ejemplo: quiero premium mensual, necesito mas tokens este mes, o un plan a medida."
                        className="mt-2 min-h-24 w-full rounded-[22px] border border-white/70 bg-white/78 px-4 py-3 text-sm text-[var(--text-main)] outline-none"
                      />
                    </label>

                    <div className="mt-4 border-t border-white/50 pt-4">
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Paso 5. Comprobante opcional y envio
                      </p>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Comprobante opcional
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.webp,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) =>
                          setProofFile(event.target.files?.[0] || null)
                        }
                        className="mt-2 block w-full text-sm text-[var(--text-soft)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--brand-deep)] file:px-4 file:py-2 file:text-white"
                      />
                      {proofFile ? (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          {proofFile.name}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Recomendado si ya hiciste el pago. Si no lo tienes, puedes enviar
                          solo los datos manuales.
                        </p>
                      )}
                    </label>

                    <div className="mt-4 space-y-3">
                      <Button
                        fullWidth
                        onClick={() => void submitRequest()}
                        className="min-h-14 bg-[linear-gradient(135deg,#4c35ff,#ff7e5f)] text-[15px] font-bold tracking-[0.02em] text-white shadow-[0_24px_44px_rgba(96,66,214,0.34)] disabled:bg-[linear-gradient(135deg,rgba(94,76,180,0.46),rgba(183,132,120,0.36))] disabled:text-white/88 disabled:shadow-none"
                        disabled={
                          submitting ||
                          !selectedPlanId ||
                          !selectedPaymentMethodId ||
                          !payerPhone.trim() ||
                          !reportedAmount.trim() ||
                          Number(reportedAmount) <= 0
                        }
                      >
                        {submitting
                          ? 'Enviando solicitud...'
                          : 'Enviar solicitud de pago'}
                      </Button>

                      {submitDisabledReason ? (
                        <p className="rounded-[18px] border border-white/55 bg-white/72 px-4 py-3 text-sm font-medium text-[var(--text-soft)]">
                          {submitDisabledReason}
                        </p>
                      ) : (
                        <p className="rounded-[18px] border border-[rgba(93,67,255,0.18)] bg-[linear-gradient(135deg,rgba(99,74,255,0.12),rgba(255,150,111,0.12))] px-4 py-3 text-sm font-medium text-[var(--text-main)]">
                          Todo listo: envia tu solicitud con datos manuales y, si lo
                          tienes, adjunta tambien el comprobante.
                        </p>
                      )}

                      {proofFile ? (
                        <div className="rounded-[18px] border border-white/55 bg-white/78 px-4 py-3 text-sm text-[var(--text-soft)]">
                          <p className="font-medium text-[var(--text-main)]">
                            Comprobante listo para enviar
                          </p>
                          <p className="mt-1 break-all">{proofFile.name}</p>
                        </div>
                      ) : (
                        <div className="rounded-[18px] border border-dashed border-white/60 bg-white/72 px-4 py-3 text-sm text-[var(--text-soft)]">
                          Puedes continuar sin imagen. La solicitud llegara al super admin
                          con nombre, telefono, monto y referencia temporal.
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
