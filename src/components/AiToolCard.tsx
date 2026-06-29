import { motion } from 'framer-motion';

export interface AiTool {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

interface AiToolCardProps {
  tool: AiTool;
  index: number;
}

export function AiToolCard({ tool, index }: AiToolCardProps) {
  return (
    <motion.div
      className={`border-2 rounded-xl p-6 flex flex-col justify-between transition-all relative overflow-hidden bg-black/40 backdrop-blur-sm ${
        tool.isFeatured 
          ? 'border-transparent shadow-[0_0_25px_rgba(0,255,200,0.15)] before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-[#00ffcc] before:via-[#8b5cf6] before:to-[#00f0ff] before:rounded-xl before:-z-10 before:animate-pulse' 
          : 'border-red-500/35 animate-neon-red-pulse'
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ 
        y: -10, 
        borderColor: tool.isFeatured ? 'transparent' : '#ef4444', 
        boxShadow: tool.isFeatured
          ? '0 20px 40px -15px rgba(0,255,200,0.4), 0 0 35px rgba(139,92,246,0.4)'
          : '0 20px 40px -15px rgba(239,68,68,0.4), 0 0 25px rgba(239,68,68,0.2)',
        backgroundColor: 'rgba(255,255,255,0.04)'
      }}
      whileTap={{ scale: 0.99 }}
    >
      {/* 24h Pulsing Neon Glow Ring (Only for Featured cards) */}
      {tool.isFeatured && (
        <span className="absolute -inset-px rounded-xl border-2 border-[#00ffcc] opacity-35 animate-ping pointer-events-none" />
      )}

      {tool.isFeatured && (
        <div className="absolute top-0 right-0 z-20">
          <span className="bg-gradient-to-r from-[#00ffcc] to-[#8b5cf6] text-black text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-bl-lg">
            Featured
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          {tool.imageUrl ? (
            <img src={tool.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white text-[16px] border border-white/10">
              {tool.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-white text-[17px] font-medium tracking-tight">{tool.name}</h3>
            <motion.span 
              className={`inline-block text-[9px] tracking-[0.08em] uppercase font-mono px-2.5 py-0.5 rounded border mt-1 ${
                tool.isFeatured 
                  ? 'text-[#00ffcc] bg-[#00ffcc]/10 border-[#00ffcc]/20'
                  : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
              }`}
              whileHover={{ 
                scale: 1.05, 
                borderColor: tool.isFeatured ? '#00ffcc' : '#ef4444', 
                color: '#ffffff', 
                backgroundColor: tool.isFeatured ? '#00ffcc' : '#ef4444' 
              }}
            >
              {tool.category}
            </motion.span>
          </div>
        </div>

        {/* 텍스트 선명도 고도화: text-white/60 -> text-white/90 */}
        <p className="text-white/90 text-[13.5px] leading-relaxed mb-6 font-light">
          {tool.description}
        </p>
      </div>

      <motion.a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-1.5 w-full h-[40px] rounded-lg font-medium text-[13px] border border-white/20 text-white transition-all ${
          tool.isFeatured 
            ? 'hover:bg-[#00ffcc] hover:text-black hover:border-[#00ffcc]' 
            : 'hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444]'
        }`}
        whileTap={{ scale: 0.98 }}
      >
        Visit Website <i className="bi bi-arrow-up-right text-[11px]" />
      </motion.a>
    </motion.div>
  );
}
