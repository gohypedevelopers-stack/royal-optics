import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { getSiteProfile } from "@/lib/content";

export default async function SiteFooter() {
  const profile = await getSiteProfile();

  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-100">
      <div className="grid w-full gap-8 px-3 py-12 md:grid-cols-4 md:px-4 lg:px-5">
        <div>
          <Image
            src={profile.logoPath || "/logo.jpeg"}
            alt={profile.name}
            width={250}
            height={100}
            className="h-14 w-auto rounded-sm object-contain"
          />
          <p className="mt-2 text-sm leading-6 text-slate-600">Your trusted partner for premium eyewear, lenses, and more.</p>
        </div>

        <div>
          <h4 className="text-[24px] font-semibold text-slate-900">Useful Links</h4>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-700 md:text-base">
            <Link href="/">Home</Link>
            <Link href="/products">Products</Link>
            <Link href="/about">About</Link>
            <Link href="/blogs">Blogs</Link>
          </div>
        </div>

        <div>
          <h4 className="text-[24px] font-semibold text-slate-900">Contact Us</h4>
          <div className="mt-2 space-y-1.5 text-sm text-slate-700 md:text-base">
            <p className="flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 text-blue-700" />
              <span>{profile.address}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={13} className="text-blue-700" /> {profile.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail size={13} className="text-blue-700" /> {profile.email}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-[24px] font-semibold text-slate-900">Policies</h4>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-700 md:text-base">
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/policies">Return & Refund</Link>
          </div>
          <div className="mt-3 flex items-center gap-3 text-slate-700">
            <a href="#" aria-label="Facebook" className="hover:text-blue-600">
              <Facebook size={14} />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-pink-600">
              <Instagram size={14} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 py-3 text-center text-xs text-slate-600 md:text-sm">
        (c) {new Date().getFullYear()} Royal Optics. All Rights Reserved.
      </div>
    </footer>
  );
}
