import React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon,
  UserMultiple02Icon,
  Upload04Icon,
  Login01Icon,
  Mail01Icon
} from "@hugeicons/core-free-icons"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FA] font-sans flex flex-col">
      {/* Navigation Bar */}
      <nav className="h-20 bg-white flex items-center justify-between px-8 lg:px-16 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[15px] text-[#0A0A0A] leading-none tracking-tight">FIX THE SIX</span>
            <span className="font-extrabold text-[15px] text-[#0A0A0A] leading-none tracking-tight mt-0.5">LOGO HERE</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <Link href="#" className="text-[14px] font-semibold text-[#525252] hover:text-[#0A0A0A] transition-colors">Program Overview</Link>
          <Link href="#" className="text-[14px] font-semibold text-[#525252] hover:text-[#0A0A0A] transition-colors">Documentation</Link>
          <Link href="#" className="text-[14px] font-semibold text-[#525252] hover:text-[#0A0A0A] transition-colors">Help Center</Link>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-10 px-5 rounded-[6px] border border-[#E2E8F0] bg-white text-[14px] font-semibold text-[#0A0A0A] hover:bg-[#F8FAFC] transition-colors">
            Contact Us
          </button>
          <button className="h-10 px-5 rounded-[6px] bg-[#2E90FA] text-white text-[14px] font-semibold hover:bg-[#1C7FE6] transition-colors">
            Admin Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 px-8 lg:px-24 py-16 lg:py-0 overflow-hidden relative">
        {/* Soft background glow */}
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E0F2FE] rounded-full blur-[100px] opacity-60 pointer-events-none" />

        <div className="w-full lg:w-1/2 max-w-[500px] flex flex-col gap-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#E1F3FE] rounded-full px-3 py-1.5 w-fit border border-[#BEE5FE]">
            <div className="size-2 rounded-full bg-[#1AA1F5]" />
            <span className="text-[10px] font-bold text-[#1AA1F5] tracking-widest uppercase">Admin Gateway</span>
          </div>

          <h1 className="text-[56px] lg:text-[72px] font-black text-[#0B1527] leading-[1.05] tracking-[-0.03em] mt-2">
            Welcome,<br />
            <span className="text-[#3BB4F6]">Admin.</span>
          </h1>

          <p className="text-[17px] text-[#556987] leading-[1.6] max-w-[420px] font-medium mt-1">
            Please log in to manage the gift card program. FixThe6ix provides the tools you need to track donations and support the community efficiently.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button className="h-[46px] px-6 rounded-[8px] bg-[#3182F6] text-white text-[15px] font-semibold hover:bg-[#2072E8] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(49,130,246,0.25)]">
              <HugeiconsIcon icon={Login01Icon} strokeWidth={2.5} className="size-5" />
              Admin Login
            </button>
            <button className="h-[46px] px-6 rounded-[8px] bg-white border border-[#E2E8F0] text-[#0B1527] text-[15px] font-medium hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all flex items-center justify-center gap-2 shadow-[0_2px_8px_0_rgba(0,0,0,0.02)]">
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2.5} className="size-5" />
              Contact Support
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[600px] relative z-10 flex justify-center lg:justify-end">
          {/* Dashboard abstract illustration */}
          <div className="w-full max-w-[580px] aspect-[4/3] bg-[#0F172A] rounded-[24px] shadow-2xl overflow-hidden border border-[#334155] p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="size-8 rounded-[8px] bg-[#1E293B] border border-[#334155] flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-[#475569] rounded-sm" />
              </div>
              <div className="flex-1 max-w-[120px] h-3 rounded-full bg-[#334155]" />
              <div className="size-8 rounded-full bg-[#1E293B]" />
              <div className="w-16 h-8 rounded-[6px] bg-[#1E293B]" />
            </div>

            <div className="flex gap-4 mt-2 flex-1">
              {/* Sidebar */}
              <div className="w-32 flex flex-col gap-3">
                <div className="h-8 rounded-[6px] bg-[#38BDF8] px-3 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-white" />
                  <div className="h-1.5 w-12 bg-white/80 rounded-full" />
                </div>
                <div className="h-8 rounded-[6px] bg-[#1E293B] px-3 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#475569]" />
                  <div className="h-1.5 w-12 bg-[#475569] rounded-full" />
                </div>
                <div className="h-8 rounded-[6px] bg-[#1E293B] px-3 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#475569]" />
                </div>
              </div>

              {/* Main Grid area */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-[88px] rounded-[14px] bg-[#1C2538] border border-[#2D3748] p-4 flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                      <div className="w-6 h-1 bg-[#3A455C] rounded-full" />
                      <div className="flex flex-col gap-2">
                        <div className="w-10 h-2 bg-[#3A455C] rounded-full" />
                        <div className="w-14 h-3 bg-[#33B5F7] rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart area */}
                <div className="flex-1 border border-[#2D3748] bg-[#1C2538]/60 rounded-[14px] p-5 flex flex-col relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  <div className="w-32 h-1.5 bg-[#4A5568] rounded-full mb-3" />
                  <div className="w-20 h-1.5 bg-[#3A455C] rounded-full" />

                  {/* Abstract bars */}
                  <div className="flex items-end justify-center gap-5 h-full mt-4 absolute bottom-0 left-0 right-0 px-8">
                    <div className="w-[38px] h-[52px] bg-[#2D3748] rounded-t-[4px]" />
                    <div className="w-[38px] h-[72px] bg-[#222E42] rounded-t-[4px]" />
                    <div className="w-[38px] h-[110px] bg-[#33B5F7] rounded-t-[4px] shadow-[0_-10px_30px_rgba(51,181,247,0.4)] relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-t-[4px]" />
                    </div>
                    <div className="w-[38px] h-[72px] bg-[#1A202C] rounded-t-[4px]" />
                    <div className="w-[38px] h-[52px] bg-[#2D3748] rounded-t-[4px]" />
                  </div>

                  <div className="absolute top-5 right-5 flex gap-1.5">
                    <div className="size-[5px] bg-[#4A5568] rounded-full" />
                    <div className="size-[5px] bg-[#4A5568] rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-12 bg-[#1E293B] rounded-[8px] flex items-center px-4 mt-auto">
              <div className="flex flex-col gap-1.5">
                <div className="w-12 h-1.5 bg-[#38BDF8] rounded-full" />
                <div className="w-16 h-1 bg-[#475569] rounded-full" />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="bg-white py-20 px-8 lg:px-24">
        <h2 className="text-[32px] font-bold text-[#0A0A0A] mb-12 relative inline-block">
          System Overview
          <div className="absolute -bottom-3 left-0 w-16 h-1 bg-[#38BDF8] rounded-full" />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow">
            <div className="size-12 rounded-[12px] bg-[#F0F9FF] flex items-center justify-center mb-6">
              <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2.5} className="text-[#0284C7] size-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#0A0A0A] mb-3">Track Cards</h3>
            <p className="text-[15px] text-[#525252] leading-relaxed">
              Securely monitor the full inventory lifecycle and real-time distribution status of donated gift cards across the network.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow">
            <div className="size-12 rounded-[12px] bg-[#F0F9FF] flex items-center justify-center mb-6">
              <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2.5} className="text-[#0284C7] size-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#0A0A0A] mb-3">Manage Users</h3>
            <p className="text-[15px] text-[#525252] leading-relaxed">
              Granular access control for volunteers and staff. Assign roles and permissions to ensure system integrity and security.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#E2E8F0] p-8 rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow">
            <div className="size-12 rounded-[12px] bg-[#F0F9FF] flex items-center justify-center mb-6">
              <HugeiconsIcon icon={Upload04Icon} strokeWidth={2.5} className="text-[#0284C7] size-6" />
            </div>
            <h3 className="text-[20px] font-bold text-[#0A0A0A] mb-3">Export Data</h3>
            <p className="text-[15px] text-[#525252] leading-relaxed">
              Generate comprehensive CSV or PDF reports for impact analysis, auditing requirements, and program performance reviews.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-8 px-8 lg:px-24 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-[#2E90FA] text-white font-black text-[12px] size-5 rounded-[4px] flex items-center justify-center">
              <span className="text-[10px]">&lt;/&gt;</span>
            </div>
            <span className="font-black text-[15px] text-[#0A0A0A] tracking-wider">FIXTHE6IX</span>
          </div>
          <p className="text-[12px] text-[#737373]">
            Empowering communities through gift card redistribution.
          </p>
        </div>

        <div className="flex items-center gap-8">
          <Link href="#" className="text-[13px] font-medium text-[#737373] hover:text-[#0A0A0A] transition-colors">Privacy Policy</Link>
          <Link href="#" className="text-[13px] font-medium text-[#737373] hover:text-[#0A0A0A] transition-colors">Terms of Service</Link>
          <Link href="#" className="text-[13px] font-medium text-[#737373] hover:text-[#0A0A0A] transition-colors">Internal Wiki</Link>
        </div>

        <p className="text-[13px] text-[#737373] text-right">
          &copy; 2024 FixThe6ix. Admin Portal v2.4.0
        </p>
      </footer>
    </div>
  )
}
