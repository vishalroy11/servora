import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Get in Touch with Servora</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Have inquiries regarding service verification, provider partnerships, or order assistance? Our team is available 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Headquarters</h3>
            <p className="text-xs text-slate-600 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              100 Tech Enterprise Way, Suite 400<br />Silicon Valley, CA 94025
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Support Channels</h3>
            <p className="text-xs text-slate-600 flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
              support@servora.com
            </p>
            <p className="text-xs text-slate-600 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
              +1 (800) 555-SERV
            </p>
          </div>
        </div>

        <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Message Received!</h3>
              <p className="text-xs text-slate-500">Thank you for reaching out. A Servora specialist will reply within 2 business hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we assist you with our service platform?"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
