import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import PayPalCheckoutButton from './payment/PayPalCheckoutButton';
import { PRODUCTS } from '../lib/paypal';

interface SubmitToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  initialPlan?: 'standard' | 'express' | 'featured';
}

export function SubmitToolModal({ isOpen, onClose, userId, initialPlan = 'standard' }: SubmitToolModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('productivity');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<'standard' | 'express' | 'featured'>(initialPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paypalDetails, setPaypalDetails] = useState<any>(null);

  // Sync initial plan when prop changes
  useEffect(() => {
    if (isOpen) {
      setPlan(initialPlan);
      setPaymentCompleted(false);
    }
  }, [initialPlan, isOpen]);

  const handlePayPalSuccess = useCallback((details: any) => {
    setPaypalDetails(details);
    setPaymentCompleted(true);
    alert('✅ Payment Authorized! Now complete your submission.');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url || !description || !email) {
      alert('Please fill out all fields.');
      return;
    }

    if (plan !== 'standard' && !paymentCompleted) {
      alert('Please complete the PayPal payment for premium plans first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'ai_tools'), {
        name,
        url,
        category,
        description,
        email,
        plan,
        userId: userId || 'anonymous',
        status: plan === 'standard' ? 'pending' : 'approved', // Express/Featured gets auto-approved or priority queue
        createdAt: new Date().toISOString(),
        paymentId: paypalDetails?.id || null,
        isFeatured: plan === 'featured',
      });
      alert('🎉 Submission successful! Thank you.');
      onClose();
      // Reset state
      setName('');
      setUrl('');
      setDescription('');
      setEmail('');
      setPlan('standard');
      setPaymentCompleted(false);
      setPaypalDetails(null);
    } catch (err) {
      console.error('Error adding tool: ', err);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductForPlan = () => {
    if (plan === 'express') return PRODUCTS[0];
    if (plan === 'featured') return PRODUCTS[1];
    return null;
  };

  const currentProduct = getProductForPlan();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ fontFamily: '"Space Mono", monospace' }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors border-none bg-transparent text-[20px] cursor-pointer"
            >
              ×
            </button>

            <h2 className="text-white text-[24px] font-light tracking-tight mb-6">
              Submit Your AI Tool
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Tool Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-white/40 uppercase tracking-wider">Tool Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ChatGPT"
                  className="bg-white/5 border border-white/10 rounded-lg h-11 px-4 text-white text-[14px] focus:outline-none focus:border-white/35 transition-colors"
                />
              </div>

              {/* Website URL */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-white/40 uppercase tracking-wider">Website URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-white/5 border border-white/10 rounded-lg h-11 px-4 text-white text-[14px] focus:outline-none focus:border-white/35 transition-colors"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-white/40 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg h-11 px-4 text-white text-[14px] focus:outline-none focus:border-white/35 transition-colors"
                >
                  <option value="productivity" className="bg-[#0a0a0c]">Productivity</option>
                  <option value="image" className="bg-[#0a0a0c]">Image & Art</option>
                  <option value="chatbot" className="bg-[#0a0a0c]">Chatbot & Writing</option>
                  <option value="developer" className="bg-[#0a0a0c]">Developer Tools</option>
                  <option value="marketing" className="bg-[#0a0a0c]">Marketing & SEO</option>
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-white/40 uppercase tracking-wider">One-line Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize what your tool does in 100 characters..."
                  rows={2}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-white text-[14px] focus:outline-none focus:border-white/35 transition-colors resize-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-white/40 uppercase tracking-wider">Contact Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="bg-white/5 border border-white/10 rounded-lg h-11 px-4 text-white text-[14px] focus:outline-none focus:border-white/35 transition-colors"
                />
              </div>

              {/* Package Selection */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[12px] text-white/40 uppercase tracking-wider">Select Submission Plan</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <motion.div
                    onClick={() => { setPlan('standard'); setPaymentCompleted(false); }}
                    className={`border-2 p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                      plan === 'standard' ? 'border-white/50 bg-white/[0.04]' : 'border-white/10 bg-transparent'
                    }`}
                    whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <h4 className="text-white text-[14px]">Standard</h4>
                      <p className="text-[11px] text-white/45 mt-1 leading-normal font-sans">
                        Indexed in 3-4 weeks. Normal queue.
                      </p>
                    </div>
                    <span className="text-white text-[15px] mt-4 font-mono">Free</span>
                  </motion.div>

                  <motion.div
                    onClick={() => { setPlan('express'); setPaymentCompleted(false); }}
                    className={`border-2 p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                      plan === 'express' ? 'border-white/50 bg-white/[0.04]' : 'border-white/10 bg-transparent'
                    }`}
                    whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <h4 className="text-white text-[14px]">Express</h4>
                      <p className="text-[11px] text-white/45 mt-1 leading-normal font-sans">
                        Indexed in 24 hours. Priority queue.
                      </p>
                    </div>
                    <span className="text-white text-[15px] mt-4 font-mono">$29.00</span>
                  </motion.div>

                  <motion.div
                    onClick={() => { setPlan('featured'); setPaymentCompleted(false); }}
                    className={`border-2 p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                      plan === 'featured' ? 'border-white/50 bg-white/[0.04]' : 'border-white/10 bg-transparent'
                    }`}
                    whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <h4 className="text-white text-[14px]">Featured</h4>
                      <p className="text-[11px] text-white/45 mt-1 leading-normal font-sans">
                        Express Indexing + Top-featured for 7 days.
                      </p>
                    </div>
                    <span className="text-white text-[15px] mt-4 font-mono">$79.00</span>
                  </motion.div>
                </div>
              </div>

              {/* PayPal Payment Area */}
              {(plan === 'express' || plan === 'featured') && (
                <div className="border border-white/10 rounded-xl p-4 bg-white/[0.01] flex flex-col gap-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-white/70">Payment Required:</span>
                    <span className="text-[16px] text-white font-mono">{currentProduct?.price} USD</span>
                  </div>
                  {paymentCompleted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-[13px] text-center">
                      ✓ Payment authorized successfully. You can now submit.
                    </div>
                  ) : (
                    currentProduct && (
                      <PayPalCheckoutButton
                        product={currentProduct}
                        onSuccess={handlePayPalSuccess}
                        onError={(err) => alert(`PayPal Error: ${err}`)}
                      />
                    )
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (plan !== 'standard' && !paymentCompleted)}
                className="h-[50px] w-full bg-white text-black font-semibold rounded-lg mt-4 cursor-pointer hover:bg-[#e2e2e6] transition-colors disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed text-[15px]"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Submission'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
