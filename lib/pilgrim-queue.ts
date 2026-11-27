/**
 * Shared Sequential Pilgrim Queue & Rotation Helpers for Web UI
 * 
 * Replicates the exact backend worker rotation algorithm from:
 * worker/src/jobs/booking-worker.ts
 */

export interface PilgrimMetadata {
  taskIndex?: number;
  taskStatus?: string;
  status?: string;
  deferralCount?: number;
  attemptCount?: number;
  deferredAt?: string;
  lastAttemptedAt?: string;
  lastFailureReason?: string;
  lastErrorCode?: string;
  officialBookingReference?: string;
  portalTransactionReference?: string;
  transactionId?: string;
  cartId?: string;
  confirmedAt?: string;
  adminReason?: string;
  [key: string]: any;
}

export type PilgrimStatusKey =
  | 'CONFIRMED'
  | 'ADMIN_COMPLETED'
  | 'PROCESSING'
  | 'NEXT_IN_QUEUE'
  | 'DEFERRED'
  | 'PENDING'
  | 'FAILED';

export interface EnrichedPilgrim {
  id: string;
  originalIndex: number;
  taskIndex: number;
  fullName: string;
  age: number;
  gender: string;
  idType: string;
  idNumber: string;
  nominee?: {
    name?: string;
    age?: number;
    relationship?: string;
  };
  metadata: PilgrimMetadata;
  statusKey: PilgrimStatusKey;
  statusLabel: string;
  statusDescription: string;
  queuePosition?: number;
  deferralCount: number;
  attemptCount: number;
  lastAttemptedAt: string | null;
  deferredAt: string | null;
  lastFailureReason: string | null;
  lastErrorCode: string | null;
  officialBookingReference: string | null;
  confirmedAt: string | null;
  adminReason?: string;
  raw: any;
}

export interface BookingPilgrimSummary {
  totalDevotees: number;
  confirmedCount: number;
  deferredCount: number;
  pendingCount: number;
  isAllConfirmed: boolean;
  isPartiallyConfirmed: boolean;
  activePilgrim: EnrichedPilgrim | null;
  nextPilgrim: EnrichedPilgrim | null;
  queueOrder: EnrichedPilgrim[];
}

/**
 * Safely parse pilgrim metadata (handles null, stringified JSON, or parsed JSON object)
 */
export function parsePilgrimMetadata(p: any): PilgrimMetadata {
  if (!p) return {};
  if (typeof p.metadata === 'string') {
    try {
      return JSON.parse(p.metadata);
    } catch {
      return {};
    }
  }
  return p.metadata || {};
}

/**
 * Authoritative check for whether a pilgrim is confirmed
 */
export function isPilgrimConfirmed(p: any, bookingFallbackRef?: string | null): boolean {
  if (!p) return false;
  const m = parsePilgrimMetadata(p);
  return (
    m.taskStatus === 'CONFIRMED' ||
    m.status === 'CONFIRMED' ||
    Boolean(m.officialBookingReference) ||
    Boolean(m.portalTransactionReference) ||
    Boolean(m.transactionId)
  );
}

/**
 * Check if pilgrim was administratively marked completed by Super Admin
 */
export function isPilgrimAdminCompleted(p: any): boolean {
  if (!p) return false;
  const m = parsePilgrimMetadata(p);
  return m.taskStatus === 'ADMIN_COMPLETED' || m.status === 'ADMIN_COMPLETED';
}

/**
 * General check for completed devotee (portal confirmed OR administrative complete)
 */
export function isPilgrimCompleted(p: any): boolean {
  return isPilgrimConfirmed(p) || isPilgrimAdminCompleted(p);
}

/**
 * Exact worker rotation sorting algorithm:
 * 1. Devotees with fewer deferrals / attempts come first (unattempted first)
 * 2. If counts are equal and 0, sort by initial taskIndex (1, 2, 3...)
 * 3. If counts are equal and > 0, sort by deferredAt / lastAttemptedAt ascending (oldest deferred first -> FIFO queue rotation)
 */
export function sortUnconfirmedPilgrims<T extends any>(unconfirmed: T[]): T[] {
  return [...unconfirmed].sort((a: any, b: any) => {
    const metaA = parsePilgrimMetadata(a);
    const metaB = parsePilgrimMetadata(b);
    const countA = Number(metaA.deferralCount || metaA.attemptCount || (metaA.deferredAt ? 1 : 0));
    const countB = Number(metaB.deferralCount || metaB.attemptCount || (metaB.deferredAt ? 1 : 0));
    if (countA !== countB) {
      return countA - countB;
    }
    if (countA === 0) {
      const seqA = Number(metaA.taskIndex || a.taskIndex || 0);
      const seqB = Number(metaB.taskIndex || b.taskIndex || 0);
      if (seqA && seqB) return seqA - seqB;
      return 0;
    }
    const timeA = metaA.deferredAt ? new Date(metaA.deferredAt).getTime() : (metaA.lastAttemptedAt ? new Date(metaA.lastAttemptedAt).getTime() : 0);
    const timeB = metaB.deferredAt ? new Date(metaB.deferredAt).getTime() : (metaB.lastAttemptedAt ? new Date(metaB.lastAttemptedAt).getTime() : 0);
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    const seqA = Number(metaA.taskIndex || a.taskIndex || 0);
    const seqB = Number(metaB.taskIndex || b.taskIndex || 0);
    return seqA - seqB;
  });
}

/**
 * Enriches pilgrims list with live queue rotation order and explicit statuses
 */
export function enrichPilgrimsWithQueueStatus(
  rawPilgrims: any[],
  booking: any,
): {
  enrichedPilgrims: EnrichedPilgrim[];
  summary: BookingPilgrimSummary;
} {
  const pilgrimsList = Array.isArray(rawPilgrims) ? rawPilgrims : [];
  const totalDevotees = Math.max(1, booking?.pilgrimCount || pilgrimsList.length || 1);

  // 1. Separate confirmed/completed vs unconfirmed
  const confirmedPilgrims = pilgrimsList.filter(isPilgrimCompleted);
  const unconfirmedPilgrims = pilgrimsList.filter((p) => !isPilgrimCompleted(p));

  // 2. Sort unconfirmed using exact rotation algorithm
  const sortedUnconfirmed = sortUnconfirmedPilgrims(unconfirmedPilgrims);

  // 3. Determine active in-flight devotee
  const isExecuting =
    booking?.status === 'EXECUTING' ||
    booking?.status === 'IN_PROGRESS' ||
    booking?.executionStatus === 'EXECUTING' ||
    booking?.executionStatus === 'RUNNING';

  let activePilgrimCandidate: any = null;
  if (isExecuting && sortedUnconfirmed.length > 0) {
    if (booking?.selectedPilgrimName) {
      activePilgrimCandidate = sortedUnconfirmed.find((p) =>
        booking.selectedPilgrimName.toLowerCase().includes(p.fullName?.toLowerCase()),
      ) || sortedUnconfirmed[0];
    } else {
      activePilgrimCandidate = sortedUnconfirmed[0];
    }
  }

  // Next eligible pilgrim when not actively executing, or the top candidate in queue
  const nextPilgrimCandidate = sortedUnconfirmed.length > 0 ? sortedUnconfirmed[0] : null;

  const isParentFailed =
    !isExecuting &&
    confirmedPilgrims.length === 0 &&
    (booking?.status === 'FAILED' ||
      booking?.status === 'CANCELLED' ||
      booking?.status === 'SITE_ERROR' ||
      booking?.status === 'NO_AVAILABILITY' ||
      booking?.status === 'LOGIN_FAILED');

  // 4. Enrich each pilgrim
  const enrichedPilgrims: EnrichedPilgrim[] = pilgrimsList.map((p, idx) => {
    const meta = parsePilgrimMetadata(p);
    const taskIndex = Number(meta.taskIndex || idx + 1);
    const isConf = isPilgrimConfirmed(p);
    const isAdminComp = isPilgrimAdminCompleted(p);
    const deferralCount = Number(meta.deferralCount || 0);
    const attemptCount = Number(meta.attemptCount || 0);

    const isCurrentlyProcessing = Boolean(
      activePilgrimCandidate && activePilgrimCandidate.id === p.id,
    );

    let statusKey: PilgrimStatusKey = 'PENDING';
    let statusLabel = 'Pending';
    let statusDescription = 'Waiting for initial turn in booking sequence';

    if (isAdminComp) {
      statusKey = 'ADMIN_COMPLETED';
      statusLabel = 'Admin Completed';
      statusDescription = meta.adminReason || 'Administratively completed by Super Admin';
    } else if (isConf) {
      statusKey = 'CONFIRMED';
      statusLabel = 'Confirmed';
      statusDescription = 'Authoritatively confirmed on official portal';
    } else if (isCurrentlyProcessing) {
      statusKey = 'PROCESSING';
      statusLabel = 'Processing';
      statusDescription = 'Autonomous booking execution currently active on portal';
    } else if (nextPilgrimCandidate && nextPilgrimCandidate.id === p.id && !isParentFailed) {
      statusKey = 'NEXT_IN_QUEUE';
      statusLabel = 'Next in Queue';
      statusDescription =
        deferralCount > 0
          ? `Priority #1 in queue (Deferred attempt #${deferralCount}, retrying in rotation)`
          : 'Priority #1 for next available slot discovery';
    } else if (deferralCount > 0 || Boolean(meta.deferredAt)) {
      statusKey = 'DEFERRED';
      statusLabel = 'Deferred';
      statusDescription = meta.lastFailureReason
        ? `Rotated to queue end: ${meta.lastFailureReason}`
        : 'Rotated to end of queue after quota/slot restriction';
    } else if (isParentFailed) {
      statusKey = 'FAILED';
      statusLabel = 'Concluded (Unconfirmed)';
      statusDescription = booking?.failureReason || 'Booking request concluded without pass';
    } else {
      statusKey = 'PENDING';
      statusLabel = 'Pending';
      statusDescription = 'Waiting for turn in rotation sequence';
    }

    const queueIndex = sortedUnconfirmed.findIndex((cand) => cand.id === p.id);
    const queuePosition = queueIndex >= 0 ? queueIndex + 1 : undefined;

    const officialBookingReference =
      meta.officialBookingReference ||
      meta.portalTransactionReference ||
      meta.transactionId ||
      (isConf ? (booking?.portalTransactionReference || booking?.officialReference || null) : null);

    return {
      id: p.id || `pilgrim-${idx}`,
      originalIndex: idx + 1,
      taskIndex,
      fullName: p.fullName,
      age: p.age,
      gender: p.gender,
      idType: p.idType || 'Aadhaar',
      idNumber: p.idNumber,
      nominee: {
        name: p.nomineeName,
        age: p.nomineeAge,
        relationship: p.nomineeRelationship,
      },
      metadata: meta,
      statusKey,
      statusLabel,
      statusDescription,
      queuePosition,
      deferralCount,
      attemptCount,
      lastAttemptedAt: meta.lastAttemptedAt || meta.deferredAt || null,
      deferredAt: meta.deferredAt || null,
      lastFailureReason: meta.lastFailureReason || null,
      lastErrorCode: meta.lastErrorCode || null,
      officialBookingReference,
      confirmedAt: meta.confirmedAt || null,
      adminReason: meta.adminReason,
      raw: p,
    };
  });

  const confirmedCount = enrichedPilgrims.filter(
    (p) => p.statusKey === 'CONFIRMED' || p.statusKey === 'ADMIN_COMPLETED',
  ).length;
  const deferredCount = enrichedPilgrims.filter(
    (p) => !isPilgrimCompleted(p) && (p.deferralCount > 0 || Boolean(p.deferredAt)),
  ).length;
  const pendingCount = enrichedPilgrims.filter(
    (p) => !isPilgrimCompleted(p) && p.deferralCount === 0 && !p.deferredAt && p.statusKey !== 'PROCESSING',
  ).length;

  const isAllConfirmed = totalDevotees > 0 && confirmedCount >= totalDevotees;
  const isPartiallyConfirmed = !isAllConfirmed && confirmedCount > 0;

  const activeEnriched = enrichedPilgrims.find((p) => p.statusKey === 'PROCESSING') || null;
  const nextEnriched = enrichedPilgrims.find((p) => p.statusKey === 'NEXT_IN_QUEUE') || null;

  // Queue order array: sorted unconfirmed devotees
  const queueOrder = sortedUnconfirmed
    .map((unconf) => enrichedPilgrims.find((ep) => ep.id === unconf.id))
    .filter(Boolean) as EnrichedPilgrim[];

  const summary: BookingPilgrimSummary = {
    totalDevotees,
    confirmedCount,
    deferredCount,
    pendingCount,
    isAllConfirmed,
    isPartiallyConfirmed,
    activePilgrim: activeEnriched,
    nextPilgrim: nextEnriched,
    queueOrder,
  };

  return {
    enrichedPilgrims,
    summary,
  };
}
