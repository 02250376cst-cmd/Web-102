const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding process...');

  // Clear existing data
  console.log('Cleaning up existing data...');
  await prisma.commentLike.deleteMany({});
  await prisma.videoLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.video.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database cleaned.');

  // Create 10 users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        name: `User ${i}`,
        bio: `This is the bio for user ${i}`,
        avatar: `https://i.pravatar.cc/150?u=user${i}@example.com`
      }
    });
    users.push(user);
    console.log(`Created user: ${user.username}`);
  }

  // Create 50 videos (5 per user)
  console.log('Creating videos...');
  const videos = [];
  for (const user of users) {
    for (let j = 1; j <= 5; j++) {
      const video = await prisma.video.create({
        data: {
          userId: user.id, // ✅ use actual ID
          caption: `Video ${j} from ${user.username}`,
          videoUrl: `https://example.com/videos/${user.username}_video${j}.mp4`,
          thumbnailUrl: `https://example.com/thumbnails/${user.username}_video${j}.jpg`,
          audioName: `Original Sound - ${user.username}`,
          views: Math.floor(Math.random() * 10000)
        }
      });
      videos.push(video);
      console.log(`Created video: ${video.id}`);
    }
  }

  // Create 200 comments
  console.log('Creating comments...');
  for (let i = 0; i < 200; i++) {
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const comment = await prisma.comment.create({
      data: {
        userId: randomUser.id,
        videoId: randomVideo.id,
        content: `This is comment ${i + 1}. Lorem ipsum dolor sit amet.`
      }
    });
    console.log(`Created comment: ${comment.id}`);
  }

  // Create 300 video likes
  console.log('Creating video likes...');
  const videoLikes = [];
  for (let i = 0; i < 300; i++) {
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const videoId = randomVideo.id;
    const userId = randomUser.id;

    const existingLike = videoLikes.find(like => like.userId === userId && like.videoId === videoId);
    if (!existingLike) {
      try {
        await prisma.videoLike.create({ data: { userId, videoId } });
        videoLikes.push({ userId, videoId });
        console.log(`Created video like: User ${userId} liked Video ${videoId}`);
      } catch {
        console.log(`Skipping duplicate like: User ${userId} -> Video ${videoId}`);
      }
    }
  }

  // Create 150 comment likes
  console.log('Creating comment likes...');
  const comments = await prisma.comment.findMany();
  for (let i = 0; i < 150; i++) {
    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    try {
      await prisma.commentLike.create({
        data: { userId: randomUser.id, commentId: randomComment.id }
      });
      console.log(`Created comment like: User ${randomUser.id} liked Comment ${randomComment.id}`);
    } catch {
      console.log(`Skipping duplicate comment like: User ${randomUser.id} -> Comment ${randomComment.id}`);
    }
  }

  // Create 40 follows
  console.log('Creating follows...');
  for (let i = 0; i < 40; i++) {
    const follower = users[Math.floor(Math.random() * users.length)];
    let following = users[Math.floor(Math.random() * users.length)];
    while (follower.id === following.id) {
      following = users[Math.floor(Math.random() * users.length)];
    }
    try {
      await prisma.follow.create({
        data: { followerId: follower.id, followingId: following.id }
      });
      console.log(`Created follow: User ${follower.id} follows User ${following.id}`);
    } catch {
      console.log(`Skipping duplicate follow: User ${follower.id} -> User ${following.id}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
