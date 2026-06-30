"use client";

import * as React from "react";
import { LogoMark } from "@/components/brand/logo";
import { db, getPart, getUser } from "@/mock/db";
import { formatDate } from "@/lib/utils";
import type { Product } from "@/types";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/** Convert a number to Indian-system words (for the amount in words line). */
function inWords(num: number): string {
  num = Math.round(num);
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => (n < 20 ? a[n]! : `${b[Math.floor(n / 10)]}${n % 10 ? " " + a[n % 10] : ""}`);
  const three = (n: number): string => (n >= 100 ? `${a[Math.floor(n / 100)]} Hundred${n % 100 ? " " + two(n % 100) : ""}` : two(n));
  let res = "";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  if (crore) res += `${three(crore)} Crore `;
  if (lakh) res += `${three(lakh)} Lakh `;
  if (thousand) res += `${three(thousand)} Thousand `;
  if (num) res += three(num);
  return res.trim();
}

export function ProjectInvoice({ project }: { project: Product }) {
  const engineer = getUser(project.engineerId);
  const lines = (db().projectBomLines[project.id] ?? [])
    .map((e) => {
      const p = getPart(e.refId);
      if (!p) return null;
      return { part: p, qty: e.qty, rate: p.unitCost, amount: p.unitCost * e.qty };
    })
    .filter(Boolean) as { part: NonNullable<ReturnType<typeof getPart>>; qty: number; rate: number; amount: number }[];

  const materials = lines.reduce((s, l) => s + l.amount, 0);
  const contract = project.msrp; // quoted contract value
  const engineering = Math.max(0, contract - materials);
  const subtotal = materials + engineering;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grand = subtotal + cgst + sgst;
  const piNo = `PI-${project.projectNumber}`;

  return (
    <div className="print-sheet mx-auto w-[210mm] max-w-full bg-white text-zinc-800 shadow-lg">
      <div className="flex flex-col gap-6 p-[14mm] text-[12px] leading-relaxed">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="text-[#0d7a6a]"><LogoMark size={40} /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Innopolis Bio Innovations</h1>
              <p className="text-[11px] text-zinc-500">Plot 14, Genome Valley, Shameerpet, Hyderabad — 500078, India</p>
              <p className="text-[11px] text-zinc-500">GSTIN: 36AABCI1234F1Z5 · CIN: U24290TG2019PTC · www.innopolis.bio</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold uppercase tracking-wide text-zinc-900">Proforma Invoice</h2>
            <table className="mt-1 ml-auto text-[11px]">
              <tbody>
                <tr><td className="pr-3 text-zinc-500">Invoice No.</td><td className="font-semibold">{piNo}</td></tr>
                <tr><td className="pr-3 text-zinc-500">Date</td><td className="font-semibold">{formatDate(new Date())}</td></tr>
                <tr><td className="pr-3 text-zinc-500">Project No.</td><td className="font-semibold">{project.projectNumber}</td></tr>
                <tr><td className="pr-3 text-zinc-500">Revision</td><td className="font-semibold">{project.revision}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill to + project meta */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bill To</p>
            <p className="text-sm font-bold text-zinc-900">{project.customer}</p>
            <p className="text-[11px] text-zinc-500">Plant & Engineering Procurement</p>
            <p className="text-[11px] text-zinc-500">India</p>
            <p className="mt-1 text-[11px] text-zinc-500">GSTIN: 29AAACB0000A1Z0</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Project Details</p>
            <table className="w-full text-[11px]">
              <tbody>
                <tr><td className="py-0.5 pr-3 text-zinc-500">Project</td><td className="font-medium text-zinc-800">{project.name}</td></tr>
                <tr><td className="py-0.5 pr-3 text-zinc-500">Package</td><td className="font-medium text-zinc-800">{project.family} · {project.category}</td></tr>
                <tr><td className="py-0.5 pr-3 text-zinc-500">Lead Engineer</td><td className="font-medium text-zinc-800">{engineer?.name}</td></tr>
                <tr><td className="py-0.5 pr-3 text-zinc-500">Current Stage</td><td className="font-medium text-zinc-800">{project.stage}</td></tr>
                <tr><td className="py-0.5 pr-3 text-zinc-500">Enquiry Date</td><td className="font-medium text-zinc-800">{formatDate(project.releaseDate)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Scope */}
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Scope of Supply</p>
          <p className="text-[11px] text-zinc-600">{project.description}</p>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-zinc-800 text-left text-white">
              <th className="px-2 py-1.5 font-semibold">#</th>
              <th className="px-2 py-1.5 font-semibold">Description</th>
              <th className="px-2 py-1.5 font-semibold">Material Code</th>
              <th className="px-2 py-1.5 text-right font-semibold">Qty</th>
              <th className="px-2 py-1.5 font-semibold">UOM</th>
              <th className="px-2 py-1.5 text-right font-semibold">Rate</th>
              <th className="px-2 py-1.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-zinc-200">
                <td className="px-2 py-1.5 text-zinc-500">{i + 1}</td>
                <td className="px-2 py-1.5 font-medium text-zinc-800">{l.part.name}</td>
                <td className="px-2 py-1.5 font-mono text-[10px] text-zinc-500">{l.part.partNumber}</td>
                <td className="px-2 py-1.5 text-right tabular">{l.qty}</td>
                <td className="px-2 py-1.5 text-zinc-500">{l.part.uom}</td>
                <td className="px-2 py-1.5 text-right tabular">{inr(l.rate)}</td>
                <td className="px-2 py-1.5 text-right font-medium tabular">{inr(l.amount)}</td>
              </tr>
            ))}
            <tr className="border-b border-zinc-200">
              <td className="px-2 py-1.5 text-zinc-500">{lines.length + 1}</td>
              <td className="px-2 py-1.5 font-medium text-zinc-800" colSpan={5}>Engineering, design, fabrication &amp; project management</td>
              <td className="px-2 py-1.5 text-right font-medium tabular">{inr(engineering)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <table className="w-[58%] text-[11px]">
            <tbody>
              <tr><td className="py-1 text-zinc-500">Material supply</td><td className="py-1 text-right tabular">{inr(materials)}</td></tr>
              <tr><td className="py-1 text-zinc-500">Engineering &amp; fabrication</td><td className="py-1 text-right tabular">{inr(engineering)}</td></tr>
              <tr className="border-t border-zinc-300"><td className="py-1 font-semibold text-zinc-800">Sub-total (taxable)</td><td className="py-1 text-right font-semibold tabular">{inr(subtotal)}</td></tr>
              <tr><td className="py-1 text-zinc-500">CGST @ 9%</td><td className="py-1 text-right tabular">{inr(cgst)}</td></tr>
              <tr><td className="py-1 text-zinc-500">SGST @ 9%</td><td className="py-1 text-right tabular">{inr(sgst)}</td></tr>
              <tr className="border-t-2 border-zinc-800 bg-zinc-50">
                <td className="py-1.5 text-sm font-bold text-zinc-900">Grand Total</td>
                <td className="py-1.5 text-right text-sm font-bold tabular text-zinc-900">{inr(grand)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="border-y border-zinc-200 py-2 text-[11px]">
          <span className="font-semibold text-zinc-700">Amount in words: </span>
          <span className="text-zinc-600">Indian Rupees {inWords(grand)} only.</span>
        </p>

        {/* Terms + bank + sign */}
        <div className="grid grid-cols-2 gap-6 text-[10.5px] text-zinc-600">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Terms &amp; Conditions</p>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Payment: 30% advance, 60% against dispatch, 10% on commissioning.</li>
              <li>Delivery: 10–12 weeks from approved drawings &amp; advance.</li>
              <li>Validity: this proforma is valid for 30 days.</li>
              <li>Taxes as applicable at the time of dispatch. Freight &amp; insurance extra.</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bank Details</p>
            <table className="text-[10.5px]">
              <tbody>
                <tr><td className="pr-2 text-zinc-400">Bank</td><td>HDFC Bank, Genome Valley Branch</td></tr>
                <tr><td className="pr-2 text-zinc-400">A/C No.</td><td className="font-mono">501000XXXXXX0042</td></tr>
                <tr><td className="pr-2 text-zinc-400">IFSC</td><td className="font-mono">HDFC0001234</td></tr>
                <tr><td className="pr-2 text-zinc-400">A/C Name</td><td>Innopolis Bio Innovations Pvt Ltd</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-end justify-between pt-8">
          <p className="text-[10px] text-zinc-400">Computer-generated proforma invoice — Innopolis PLM</p>
          <div className="text-center">
            <div className="h-12 w-48 border-b border-zinc-400" />
            <p className="mt-1 text-[11px] font-semibold text-zinc-700">For Innopolis Bio Innovations</p>
            <p className="text-[10px] text-zinc-400">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
