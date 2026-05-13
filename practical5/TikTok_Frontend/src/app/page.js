import VideoFeed from '../components/ui/VideoFeed';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <VideoFeed feedType="forYou" />
    </main>
  );
}


