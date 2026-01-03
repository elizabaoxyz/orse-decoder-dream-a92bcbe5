import Header from "@/components/terminal/Header";
import DataStream from "@/components/terminal/DataStream";
import { WhaleTracker } from "@/components/whale/WhaleTracker";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col scanlines noise crt-flicker">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <WhaleTracker />
      </div>

      {/* Bottom Data Stream */}
      <DataStream />
    </div>
  );
};

export default Index;
