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
  pending: 'Pendiente',
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

const subscriptionStatusLabels: Record<string, string> = {
  active: 'Activo',
  expired: 'Vencido',
  canceled: 'Cancelado',
  pending_activation: 'Pendiente de activacion',
};

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const hasInternalLabel = (...values: Array<string | undefined>) =>
  values.some((value) => /\b(e2e|test|dev|debug|demo|mock|seed)\b/i.test(value || ''));

const getCommercialPlanTier = (plan: Pick<PublicPlan, 'name' | 'code' | 'category'>) => {
  const value = `${plan.name} ${plan.code} ${plan.category}`.toLowerCase();

  if (value.includes('free') || value.includes('gratis') || plan.category === 'free') {
    return 'free';
  }
  if (value.includes('medio') || value.includes('medium') || value.includes('standard')) {
    return 'medio';
  }
  if (plan.category === 'extra_tokens' || plan.category === 'tokens') {
    return 'medio';
  }
  if (value.includes('premium') || plan.category === 'premium' || plan.category === 'subscription') {
    return 'premium';
  }
  return '';
};

const commercialPlanNames: Record<string, string> = {
  free: 'Free',
  medio: 'Medio',
  premium: 'Premium',
};

const getCommercialPlanName = (planName?: string, fallbackCode?: string, fallbackCategory?: string) => {
  const tier = getCommercialPlanTier({
    name: planName || '',
    code: fallbackCode || '',
    category: (fallbackCategory || '') as PublicPlan['category'],
  });

  if (tier) {
    return commercialPlanNames[tier];
  }

  if (hasInternalLabel(planName, fallbackCode)) {
    return 'Plan';
  }

  return formatPlanLabel(planName, fallbackCode);
};

const formatPlanLabel = (planName?: string, fallbackCode?: string) => {
  if (planName?.trim()) {
    return planName;
  }

  const normalizedCode = (fallbackCode || '').trim().toLowerCase();
  if (!normalizedCode) {
    return 'Sin dato';
  }

  return requestTypeLabels[normalizedCode] || normalizedCode;
};

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
];

const isRequestablePlan = (plan: PublicPlan | null) =>
  Boolean(plan) && plan?.category !== 'free' && plan?.category !== 'trial';

const isPublicCommercialPlan = (plan: PublicPlan) =>
  Boolean(getCommercialPlanTier(plan)) && !hasInternalLabel(plan.name, plan.code);

const selectCommercialPlans = (availablePlans: PublicPlan[]) => {
  const byTier = new Map<string, PublicPlan>();

  availablePlans
    .filter((plan) => plan.isActive)
    .filter(isPublicCommercialPlan)
    .sort((a, b) => a.price - b.price)
    .forEach((plan) => {
      const tier = getCommercialPlanTier(plan);
      if (!byTier.has(tier)) {
        byTier.set(tier, plan);
      }
    });

  return ['free', 'medio', 'premium']
    .map((tier) => byTier.get(tier))
    .filter(Boolean) as PublicPlan[];
};

const isVisiblePaymentMethod = (paymentMethod: PaymentMethodItem) =>
  paymentMethod.isActive &&
  !hasInternalLabel(paymentMethod.name, paymentMethod.code, paymentMethod.provider);

const selectPrimaryPaymentMethod = (paymentMethods: PaymentMethodItem[]) => {
  const visible = paymentMethods
    .filter(isVisiblePaymentMethod)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    visible.find((method) =>
      `${method.name} ${method.code} ${method.provider || ''}`.toLowerCase().includes('nequi'),
    ) ??
    visible[0] ??
    null
  );
};

const getPaymentMethodLabel = (paymentMethod?: Pick<PaymentMethodItem, 'name' | 'code' | 'provider'> | null) => {
  if (!paymentMethod) {
    return 'Metodo de pago';
  }
  const value = `${paymentMethod.name} ${paymentMethod.code} ${paymentMethod.provider || ''}`.toLowerCase();
  if (value.includes('nequi')) {
    return 'Nequi';
  }
  if (value.includes('bancolombia')) {
    return 'Bancolombia';
  }
  if (value.includes('daviplata')) {
    return 'Daviplata';
  }
  if (hasInternalLabel(paymentMethod.name, paymentMethod.code, paymentMethod.provider)) {
    return 'Metodo de pago';
  }
  return paymentMethod.provider || paymentMethod.name || 'Metodo de pago';
};

const getPaymentAccountLabel = (paymentMethod: PaymentMethodItem) =>
  getPaymentMethodLabel(paymentMethod) === 'Nequi'
    ? 'Numero Nequi'
    : paymentMethod.accountLabel || 'Dato de pago';

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

const getPlanBenefit = (plan: PublicPlan) => {
  if (resolveRequestType(plan) === 'extra_tokens') {
    return 'Mas capacidad para responder y procesar.';
  }
  if (resolveRequestType(plan) === 'custom') {
    return 'Ajustado a tu volumen o necesidad puntual.';
  }
  return 'Acceso premium con mejores limites y acompanamiento.';
};

type PanelView = 'request' | 'methods' | null;

const pendingRequestStatuses = new Set([
  'pending',
  'new',
  'receipt_uploaded',
  'submitted',
  'under_review',
  'contacted',
  'pending_payment',
  'paid',
  'awaiting_validation',
  'approved',
]);

const getCurrentPlanDetail = (subscription: SubscriptionInfo | null) => {
  if (!subscription) {
    return 'Sin informacion disponible.';
  }

  if (subscription.planCategory === 'trial') {
    const days = subscription.trialDaysRemaining ?? 0;
    return days > 0
      ? `Prueba gratuita de ${days} dia(s). Despues pasas a Free y necesitas pagar para activar Premium.`
      : 'Tu prueba gratuita termino. Ahora necesitas pagar para activar Premium.';
  }

  if (subscription.planCategory === 'free') {
    return 'Plan base sin pago. Para desbloquear Premium necesitas realizar el pago manual.';
  }

  return subscription.endDate
    ? `Plan activo hasta ${new Date(subscription.endDate).toLocaleDateString()}.`
    : 'Plan activo.';
};

export function SubscriptionScreen() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [requests, setRequests] = useState<SubscriptionRequestItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [activePanel, setActivePanel] = useState<PanelView>(null);
  const [showUsageDetail, setShowUsageDetail] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showReceiptStep, setShowReceiptStep] = useState(false);

  const refreshSubscriptionData = async () => {
    const [sub, availablePlans, activePaymentMethods, myRequests] =
      await Promise.all([
        subscriptionService.getMySubscription(),
        plansService.getActive(),
        paymentMethodsService.getActive(),
        subscriptionRequestsService.getMine(),
      ]);

    const commercialPlans = selectCommercialPlans(availablePlans);
    const firstPayablePlan = commercialPlans.find(isRequestablePlan);
    const primaryPaymentMethod = selectPrimaryPaymentMethod(activePaymentMethods);
    const visiblePaymentMethods = primaryPaymentMethod ? [primaryPaymentMethod] : [];

    setSubscription(sub);
    setPlans(commercialPlans);
    setPaymentMethods(visiblePaymentMethods);
    setRequests(myRequests);
    setSelectedPlanId((current) =>
      commercialPlans.some((plan) => plan._id === current && isRequestablePlan(plan))
        ? current
        : firstPayablePlan?._id || '',
    );
    setSelectedPaymentMethodId(
      (current) =>
        visiblePaymentMethods.some((paymentMethod) => paymentMethod._id === current)
          ? current
          : visiblePaymentMethods[0]?._id || '',
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        await refreshSubscriptionData();
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
            await refreshSubscriptionData();
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
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void (async () => {
        try {
          await refreshSubscriptionData();
        } catch {
          // keep current UI state if background refresh fails
        }
      })();
    }, 15000);

    return () => {
      window.clearInterval(interval);
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

  useEffect(() => {
    if (activePanel !== 'request') {
      setShowReceiptStep(false);
      return;
    }

    setShowReceiptStep(false);
  }, [activePanel, selectedPlanId]);

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

  const requestablePlans = useMemo(
    () => plans.filter((plan) => isRequestablePlan(plan)),
    [plans],
  );

  const hasPayablePlans = requestablePlans.length > 0;
  const hasRequestablePlans = requestablePlans.length > 0;
  const hasActivePaymentMethods = paymentMethods.length > 0;
  const visibleRequests = showAllRequests ? requests : requests.slice(0, 2);
  const pendingRequest =
    requests.find((request) => pendingRequestStatuses.has(request.status)) ?? null;

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
    if (!hasRequestablePlans) {
      return 'No hay planes pagos visibles en este momento.';
    }
    if (!hasActivePaymentMethods) {
      return 'No hay medios de pago visibles en este momento.';
    }
    if (!selectedPlanId) {
      return 'Selecciona un plan para continuar.';
    }
    if (pendingRequest) {
      return 'Ya tienes una solicitud pendiente. Espera la revision del equipo.';
    }
    if (!selectedPaymentMethodId) {
      return 'Selecciona un metodo de pago activo.';
    }
    if (!payerPhone.trim()) {
      return 'Escribe el telefono o contacto del pagador.';
    }
    if (!proofFile) {
      return 'Adjunta el comprobante de pago para enviar la solicitud.';
    }
    return '';
  }, [
    hasActivePaymentMethods,
    hasRequestablePlans,
    payerPhone,
    proofFile,
    selectedPaymentMethodId,
    selectedPlanId,
    submitting,
    pendingRequest,
  ]);

  const submitRequest = async () => {
    if (!selectedPlan || !selectedPaymentMethod || !isRequestablePlan(selectedPlan)) {
      setError('Selecciona un plan pago y un metodo de pago activo.');
      return;
    }
    if (pendingRequest) {
      setError('Ya tienes una solicitud pendiente. Espera la revision del equipo.');
      return;
    }
    if (!proofFile) {
      setError('Adjunta el comprobante de pago para continuar.');
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
        payerPhone,
        message: note,
        proof: proofFile,
      });

      setRequests((current) => [created, ...current]);
      setFeedback(
        'Tu solicitud fue enviada correctamente. Revisaremos el comprobante y activaremos tu plan cuando el pago sea validado.',
      );
      setPayerPhone('');
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

  const copyPaymentValue = async (value: string, label: string) => {
    if (!value.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label} copiado.`);
      setError('');
    } catch {
      setError(`No pudimos copiar ${label.toLowerCase()}.`);
    }
  };

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
                {subscription
                  ? getCommercialPlanName(subscription.planName, subscription.planCode, subscription.planCategory)
                  : 'Free'}
              </h2>
              <p className="mt-2 text-sm font-medium text-[var(--text-soft)]">
                Estado:{' '}
                {subscription?.status
                  ? subscriptionStatusLabels[subscription.status] || subscription.status
                  : 'sin datos'}{' '}
                - Vence:{' '}
                {subscription?.endDate
                  ? new Date(subscription.endDate).toLocaleDateString()
                  : 'sin fecha'}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                {getCurrentPlanDetail(subscription)}
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
              onClick={() => {
                setShowReceiptStep(false);
                setActivePanel('request');
              }}
              className="min-h-14 bg-[linear-gradient(135deg,#4c35ff,#ff7e5f)] text-[15px] font-bold tracking-[0.02em] text-white shadow-[0_24px_44px_rgba(96,66,214,0.34)]"
            >
              Solicitar Premium
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
                  Mensajes, chats y documentos disponibles.
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
              No hay planes visibles
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              No hay planes comerciales visibles para solicitar en este momento.
            </p>
          </GlassCard>
        ) : null}

        {!hasActivePaymentMethods ? (
          <GlassCard className="premium-card rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-900">
              No hay medios de pago activos
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              No hay un metodo de pago visible para enviar solicitudes con comprobante.
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
                          Plan solicitado:{' '}
                          {getCommercialPlanName(
                            request.planName,
                            request.planCode,
                            request.requestType,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Estado: {statusLabels[request.status] || request.status}
                        </p>
                      </div>
                      <span className="rounded-full bg-[rgba(109,80,255,0.1)] px-2 py-1 text-[11px] font-medium text-[var(--brand-deep)]">
                        {getPaymentMethodLabel(request.paymentMethodSnapshot)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[var(--text-muted)] md:grid-cols-2">
                      <span>
                        Fecha: {new Date(request.createdAt).toLocaleString()}
                      </span>
                      <span>
                         Metodo de pago: {getPaymentMethodLabel(request.paymentMethodSnapshot)}
                      </span>
                      <span>
                        Monto reportado:{' '}
                        {request.reportedAmount
                          ? formatMoney(
                              request.reportedAmount,
                              request.planSnapshot.currency,
                            )
                          : 'Monto no reportado'}
                      </span>
                      <span>
                        Precio del plan:{' '}
                        {formatMoney(
                          request.planSnapshot.price,
                          request.planSnapshot.currency,
                        )}
                      </span>
                      <span>
                        Plan anterior:{' '}
                        {getCommercialPlanName(
                          request.currentPlanName,
                          request.currentPlanCode,
                        )}
                      </span>
                      <span>
                        Plan actual:{' '}
                        {request.status === 'activated'
                          ? getCommercialPlanName(
                              request.activatedPlanName,
                              request.activatedPlanCode,
                            )
                          : getCommercialPlanName(
                              subscription?.planName,
                              subscription?.planCode,
                              subscription?.planCategory,
                            )}
                      </span>
                      <span>
                        Estado de suscripcion:{' '}
                        {request.activatedSubscriptionStatus
                          ? subscriptionStatusLabels[
                              request.activatedSubscriptionStatus
                            ] || request.activatedSubscriptionStatus
                          : subscription?.status
                            ? subscriptionStatusLabels[subscription.status] ||
                              subscription.status
                            : 'Sin dato'}
                      </span>
                      <span>
                        Vigencia:{' '}
                        {request.activatedEndDate
                          ? new Date(request.activatedEndDate).toLocaleDateString()
                          : 'Pendiente de activacion'}
                      </span>
                    </div>
                    {request.message ? (
                      <p className="mt-2 text-sm text-[var(--text-soft)]">
                        {request.message}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                      <span>{request.planSnapshot.durationDays} dias</span>
                      <span>{requestTypeLabels[request.requestType]}</span>
                      {request.paidAtReference ? (
                        <span>Referencia: {request.paidAtReference}</span>
                      ) : null}
                      {request.proofOriginalName ? (
                        <span>{request.proofOriginalName}</span>
                      ) : null}
                      {request.hasProof ? (
                        <span>Comprobante adjunto</span>
                      ) : (
                        <span>Comprobante: no adjunto</span>
                      )}
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
                      <p className="mt-2 text-xs font-medium text-[var(--text-soft)]">
                        {request.status === 'rejected' ? 'Motivo: ' : 'Nota del equipo: '}
                        {request.adminNotes}
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
        <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center md:px-6 md:py-8">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-[rgba(25,16,44,0.42)] backdrop-blur-[3px]"
            onClick={() => setActivePanel(null)}
          />
          <div className="relative w-full max-w-[44rem] overflow-hidden rounded-t-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,251,255,0.99),rgba(247,239,255,0.97))] shadow-[0_-24px_60px_rgba(69,48,120,0.2)] md:max-h-[88vh] md:rounded-[30px]">
            <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-[rgba(109,80,255,0.2)]" />
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {activePanel === 'request' ? 'Solicitar plan' : 'Medios de pago'}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--text-main)]">
                  {activePanel === 'request'
                    ? 'Solicitud de plan Premium'
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

            <div className="max-h-[calc(82vh-5rem)] space-y-3 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:max-h-[calc(88vh-5rem)]">
              {activePanel === 'methods' ? (
                <GlassCard className="premium-card rounded-[26px] border border-white/55 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <WalletCards size={18} className="mt-1 text-[var(--brand-deep)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Metodo de pago visible
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                        Envia el pago a este metodo y luego completa la informacion.
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
                            {getPaymentMethodLabel(paymentMethod)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-soft)]">
                          {getPaymentAccountLabel(paymentMethod)}:{' '}
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
                      No hay medios de pago visibles en este momento.
                    </div>
                  ) : null}
                </GlassCard>
              ) : null}

              {activePanel === 'request' ? (
                <>
                  <GlassCard className="premium-card rounded-[22px] border border-white/65 px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Paso 1. Elige tu plan
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[var(--text-soft)]">
                      Selecciona el plan disponible que quieres activar.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {requestablePlans.map((plan) => {
                        const isSelected = plan._id === selectedPlanId;
                        const canRequestPlan = isRequestablePlan(plan);
                        const isCurrentPlan =
                          subscription?.planId === plan._id ||
                          getCommercialPlanName(subscription?.planName, subscription?.planCode, subscription?.planCategory) ===
                            getCommercialPlanName(plan.name, plan.code, plan.category);
                        return (
                          <button
                            key={plan._id}
                            type="button"
                            onClick={() => {
                              if (canRequestPlan) {
                                setSelectedPlanId(plan._id);
                              }
                            }}
                            disabled={!canRequestPlan}
                            className={`rounded-[16px] border px-4 py-4 text-left transition ${
                              isSelected
                                ? 'border-[var(--brand-deep)] bg-[linear-gradient(135deg,#efe8ff,#ffffff)] shadow-[0_18px_34px_rgba(105,77,205,0.16)]'
                                : 'border-[rgba(118,93,181,0.16)] bg-white/88'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-[var(--brand-deep)]">
                                    {getCommercialPlanName(plan.name, plan.code, plan.category)}
                                  </span>
                                  {isSelected ? (
                                    <span className="rounded-full bg-[var(--brand-deep)] px-2.5 py-1 text-[11px] font-semibold text-white">
                                      Seleccionado
                                    </span>
                                  ) : null}
                                  {isCurrentPlan ? (
                                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-soft)]">
                                      Plan actual
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-3 text-base font-semibold text-[var(--text-main)]">
                                  {getCommercialPlanName(plan.name, plan.code, plan.category)}
                                </p>
                                <p className="mt-1 text-sm font-medium text-[var(--brand-deep)]">
                                  {formatMoney(plan.price, plan.currency)}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                                  {canRequestPlan
                                    ? getPlanBenefit(plan)
                                    : 'Plan base incluido en tu cuenta.'}
                                </p>
                              </div>
                              <div className="rounded-[14px] bg-[linear-gradient(135deg,rgba(108,86,255,0.14),rgba(255,168,125,0.18))] px-3 py-2 text-right">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                  Duracion
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                                  {plan.durationDays} dias
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-[12px] bg-white/88 px-3 py-2 text-[var(--text-muted)]">
                                <span className="block uppercase tracking-[0.12em]">
                                  Mensajes
                                </span>
                                <span className="mt-1 block font-semibold text-[var(--text-main)]">
                                  {plan.limits.maxMessagesPerMonth || 0}
                                </span>
                              </div>
                              <div className="rounded-[12px] bg-white/88 px-3 py-2 text-[var(--text-muted)]">
                                <span className="block uppercase tracking-[0.12em]">
                                  Chats
                                </span>
                                <span className="mt-1 block font-semibold text-[var(--text-main)]">
                                  {plan.limits.maxChats || plan.limits.maxChatsPerMonth || 0}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </GlassCard>

                  <GlassCard className="premium-card rounded-[22px] border border-white/65 px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Paso 2. Realiza el pago
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[var(--text-soft)]">
                      Paga por Nequi y luego continua con el recibo.
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
                                {getPaymentMethodLabel(paymentMethod)}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-[var(--text-soft)]">
                              {getPaymentAccountLabel(paymentMethod)}:{' '}
                              {paymentMethod.accountValue ||
                                paymentMethod.accountNumber ||
                                'sin dato visible'}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {selectedPaymentMethod ? (
                      <div className="mt-4 rounded-[18px] border border-[rgba(118,93,181,0.14)] bg-white px-4 py-4 text-sm text-[var(--text-soft)]">
                        <p className="font-medium text-[var(--text-main)]">Detalle para pagar</p>
                        {selectedPlan ? (
                          <p className="mt-2">
                            <span className="font-medium text-[var(--text-main)]">
                              Plan seleccionado:
                            </span>{' '}
                            {getCommercialPlanName(selectedPlan.name, selectedPlan.code, selectedPlan.category)} ·{' '}
                            {formatMoney(selectedPlan.price, selectedPlan.currency)}
                          </p>
                        ) : null}
                        {selectedPlan ? (
                          <p className="mt-2">
                            <span className="font-medium text-[var(--text-main)]">
                              Valor:
                            </span>{' '}
                            {formatMoney(selectedPlan.price, selectedPlan.currency)}
                          </p>
                        ) : null}
                        <p className="mt-2">
                          <span className="font-medium text-[var(--text-main)]">
                            Metodo:
                          </span>{' '}
                          {getPaymentMethodLabel(selectedPaymentMethod)}
                        </p>
                        <p className="mt-2">
                          <span className="font-medium text-[var(--text-main)]">
                            {getPaymentAccountLabel(selectedPaymentMethod)}:
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
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            className="min-h-11 rounded-[14px] border-[rgba(113,47,243,0.14)] bg-white text-[var(--text-main)]"
                            onClick={() =>
                              void copyPaymentValue(
                                selectedPaymentMethod.accountValue ||
                                  selectedPaymentMethod.accountNumber ||
                                  '',
                                getPaymentAccountLabel(selectedPaymentMethod),
                              )
                            }
                          >
                            Copiar numero Nequi
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            className="min-h-11 rounded-[14px] border-[rgba(113,47,243,0.14)] bg-white text-[var(--text-main)]"
                            onClick={() =>
                              selectedPlan
                                ? void copyPaymentValue(
                                    String(selectedPlan.price || 0),
                                    'Valor',
                                  )
                                : undefined
                            }
                          >
                            Copiar valor
                          </Button>
                        </div>
                        <Button
                          type="button"
                          fullWidth
                          className="mt-3 min-h-12 rounded-[14px] bg-[linear-gradient(135deg,#5a36f5,#ff7f6a)] text-sm font-semibold text-white shadow-[0_18px_34px_rgba(88,61,188,0.24)]"
                          onClick={() => setShowReceiptStep(true)}
                        >
                          Ya pague, agregar recibo
                        </Button>
                      </div>
                    ) : null}
                  </GlassCard>

                  <GlassCard className={`premium-card rounded-[22px] border border-white/65 px-4 py-4 ${showReceiptStep ? '' : 'hidden'}`}>
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Paso 3. Sube el comprobante
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[var(--text-soft)]">
                      Solo necesitamos tu telefono, el comprobante obligatorio y un mensaje opcional.
                    </p>
                    <div className="mt-3 grid gap-3">
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          Telefono del pagador *
                        </span>
                        <input
                          value={payerPhone}
                          onChange={(event) => setPayerPhone(event.target.value)}
                          placeholder="Ejemplo: 3001234567"
                          className="mt-2 h-11 w-full rounded-[14px] border border-[rgba(118,93,181,0.18)] bg-white px-3.5 text-sm font-medium text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Mensaje opcional
                      </span>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Ejemplo: Pago realizado, quedo atento a la activacion."
                        className="mt-2 min-h-24 w-full rounded-[14px] border border-[rgba(118,93,181,0.18)] bg-white px-3.5 py-3 text-sm font-medium text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
                      />
                    </label>

                    <label className="mt-4 block">
                      <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Comprobante de pago *
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.webp,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) =>
                          setProofFile(event.target.files?.[0] || null)
                        }
                        className="mt-2 block w-full text-sm text-[var(--text-soft)] file:mr-3 file:rounded-[12px] file:border-0 file:bg-[var(--brand-deep)] file:px-3.5 file:py-2 file:text-white"
                      />
                      {proofFile ? (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          {proofFile.name}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Adjunta imagen o PDF del comprobante para que el equipo valide tu solicitud.
                        </p>
                      )}
                    </label>

                    <div className="mt-4 space-y-3">
                      {pendingRequest ? (
                        <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                          Ya tienes una solicitud pendiente. Espera la revision del equipo antes de enviar otra.
                        </div>
                      ) : null}
                      <Button
                        fullWidth
                        onClick={() => void submitRequest()}
                        className="min-h-12 rounded-[14px] bg-[linear-gradient(135deg,#4c35ff,#ff7e5f)] text-[15px] font-bold tracking-[0.02em] text-white shadow-[0_24px_44px_rgba(96,66,214,0.34)] disabled:bg-[linear-gradient(135deg,rgba(94,76,180,0.46),rgba(183,132,120,0.36))] disabled:text-white/88 disabled:shadow-none"
                        disabled={
                          submitting ||
                          !!pendingRequest ||
                          !selectedPlanId ||
                          !selectedPaymentMethodId ||
                          !payerPhone.trim() ||
                          !proofFile
                        }
                      >
                        {submitting
                          ? 'Enviando solicitud...'
                          : 'Enviar solicitud de activacion'}
                      </Button>

                      {submitDisabledReason ? (
                          <p className="rounded-[14px] border border-[rgba(118,93,181,0.14)] bg-white px-4 py-3 text-sm font-medium text-[var(--text-soft)]">
                          {submitDisabledReason}
                        </p>
                      ) : (
                          <p className="rounded-[14px] border border-[rgba(93,67,255,0.18)] bg-[linear-gradient(135deg,rgba(99,74,255,0.12),rgba(255,150,111,0.12))] px-4 py-3 text-sm font-medium text-[var(--text-main)]">
                          Todo listo: envia la solicitud cuando ya tengas el comprobante cargado.
                        </p>
                      )}

                      {proofFile ? (
                        <div className="rounded-[14px] border border-[rgba(113,47,243,0.14)] bg-white px-4 py-3 text-sm text-[var(--text-soft)]">
                          <p className="font-medium text-[var(--text-main)]">
                            Comprobante listo para enviar
                          </p>
                          <p className="mt-1 break-all">{proofFile.name}</p>
                        </div>
                      ) : (
                        <div className="rounded-[14px] border border-dashed border-[rgba(118,93,181,0.24)] bg-white px-4 py-3 text-sm text-[var(--text-soft)]">
                          Falta adjuntar el comprobante para completar la solicitud.
                        </div>
                      )}
                    </div>
                    </GlassCard>
                  {!showReceiptStep ? (
                    <GlassCard className="premium-card rounded-[22px] border border-white/65 px-4 py-4">
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Paso 3. Sube el comprobante
                      </p>
                      <p className="mt-1 text-sm leading-5 text-[var(--text-soft)]">
                        Primero realiza el pago y luego toca “Ya pague, agregar recibo”.
                      </p>
                    </GlassCard>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
