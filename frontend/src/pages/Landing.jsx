import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function Landing() {
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // page-wide scroll, drives the decorative floating blob independently of the hero
  const { scrollY } = useScroll();
  const blobY = useTransform(scrollY, [0, 3000], [0, 1200]);
  const blobRotate = useTransform(scrollY, [0, 3000], [0, 180]);

  return (
    <div className="bg-gray-950 text-white relative">
      {/* decorative floating blob — purely visual, sits behind everything */}
      <motion.div
        style={{ y: blobY, rotate: blobRotate }}
        className="pointer-events-none fixed top-20 right-[-100px] w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 blur-3xl -z-10"
      />

      {/* HERO */}
      <section
        ref={heroRef}
        className="h-screen flex items-center justify-center relative overflow-hidden"
      >
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="text-center px-6"
        >
          {isAuthenticated ? (
            <>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 pb-2 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Good to see you again.
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Your dashboard's ready — see what's changed since you last
                checked in.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-block bg-indigo-500 hover:bg-indigo-400 transition-colors px-8 py-3 rounded-full font-medium"
              >
                Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 pb-2 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Know where your money
                <br />
                actually goes.
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Scan receipts, track spending, and let a real model forecast
                next month — before it surprises you.
              </p>
              <Link
                to="/register"
                className="inline-block bg-indigo-500 hover:bg-indigo-400 transition-colors px-8 py-3 rounded-full font-medium"
              >
                Get Started Free
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* FEATURE SECTIONS */}
      <FeatureSection
        title="Scan any receipt"
        description="Snap a photo. Our OCR model reads the merchant, date, and total — you just confirm."
        align="left"
      />
      <FeatureSection
        title="See it all in one place"
        description="Every transaction, categorized and searchable, with a dashboard that actually makes sense."
        align="right"
      />
      <FeatureSection
        title="Forecast before it happens"
        description="A model trained on your own history predicts next month's spend, category by category."
        align="left"
      />

      {/* CTA */}
      <section className="min-h-[60vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {isAuthenticated ? (
            <>
              <h2 className="text-4xl font-bold mb-6">
                Ready to see this month's numbers?
              </h2>
              <button
                onClick={() => navigate("/forecasts")}
                className="inline-block bg-white text-gray-950 hover:bg-gray-200 transition-colors px-8 py-3 rounded-full font-medium"
              >
                View your forecasts
              </button>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold mb-6">
                Ready to see where it's going?
              </h2>
              <Link
                to="/register"
                className="inline-block bg-white text-gray-950 hover:bg-gray-200 transition-colors px-8 py-3 rounded-full font-medium"
              >
                Create your free account
              </Link>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
}

function FeatureSection({ title, description, align }) {
  const isLeft = align === "left";
  return (
    <section className="min-h-[70vh] flex items-center px-6 md:px-24">
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`max-w-lg ${isLeft ? "" : "ml-auto text-right"}`}
      >
        <h3 className="text-3xl md:text-4xl font-semibold mb-4">{title}</h3>
        <p className="text-gray-400 text-lg">{description}</p>
      </motion.div>
    </section>
  );
}

export default Landing;
