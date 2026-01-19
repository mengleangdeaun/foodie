import { motion } from "framer-motion";

interface LoadingScreenProps {
  progress: number;
  branchName?: string;
  primaryColor?: string;
}

const LoadingScreen = ({ progress, branchName, primaryColor = '#3b82f6' }: LoadingScreenProps) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="w-full max-w-xs h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${progress}%` }} 
          className="h-full" 
          style={{ backgroundColor: primaryColor }}
        />
      </div>
      <div className="text-center">
        <motion.div
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: primaryColor }}
        >
          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Loading Menu</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{branchName || 'Restaurant'}</p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs text-slate-400 dark:text-slate-500 mt-4"
        >
          {progress}%
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingScreen;