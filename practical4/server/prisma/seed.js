const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('../node_modules/@types/pg')
const bcrypt = require('bcrypt')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// These are real public videos that will actually play
const sampleVideos = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
]

async function main() {
  console.log('🌱 Starting seed...')

  await prisma.commentLike.deleteMany()
  await prisma.videoLike.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.video.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  const users = []
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: await bcrypt.hash('password123', 10),
        name: `User ${i}`,
        bio: `Hi, I'm User ${i}! I love making videos.`,
        avatar: `https://i.pravatar.cc/150?img=${i}`,
      },
    })
    users.push(user)
  }
  console.log(`👤 Created ${users.length} users`)

  const videos = []
  for (const user of users) {
    for (let v = 1; v <= 5; v++) {
      const video = await prisma.video.create({
        data: {
          title: `Video ${v} by ${user.username}`,
          description: `This is video number ${v} from ${user.username}. #tiktok #fun`,
          videoUrl: sampleVideos[(v - 1) % sampleVideos.length],
          thumbnail: `https://picsum.photos/seed/${user.id * 10 + v}/400/700`,
          userId: user.id,
        },
      })
      videos.push(video)
    }
  }
  console.log(`🎬 Created ${videos.length} videos`)

  let commentCount = 0
  for (const video of videos.slice(0, 20)) {
    for (let c = 0; c < 3; c++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      await prisma.comment.create({
        data: {
          text: [`Great video! 🔥`, `Love this! ❤️`, `So funny 😂`, `Amazing content!`, `Keep it up! 👏`][c % 5],
          userId: randomUser.id,
          videoId: video.id,
        },
      })
      commentCount++
    }
  }
  console.log(`💬 Created ${commentCount} comments`)

  let likeCount = 0
  for (const video of videos) {
    const likers = users.slice(0, Math.floor(Math.random() * 8) + 1)
    for (const liker of likers) {
      await prisma.videoLike.create({
        data: { userId: liker.id, videoId: video.id },
      }).catch(() => {})
      likeCount++
    }
  }
  console.log(`❤️  Created ${likeCount} video likes`)

  let followCount = 0
  for (const user of users) {
    const toFollow = users.filter(u => u.id !== user.id).slice(0, 4)
    for (const target of toFollow) {
      await prisma.follow.create({
        data: { followerId: user.id, followingId: target.id },
      }).catch(() => {})
      followCount++
    }
  }
  console.log(`👥 Created ${followCount} follow relationships`)

  console.log('\n✅ Seed complete!')
  console.log('📧 Login with: user1@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })