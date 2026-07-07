import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { appConfig } from "@/config/app";
import finzeeLogo from "@/assets/finzee-logo.png";

const PERSONAS = [
  { 
    key: "ava", 
    title: "Ava — Gen Z Student", 
    blurb: "Overdraft guardrails, credit hygiene, micro-nudges",
    avatar: "/demo/ava-avatar.png",
  },
  { 
    key: "maya", 
    title: "Maya — Freelancer", 
    blurb: "Irregular income, tax set-asides, buffer savings",
    avatar: "/demo/maya-avatar.png",
  },
  { 
    key: "jason", 
    title: "Jason — New Dad", 
    blurb: "Stable salary, budget rebalancing, baby prep",
    avatar: "/demo/jason-avatar.png",
  },
];

const getLink = (persona: string) => 
  `/share/${persona}?code=${encodeURIComponent(appConfig.viewerCode)}`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export default function DemoChooser() {
  return (
    <main className="min-h-screen bg-muted px-4 py-8">
      {/* Header */}
      <motion.header 
        className="mx-auto max-w-3xl mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src={finzeeLogo} alt={appConfig.brandName} className="h-10 w-auto" />
        </Link>
      </motion.header>

      <motion.h1 
        className="text-3xl md:text-4xl font-bold text-center text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Start {appConfig.brandName} Demo
      </motion.h1>
      <motion.p 
        className="text-center text-muted-foreground mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Pick a persona to explore a pre-wired prototype.
      </motion.p>

      <motion.div 
        className="mx-auto mt-6 grid max-w-3xl gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {PERSONAS.map((persona) => (
          <motion.div
            key={persona.key}
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              to={getLink(persona.key)}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-lg hover:border-primary/30 transition-shadow block"
            >
              <Avatar className="h-12 w-12 ring-2 ring-background shadow-md">
                <AvatarImage src={persona.avatar} alt={persona.title} />
                <AvatarFallback>{persona.key.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-lg font-semibold text-foreground">{persona.title}</div>
                <div className="text-sm text-muted-foreground">{persona.blurb}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.p 
        className="text-xs text-muted-foreground text-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        These links open the full demo experience (read-only data). No signup required.
      </motion.p>
    </main>
  );
}
