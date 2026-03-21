import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';


export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('[delete-account] starting deletion for userId:', userId);

    await prisma.$transaction(async (tx) => {
      // Step 1: PhotoLikes by this user (no onDelete on userId — must delete first)
      const photoLikes = await tx.photoLike.deleteMany({ where: { userId } });
      console.log('[delete-account] step 1 photoLike:', photoLikes.count);

      // Step 2: PlacePhotos by this user — cascades to PhotoLikes on those photos
      // (other users' likes on this user's photos are handled by the cascade)
      const placePhotos = await tx.placePhoto.deleteMany({ where: { userId } });
      console.log('[delete-account] step 2 placePhoto:', placePhotos.count);

      // Step 3: CuratedListSaves by this user
      const listSaves = await tx.curatedListSave.deleteMany({ where: { userId } });
      console.log('[delete-account] step 3 curatedListSave:', listSaves.count);

      // Step 4: CuratedListItems for this user's lists (cascade would also handle
      // this, but explicit deletion avoids any constraint issues)
      const userLists = await tx.curatedList.findMany({
        where: { creatorId: userId },
        select: { id: true },
      });
      const listIds = userLists.map((l) => l.id);
      if (listIds.length > 0) {
        // Also delete other users' saves of this user's lists
        const otherSaves = await tx.curatedListSave.deleteMany({
          where: { listId: { in: listIds } },
        });
        console.log('[delete-account] step 4a other curatedListSaves:', otherSaves.count);

        const listItems = await tx.curatedListItem.deleteMany({
          where: { listId: { in: listIds } },
        });
        console.log('[delete-account] step 4b curatedListItem:', listItems.count);
      }

      // Step 5: CuratedLists by this user
      const lists = await tx.curatedList.deleteMany({ where: { creatorId: userId } });
      console.log('[delete-account] step 5 curatedList:', lists.count);

      // Step 6: Saves by this user (no onDelete on userId — must delete explicitly)
      const saves = await tx.save.deleteMany({ where: { userId } });
      console.log('[delete-account] step 6 save:', saves.count);

      // Step 7: Recommendations sent/received by this user
      // (Save.recommendationId is optional — SetNull default handles any remaining refs)
      const recommendations = await tx.recommendation.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });
      console.log('[delete-account] step 7 recommendation:', recommendations.count);

      // Step 8: Friendships sent/received
      const friendships = await tx.friendship.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });
      console.log('[delete-account] step 8 friendship:', friendships.count);

      // Step 9: Follows
      const follows = await tx.follow.deleteMany({
        where: { OR: [{ followerId: userId }, { followingId: userId }] },
      });
      console.log('[delete-account] step 9 follow:', follows.count);

      // Step 10: Visits
      const visits = await tx.visit.deleteMany({ where: { userId } });
      console.log('[delete-account] step 10 visit:', visits.count);

      // Step 11: Badges
      const badges = await tx.badge.deleteMany({ where: { userId } });
      console.log('[delete-account] step 11 badge:', badges.count);

      // Step 12: VibeVotes
      const vibeVotes = await tx.vibeVote.deleteMany({ where: { userId } });
      console.log('[delete-account] step 12 vibeVote:', vibeVotes.count);

      // Step 13: MobileAuthTokens
      const mobileTokens = await tx.mobileAuthToken.deleteMany({ where: { userId } });
      console.log('[delete-account] step 13 mobileAuthToken:', mobileTokens.count);

      // Step 14: BusinessClaims
      const businessClaims = await tx.businessClaim.deleteMany({ where: { userId } });
      console.log('[delete-account] step 14 businessClaim:', businessClaims.count);

      // Step 15: FeaturedPlacements (no onDelete on userId — must delete explicitly)
      const featuredPlacements = await tx.featuredPlacement.deleteMany({ where: { userId } });
      console.log('[delete-account] step 15 featuredPlacement:', featuredPlacements.count);

      // Step 16: Sessions
      const sessions = await tx.session.deleteMany({ where: { userId } });
      console.log('[delete-account] step 16 session:', sessions.count);

      // Step 17: OAuth Accounts
      const accounts = await tx.account.deleteMany({ where: { userId } });
      console.log('[delete-account] step 17 account:', accounts.count);

      // Step 18: Delete the User
      await tx.user.delete({ where: { id: userId } });
      console.log('[delete-account] step 18 user deleted');
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[delete-account] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', detail: (error as Error).message },
      { status: 500 }
    );
  }
}
