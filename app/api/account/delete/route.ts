import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function step(name: string, fn: () => Promise<{ count: number } | void>) {
  try {
    const result = await fn();
    const count = result && 'count' in result ? result.count : '—';
    console.log(`[delete-account] ${name}:`, count);
  } catch (err) {
    console.error(`[delete-account] ${name} failed:`, err);
    // best-effort: continue deleting remaining records
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  console.log('[delete-account] starting deletion for userId:', userId);

  // Sequential deletes — no $transaction (not supported in Neon HTTP mode).
  // Order respects FK constraints: children before parents.

  // 1. PhotoLikes by user (userId has no onDelete on this model)
  await step('photoLike', () => prisma.photoLike.deleteMany({ where: { userId } }));

  // 2. PlacePhotos by user — cascade deletes other users' likes on these photos
  await step('placePhoto', () => prisma.placePhoto.deleteMany({ where: { userId } }));

  // 3. Other users' CuratedListSaves on this user's lists + this user's own saves
  await step('curatedListSave (own)', () => prisma.curatedListSave.deleteMany({ where: { userId } }));

  const userLists = await prisma.curatedList.findMany({
    where: { creatorId: userId },
    select: { id: true },
  });
  const listIds = userLists.map((l) => l.id);
  if (listIds.length > 0) {
    await step('curatedListSave (others\' on user lists)', () =>
      prisma.curatedListSave.deleteMany({ where: { listId: { in: listIds } } })
    );
    await step('curatedListItem', () =>
      prisma.curatedListItem.deleteMany({ where: { listId: { in: listIds } } })
    );
  }

  // 4. CuratedLists by user
  await step('curatedList', () => prisma.curatedList.deleteMany({ where: { creatorId: userId } }));

  // 5. Saves by user (userId has no onDelete on this model)
  await step('save', () => prisma.save.deleteMany({ where: { userId } }));

  // 6. Recommendations sent/received
  await step('recommendation', () =>
    prisma.recommendation.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    })
  );

  // 7. Friendships sent/received
  await step('friendship', () =>
    prisma.friendship.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    })
  );

  // 8. Follows
  await step('follow', () =>
    prisma.follow.deleteMany({
      where: { OR: [{ followerId: userId }, { followingId: userId }] },
    })
  );

  // 9. Visits
  await step('visit', () => prisma.visit.deleteMany({ where: { userId } }));

  // 10. Badges
  await step('badge', () => prisma.badge.deleteMany({ where: { userId } }));

  // 11. VibeVotes
  await step('vibeVote', () => prisma.vibeVote.deleteMany({ where: { userId } }));

  // 12. MobileAuthTokens
  await step('mobileAuthToken', () => prisma.mobileAuthToken.deleteMany({ where: { userId } }));

  // 13. BusinessClaims
  await step('businessClaim', () => prisma.businessClaim.deleteMany({ where: { userId } }));

  // 14. FeaturedPlacements (userId has no onDelete on this model)
  await step('featuredPlacement', () => prisma.featuredPlacement.deleteMany({ where: { userId } }));

  // 15. Sessions
  await step('session', () => prisma.session.deleteMany({ where: { userId } }));

  // 16. OAuth Accounts
  await step('account', () => prisma.account.deleteMany({ where: { userId } }));

  // 17. User record — this must succeed; if it fails the account isn't deleted
  try {
    await prisma.user.delete({ where: { id: userId } });
    console.log('[delete-account] user deleted');
  } catch (error) {
    console.error('[delete-account] user.delete failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', detail: (error as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
