"use client";

import { useState } from "react";
import { 
  CreditCard, History, Receipt, Download, 
  ExternalLink, CheckCircle2, AlertCircle, 
  ArrowUpRight, Printer, Wallet, Info
} from "lucide-react";

export default function FinancePortal() {
  const [activeTab, setActiveTab] = useState("summary");

  const FEE_BREAKDOWN = [
    { id: 1, item: "Academic Fees", amount: 2450.00, status: "Paid" },
    { id: 2, item: "Residential Fees (Hostel)", amount: 1200.00, status: "Pending" },
    { id: 3, item: "SRC/NUGS Dues", amount: 150.00, status: "Paid" },
    { id: 4, item: "ICT Services & Library", amount: 300.00, status: "Paid" },
  ];

  const TRANSACTIONS = [
    { id: "TX-9921", date: "Mar 10, 2026", method: "GCB Bank", amount: 2900.00, type: "Academic/ICT", status: "Verified" },
    { id: "TX-8840", date: "Jan 15, 2026", method: "Mobile Money", amount: 150.00, type: "SRC Dues", status: "Verified" },
  ];

  const totalOwed = 1200.00;
  const totalPaid = 2900.00;

  return (
    <div className="h-full flex flex-col space-y-6 font-roboto animate-in fade-in duration-700">
      
      {/* 1. FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-uenr-brown rounded-[2.5rem] p-8 text-white shadow-xl shadow-maroon-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Outstanding Balance</p>
            <h2 className="text-3xl font-black font-lato tracking-tight">GHS {totalOwed.toLocaleString()}.00</h2>
            <button className="mt-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
              Generate Reference <ArrowUpRight size={14} />
            </button>
          </div>
          <Wallet className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid (Sem 1)</p>
            <h2 className="text-3xl font-black font-lato text-slate-900 tracking-tight">GHS {totalPaid.toLocaleString()}.00</h2>
          </div>
          <div className="flex items-center gap-2 text-uenr-green mt-4">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Verified by Finance Office</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center space-y-2">
           <AlertCircle size={24} className="text-uenr-gold" />
           <p className="text-[11px] font-bold text-slate-600 leading-tight">Deadline for Final<br/>Payment: <span className="text-uenr-brown">April 30, 2026</span></p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        
        {/* 2. FEE BREAKDOWN (LEFT/CENTER) */}
        <section className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fees Breakdown</h2>
            <button className="text-[10px] font-black text-uenr-brown uppercase flex items-center gap-1 hover:underline">
              <Printer size={12} /> Print Provisional Invoice
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
            <div className="overflow-y-auto custom-scrollbar">
              {FEE_BREAKDOWN.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between p-6 border-b border-slate-50 last:border-none group">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${fee.status === 'Paid' ? 'bg-green-50 text-uenr-green' : 'bg-red-50 text-red-500'}`}>
                      {fee.status === 'Paid' ? <CheckCircle2 size={20} /> : <Receipt size={20} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-lato">{fee.item}</h4>
                      <p className={`text-[9px] font-black uppercase tracking-tighter ${fee.status === 'Paid' ? 'text-uenr-green' : 'text-red-400'}`}>
                        {fee.status}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-900 font-lato tracking-tight">GHS {fee.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. PAYMENT HISTORY (RIGHT) */}
        <aside className="flex flex-col min-h-0 space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">History</h2>
          <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:border-uenr-brown/20 transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black text-uenr-brown uppercase tracking-widest mb-1">{tx.id}</p>
                      <h4 className="text-xs font-bold text-slate-800 font-lato">{tx.method}</h4>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-uenr-brown transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{tx.date}</p>
                    <p className="text-xs font-black text-slate-900 font-lato">GHS {tx.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 rounded-2xl bg-slate-100/50 border border-slate-200 flex items-start gap-3">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">
                  Payments may take up to <span className="text-uenr-brown font-black">24 hours</span> to reflect on the portal after bank verification.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}