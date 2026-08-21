import { motion as Motion } from "framer-motion";
import Footer from "../components/Footer";
import PrismaticBurst from '../PrismaticBurst';

export default function LandingPage() {
  const scrollToHowTo = () => {
    const section = document.getElementById("how-to-use");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">

      <div className="fixed inset-0 -z-10">
        <PrismaticBurst
          animationType="rotate3d"
          intensity={4}
          speed={0.5}
          distort={1.0}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={24}
          mixBlendMode="lighten"
          colors={['#9100FC', '#0008FC', '#00D6FC']}
        />
      </div>

      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome to FilesGPT
          </h1>
          <p className="max-w-2xl text-white mb-8 text-lg md:text-xl">
            Upload PDFs, images, or websites and start asking questions directly about their content.
            Get instant answers and chat with your documents.
          </p>

          <div className="flex gap-4">
            <button
              onClick={scrollToHowTo}
              className="bg-white/5 hover:bg-black/10 hover:border-y-sky-500 hover:border-x-purple-600 text-sky-500 border-x-2 border-y-2 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-md border border-white/10 transition"
            >
              How to Use
            </button>
          </div>
        </div>
      </section>

      <section id="how-to-use" className="relative z-10 py-20 px-6 md:px-20 text-center mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          How to Use FilesGPT
        </h2>
        <p className="max-w-3xl mx-auto text-white text-lg mb-10">
          Simple steps to get started with FilesGPT in seconds.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { title: "Upload", text: "Upload your files or links easily." },
            { title: "Chat", text: "Ask anything, like chatting with a friend." },
            { title: "Get Insights", text: "Get instant answers & summaries." },
          ].map((item, i) => (
            <Motion.div
              key={i}
              className="p-6 bg-black/55 rounded-3xl backdrop-blur-sm border border-white/20"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            >
              <h3 className="text-2xl font-semibold text-sky-500 mb-2">{item.title}</h3>
              <p className="text-white">{item.text}</p>
            </Motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
