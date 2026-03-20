import { CheckCircle2, Sun, Star, Calendar, LayoutDashboard } from 'lucide-react'
import { motion } from 'motion/react'
import { loginUrl } from './config'

const features = [
  { icon: Sun, title: 'My Day', description: 'Focus on what matters today. Start fresh every morning.' },
  { icon: Star, title: 'Important', description: 'Flag tasks that can\'t wait. Never lose sight of priorities.' },
  { icon: Calendar, title: 'Planned', description: 'Schedule ahead with due dates and stay one step ahead.' },
  { icon: LayoutDashboard, title: 'Dashboard', description: 'See your progress at a glance with live stats and insights.' },
]

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <CheckCircle2 className="w-6 h-6" />
          FocusFlow
        </div>
        <a
          href={loginUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Sign in
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-4xl mx-auto w-full gap-16">
        <section className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground"
          >
            <CheckCircle2 className="w-4 h-4" />
            Simple. Focused. Yours.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Get things done,<br />
            <span className="opacity-40">one day at a time.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-xl"
          >
            FocusFlow helps you organise your tasks, track your progress, and stay on top of your day — without the noise.
          </motion.p>

          <motion.a
            href={loginUrl}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity shadow-lg"
          >
            <GoogleIcon />
            Continue with Google
          </motion.a>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-6 rounded-2xl border border-border bg-card text-left"
            >
              <div className="p-2.5 rounded-xl bg-secondary flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </motion.section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FocusFlow. All rights reserved.
      </footer>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
