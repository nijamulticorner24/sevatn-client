import {
  parsePilgrimMetadata,
  isPilgrimConfirmed,
  isPilgrimAdminCompleted,
  sortUnconfirmedPilgrims,
  enrichPilgrimsWithQueueStatus,
} from './pilgrim-queue';

describe('Pilgrim Queue & Status Logic Suite', () => {
  // 1. Each pilgrim's individual status is displayed correctly
  it('1. assigns correct status keys for all pilgrim states (Confirmed, Processing, Next, Deferred, Pending)', () => {
    const rawPilgrims = [
      {
        id: 'p-1',
        fullName: 'Pilgrim One',
        age: 40,
        gender: 'Male',
        metadata: {
          taskIndex: 1,
          taskStatus: 'CONFIRMED',
          officialBookingReference: 'SAB-CONF-1111',
          confirmedAt: '2026-11-27T10:00:00Z',
        },
      },
      {
        id: 'p-2',
        fullName: 'Pilgrim Two',
        age: 35,
        gender: 'Male',
        metadata: {
          taskIndex: 2,
          taskStatus: 'PENDING',
          deferralCount: 1,
          deferredAt: '2026-11-27T11:00:00Z',
          lastFailureReason: 'Sufficient Quota is not available',
        },
      },
      {
        id: 'p-3',
        fullName: 'Pilgrim Three',
        age: 28,
        gender: 'Male',
        metadata: {
          taskIndex: 3,
          taskStatus: 'PENDING',
        },
      },
    ];

    const bookingExecuting = {
      status: 'EXECUTING',
      pilgrimCount: 3,
      selectedPilgrimName: 'Pilgrim Three',
    };

    const { enrichedPilgrimMap, summary } = (() => {
      const res = enrichPilgrimsWithQueueStatus(rawPilgrims, bookingExecuting);
      const map = new Map(res.enrichedPilgrims.map((p) => [p.id, p]));
      return { enrichedPilgrimMap: map, summary: res.summary };
    })();

    // P1 is confirmed
    const p1 = enrichedPilgrimMap.get('p-1')!;
    expect(p1.statusKey).toBe('CONFIRMED');
    expect(p1.statusLabel).toBe('Confirmed');
    expect(p1.officialBookingReference).toBe('SAB-CONF-1111');

    // P3 is unattempted and currently processing
    const p3 = enrichedPilgrimMap.get('p-3')!;
    expect(p3.statusKey).toBe('PROCESSING');
    expect(p3.statusLabel).toBe('Processing');

    // P2 is deferred
    const p2 = enrichedPilgrimMap.get('p-2')!;
    expect(p2.statusKey).toBe('DEFERRED');
    expect(p2.statusLabel).toBe('Deferred');
    expect(p2.deferralCount).toBe(1);
    expect(p2.lastFailureReason).toBe('Sufficient Quota is not available');

    // Parent summary stats
    expect(summary.totalDevotees).toBe(3);
    expect(summary.confirmedCount).toBe(1);
    expect(summary.deferredCount).toBe(1);
    expect(summary.isPartiallyConfirmed).toBe(true);
    expect(summary.isAllConfirmed).toBe(false);
  });

  // 2. Deferred pilgrims remain visible and have deferral details
  it('2. keeps deferred pilgrims visible with deferral count, reason, and last attempt timestamp', () => {
    const rawPilgrims = [
      {
        id: 'p-def',
        fullName: 'Deferred Devotee',
        age: 50,
        metadata: JSON.stringify({
          taskIndex: 1,
          taskStatus: 'PENDING',
          deferralCount: 2,
          attemptCount: 2,
          deferredAt: '2026-11-27T12:30:00Z',
          lastAttemptedAt: '2026-11-27T12:30:00Z',
          lastFailureReason: 'You are already having Pending Booking(s) for the Same Slot',
          lastErrorCode: 'WISHLIST_DEFERRED',
        }),
      },
    ];

    const { enrichedPilgrims } = enrichPilgrimsWithQueueStatus(rawPilgrims, { status: 'WATCHING', pilgrimCount: 1 });
    const p = enrichedPilgrims[0];

    expect(p.fullName).toBe('Deferred Devotee');
    expect(p.deferralCount).toBe(2);
    expect(p.attemptCount).toBe(2);
    expect(p.lastFailureReason).toContain('Pending Booking(s)');
    expect(p.deferredAt).toBe('2026-11-27T12:30:00Z');
    // Still in rotation
    expect(p.statusKey).toBe('NEXT_IN_QUEUE'); // Sole candidate becomes next in queue
  });

  // 3. Confirmed pilgrims show confirmation details and are excluded from queue position
  it('3. confirmed pilgrims show reference/tx id and are excluded from active queue positions', () => {
    const rawPilgrims = [
      {
        id: 'p-conf-1',
        fullName: 'Confirmed Devotee',
        metadata: {
          taskIndex: 1,
          taskStatus: 'CONFIRMED',
          officialBookingReference: 'TXN-998822',
          confirmedAt: '2026-11-27T11:45:00Z',
        },
      },
      {
        id: 'p-unconf',
        fullName: 'Waiting Devotee',
        metadata: { taskIndex: 2, taskStatus: 'PENDING' },
      },
    ];

    const { enrichedPilgrims } = enrichPilgrimsWithQueueStatus(rawPilgrims, { status: 'WATCHING', pilgrimCount: 2 });
    const conf = enrichedPilgrims.find((p) => p.id === 'p-conf-1')!;
    const unconf = enrichedPilgrims.find((p) => p.id === 'p-unconf')!;

    expect(conf.statusKey).toBe('CONFIRMED');
    expect(conf.officialBookingReference).toBe('TXN-998822');
    expect(conf.confirmedAt).toBe('2026-11-27T11:45:00Z');
    expect(conf.queuePosition).toBeUndefined(); // Excluded from queue position

    expect(unconf.statusKey).toBe('NEXT_IN_QUEUE');
    expect(unconf.queuePosition).toBe(1);
  });

  // 4. Next pilgrim uses exact backend rotation priority order
  it('4. calculates next pilgrim using backend rotation order (unattempted first, then FIFO deferred)', () => {
    const pilgrims = [
      {
        id: 'p-1',
        fullName: 'Pilgrim 1',
        metadata: { taskIndex: 1, deferralCount: 1, deferredAt: '2026-11-27T10:00:00Z' },
      },
      {
        id: 'p-2',
        fullName: 'Pilgrim 2',
        metadata: { taskIndex: 2, deferralCount: 1, deferredAt: '2026-11-27T10:05:00Z' },
      },
      {
        id: 'p-3',
        fullName: 'Pilgrim 3',
        metadata: { taskIndex: 3, deferralCount: 0 }, // Unattempted
      },
      {
        id: 'p-4',
        fullName: 'Pilgrim 4',
        metadata: { taskIndex: 4, deferralCount: 0 }, // Unattempted
      },
    ];

    const sorted = sortUnconfirmedPilgrims(pilgrims);
    const sortedIds = sorted.map((p: any) => p.id);

    // Unattempted P3, P4 first in taskIndex order, then oldest deferred P1, then P2
    expect(sortedIds).toEqual(['p-3', 'p-4', 'p-1', 'p-2']);
  });

  // 5. Full rotation cycle loops back to P1 after all have been deferred once
  it('5. full rotation cycle order loops back to P1 after all have been deferred once', () => {
    const pilgrims = [
      { id: 'p-1', metadata: { taskIndex: 1, deferralCount: 1, deferredAt: '2026-11-27T10:00:00Z' } },
      { id: 'p-2', metadata: { taskIndex: 2, deferralCount: 1, deferredAt: '2026-11-27T10:01:00Z' } },
      { id: 'p-3', metadata: { taskIndex: 3, deferralCount: 1, deferredAt: '2026-11-27T10:02:00Z' } },
      { id: 'p-4', metadata: { taskIndex: 4, deferralCount: 1, deferredAt: '2026-11-27T10:03:00Z' } },
      { id: 'p-5', metadata: { taskIndex: 5, deferralCount: 1, deferredAt: '2026-11-27T10:04:00Z' } },
    ];

    const sorted = sortUnconfirmedPilgrims(pilgrims);
    expect(sorted.map((p: any) => p.id)).toEqual(['p-1', 'p-2', 'p-3', 'p-4', 'p-5']);
  });

  // 6. Parent booking completion is shown only when all pilgrims are confirmed
  it('6. parent booking summary is not marked completed while any pilgrim remains pending or deferred', () => {
    const rawPilgrims = [
      { id: 'p-1', metadata: { taskIndex: 1, taskStatus: 'CONFIRMED', officialBookingReference: 'REF1' } },
      { id: 'p-2', metadata: { taskIndex: 2, taskStatus: 'CONFIRMED', officialBookingReference: 'REF2' } },
      { id: 'p-3', metadata: { taskIndex: 3, deferralCount: 1, taskStatus: 'PENDING' } },
    ];

    const { summary } = enrichPilgrimsWithQueueStatus(rawPilgrims, { status: 'WATCHING', pilgrimCount: 3 });

    expect(summary.totalDevotees).toBe(3);
    expect(summary.confirmedCount).toBe(2);
    expect(summary.deferredCount).toBe(1);
    expect(summary.pendingCount).toBe(0);
    expect(summary.isAllConfirmed).toBe(false);
    expect(summary.isPartiallyConfirmed).toBe(true);
    expect(summary.nextPilgrim?.id).toBe('p-3');
  });

  // 7. Missing or unavailable metadata is handled safely without throwing
  it('7. handles null or malformed metadata safely without crashing', () => {
    const rawPilgrims = [
      { id: 'p-null-meta', fullName: 'Null Meta', metadata: null },
      { id: 'p-string-bad', fullName: 'Bad JSON', metadata: '{malformed json' },
      { id: 'p-empty-obj', fullName: 'Empty Object', metadata: {} },
    ];

    expect(() => {
      const { enrichedPilgrims, summary } = enrichPilgrimsWithQueueStatus(rawPilgrims, { status: 'PENDING', pilgrimCount: 3 });
      expect(enrichedPilgrims.length).toBe(3);
      expect(summary.confirmedCount).toBe(0);
      expect(summary.nextPilgrim?.fullName).toBe('Null Meta');
    }).not.toThrow();
  });
});
