import { useEffect, useMemo, useState } from 'react';
import {
  Crown,
  GaugeCircle,
  MessageSquareShare,
  ReceiptText,
  WalletCards,
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
  premium: 'Premium',
  extra_tokens: 'Mas tokens',
  custom: 'Plan personalizado',
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
    helper: 'Mensajes disponibles en tu ciclo actual.',
  },
  {
    label: 'Chats',
    used: subscription.usageSnapshot.chats.used,
    limit: subscription.usageSnapshot.chats.limit,
    helper: 'Conversaciones activas o creadas en el periodo.',
  },
  {
    label: 'Tokens',
    used: subscription.usageSnapshot.tokens.used,
    limit: subscription.usageSnapshot.tokens.limit,
    helper: 'Capacidad de respuesta y procesamiento del plan.',
  },
  {
    label: 'Documentos',
    used: subscription.usageSnapshot.documents.used,
    limit: subscription.usageSnapshot.documents.limit,
    helper: 'Espacio de carga documental disponible en MB.',
  },
];

export function SubscriptionScreen() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [requests, setRequests] = useState<SubscriptionRequestItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

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

        const payablePlans = availablePlans.filter(
          (plan) => plan.category !== 'free',
        );

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

  const usageTone = useMemo(() => {
    if (!subscription) return '';
    if (subscription.usageSnapshot.upgradeRecommended) {
      return 'Estas cerca de tu limite actual. Tiene sentido pedir un upgrade o un paquete extra.';
    }
    if (subscription.planCategory === 'free') {
      return 'Estas en el plan base. Puedes solicitar premium, mas tokens o un plan a medida.';
    }
    return 'Tu cuenta tiene un plan activo. Si necesitas mas capacidad, puedes dejar una nueva solicitud.';
  }, [subscription]);

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
        requestType: selectedPlan.category === 'premium'
          ? 'premium'
          : selectedPlan.category === 'extra_tokens'
            ? 'extra_tokens'
            : 'custom',
        message: note,
        proof: proofFile,
      });

      setRequests((current) => [created, ...current]);
      setFeedback(
        'Tu solicitud quedo registrada. El super admin ya puede verla, revisar el comprobante y activar tu plan.',
      );
      setNote('');
      setProofFile(null);
    } catch {
      setError('No pudimos enviar tu solicitud en este momento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <GlassCard className="aurora-panel premium-card rounded-[32px] border border-white/55 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Tu plan actual
            </p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.06em] text-[var(--text-main)]">
              {subscription?.planName || 'Free'}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Estado: {subscription?.status || 'sin datos'} · Vence:{' '}
              {subscription?.endDate
                ? new Date(subscription.endDate).toLocaleDateString()
                : 'sin fecha'}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {usageTone}
            </p>
          </div>
          <div className="rounded-[24px] bg-[var(--gradient-main)] p-3 text-white shadow-[0_20px_32px_rgba(126,84,198,0.22)]">
            <Crown size={20} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[28px] border border-white/55 px-4 py-4">
        <div className="flex items-center gap-3">
          <GaugeCircle size={18} className="text-[var(--brand-deep)]" />
          <p className="text-sm font-semibold text-[var(--text-main)]">
            Consumo actual
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {subscription ? (
            usageCards(subscription).map((metric) => (
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
            ))
          ) : (
            [1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-[18px] bg-white/60"
              />
            ))
          )}
        </div>
        {subscription?.usageSnapshot.upgradeRecommended ? (
          <p className="mt-3 text-sm font-medium text-[var(--brand-deep)]">
            Recomendacion: considera un plan{' '}
            {requestTypeLabels[subscription.usageSnapshot.recommendedPlanCategory]}.
          </p>
        ) : null}
      </GlassCard>

      <div className="grid gap-3">
        {plans.map((plan) => {
          const isSelected = plan._id === selectedPlanId;
          return (
            <button
              key={plan._id}
              type="button"
              onClick={() => setSelectedPlanId(plan._id)}
              className={`rounded-[26px] border px-4 py-4 text-left transition ${
                isSelected
                  ? 'border-[var(--brand-deep)] bg-[linear-gradient(135deg,#efe8ff,#ffffff)]'
                  : 'border-white/55 bg-white/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    {plan.name}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                    {plan.description || 'Plan configurable desde administracion.'}
                  </p>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-[var(--text-soft)]">
                  {requestTypeLabels[plan.category]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                <span>{formatMoney(plan.price, plan.currency)}</span>
                <span>{plan.durationDays} dias</span>
                <span>{plan.limits.monthlyTokens || 0} tokens</span>
                <span>{plan.limits.maxMessagesPerMonth || 0} mensajes</span>
              </div>
            </button>
          );
        })}
      </div>

      <GlassCard className="premium-card rounded-[28px] border border-white/55 px-4 py-4">
        <div className="flex items-start gap-3">
          <WalletCards size={18} className="mt-1 text-[var(--brand-deep)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">
              Medios de pago activos
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              El pago es manual por Nequi u otros medios configurados por el super
              admin. Aqui dejas la solicitud real con comprobante.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {paymentMethods.map((paymentMethod) => {
            const isSelected = paymentMethod._id === selectedPaymentMethodId;
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
                  {(paymentMethod.accountLabel || 'Dato de pago')}: {paymentMethod.accountValue || paymentMethod.accountNumber || 'sin dato visible'}
                </p>
              </button>
            );
          })}
        </div>

        {selectedPaymentMethod ? (
          <div className="mt-4 rounded-[22px] bg-white/74 px-4 py-4 text-sm text-[var(--text-soft)]">
            <p className="font-medium text-[var(--text-main)]">Detalle para pagar</p>
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
              {selectedPaymentMethod.instructions || 'Sin instrucciones adicionales.'}
            </p>
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Mensaje adicional
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ejemplo: quiero premium mensual, necesito mas tokens este mes, o un plan a medida para mas volumen."
            className="mt-2 min-h-24 w-full rounded-[22px] border border-white/70 bg-white/78 px-4 py-3 text-sm text-[var(--text-main)] outline-none"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Comprobante
          </span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.webp,image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setProofFile(event.target.files?.[0] || null)}
            className="mt-2 block w-full text-sm text-[var(--text-soft)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--brand-deep)] file:px-4 file:py-2 file:text-white"
          />
          {proofFile ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">{proofFile.name}</p>
          ) : null}
        </label>

        <div className="mt-4 space-y-2">
          <Button
            fullWidth
            onClick={() => void submitRequest()}
            disabled={
              submitting || !selectedPlanId || !selectedPaymentMethodId || !proofFile
            }
          >
            {submitting ? 'Enviando solicitud...' : 'Enviar solicitud de pago'}
          </Button>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <MessageSquareShare size={14} />
            <span>
              La solicitud queda visible en super admin para revision,
              aprobacion y activacion del plan.
            </span>
          </div>
          {feedback ? <p className="text-sm text-[var(--text-muted)]">{feedback}</p> : null}
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[28px] border border-white/55 px-4 py-4">
        <div className="flex items-center gap-3">
          <ReceiptText size={18} className="text-[var(--brand-deep)]" />
          <p className="text-sm font-semibold text-[var(--text-main)]">
            Historial de solicitudes
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div
                key={request._id}
                className="rounded-[20px] bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-main)]">
                      {request.planName}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {statusLabels[request.status] || request.status} ·{' '}
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-[rgba(109,80,255,0.1)] px-2 py-1 text-[11px] font-medium text-[var(--brand-deep)]">
                    {request.paymentMethodSnapshot.name}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-soft)]">{request.message}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                  <span>{formatMoney(request.planSnapshot.price, request.planSnapshot.currency)}</span>
                  <span>{request.planSnapshot.durationDays} dias</span>
                  <span>{requestTypeLabels[request.requestType]}</span>
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
      </GlassCard>
    </div>
  );
}
