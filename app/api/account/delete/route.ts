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

    // Run all deletions in a transaction to respect constraints
    await prisma.$transaction(async (tx: any) => {
      // a) PhotoLikes by userId
      await tx.photoLike.deleteMany({ where: { userId } });
      
      // b) PlacePhotos by userId
      await tx.placePhoto.deleteMany({ where: { userId } });
      
      // c) CuratedListSaves by userId
      await tx.curatedListSave.deleteMany({ where: { userId } });
      
      // d) CuratedListItems where listId is in user's CuratedLists
      const userLists = await tx.curatedList.findMany({
        where: { creatorId: userId },
        select: { id: true }
      });
      const listIds = userLists.map((l: { id: string }) => l.id);
      if (listIds.length > 0) {
        await tx.curatedListItem.deleteMany({
          where: { listId: { in: listIds } }
        });
      }
      
      // e) CuratedLists by creatorId
      await tx.curatedList.deleteMany({ where: { creatorId: userId } });
      
      // f) Recommendations where senderId or receiverId = userId
      await tx.recommendation.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      });
      
      // g) Friendships where senderId or receiverId = userId
      await tx.friendship.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      });
      
      // h) Visits by userId
      await tx.visit.deleteMany({ where: { userId } });
      
      // i) Saves by userId
      await tx.save.deleteMany({ where: { userId } });
      
      // j) Badges by userId
      await tx.badge.deleteMany({ where: { userId } });
      
      // k) MobileAuthTokens by userId
      await tx.mobileAuthToken.deleteMany({ where: { userId } });
      
      // l) BusinessClaims by userId
      await tx.businessClaim.deleteMany({ where: { userId } });
      
      // m) Sessions by userId
      await tx.session.deleteMany({ where: { userId } });
      
      // n) Accounts by userId
      await tx.account.deleteMany({ where: { userId } });
      
      // Follows by userId (missing from specific list but present in schema)
      // Good practice to clear these just in case (though schema has onDelete: Cascade)
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId },
            { followingId: userId }
          ]
        }
      });

      // FeaturedPlacements
      await tx.featuredPlacement.deleteMany({ where: { userId } });

      // VibeVotes
      await tx.vibeVote.deleteMany({ where: { userId } });

      // o) Finally, delete the User record
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
