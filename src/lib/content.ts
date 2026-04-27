import { brand } from "@/lib/brand";
import { prisma } from "@/lib/prisma";

export const CMS_KEYS = {
  siteProfile: "site_profile",
  terms: "legal_terms",
  privacy: "legal_privacy",
  policies: "legal_policies",
} as const;

export type SiteProfileContent = {
  name: string;
  legacyText: string;
  phone: string;
  supportPhone: string;
  email: string;
  address: string;
  logoPath: string;
};

export type TermsSection = {
  title: string;
  intro?: string;
  bullets?: string[];
  paragraphs?: string[];
};

export type TermsPageContent = {
  title: string;
  lastUpdated: string;
  sections: TermsSection[];
};

export type PrivacySection = {
  title: string;
  body: string;
};

export type PrivacyPageContent = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: PrivacySection[];
  contactLabel: string;
  email: string;
  phone: string;
};

export type PolicyItem = {
  title: string;
  body?: string;
  lines?: string[];
};

export type PolicySection = {
  title: string;
  items: PolicyItem[];
};

export type PoliciesPageContent = {
  title: string;
  sections: PolicySection[];
};

export const defaultSiteProfile: SiteProfileContent = {
  name: brand.name,
  legacyText: brand.legacyText,
  phone: brand.phone,
  supportPhone: brand.phone,
  email: brand.email,
  address: brand.address,
  logoPath: "/logo.jpeg",
};

export const defaultTermsContent: TermsPageContent = {
  title: "Terms and Conditions",
  lastUpdated: "August 07, 2025",
  sections: [
    {
      title: "1. General Terms and Conditions",
      intro:
        "The following laws govern our terms and conditions. By accessing and using this website, you agree to comply with and be bound by the following terms:",
      bullets: [
        "Engaging in actions that possess the potential to limit the accessibility of our website to other users is strictly forbidden. This includes the uploading or dissemination of unlawful, offensive, or disagreeable material that may infringe upon local, national, or international legislation.",
        "Any unauthorized attacks that interfere with our privacy or business operations are strictly prohibited without the explicit permission of the website administrator.",
        "Unauthorized reproduction, modification, duplication, or analysis of website content is strictly prohibited in accordance with copyright and trademark laws in India and internationally. In the event that any violation is detected, we retain the power to commence legal and criminal proceedings within the appropriate jurisdiction. Non-authorized reproduction of website content or images is strictly prohibited.",
      ],
    },
    {
      title: "2. Indemnity",
      paragraphs: [
        "You indemnify us and agree to keep us indemnified against all liabilities, losses, damages, expenses, and costs (including legal fees and amounts paid in settlement of any demand, action, or claim) arising directly or indirectly from your breach of these terms of sale.",
      ],
    },
    {
      title: "3. Force Majeure",
      intro:
        'We shall not be liable for any failure or delay in performance under these terms of sale due to events beyond our reasonable control (a "Force Majeure Event"). Such events may include, but are not limited to:',
      bullets: [
        "Lack of raw materials, components, or products; power failure, industrial conflicts, governmental regulations, fires, floods, disasters, civil unrest, terrorist attacks, or wars.",
        "Server errors, software difficulties, or other technical issues.",
      ],
      paragraphs: [
        "Our duties under these terms of sale will be suspended during a Force Majeure Event. We guarantee to take reasonable measures to mitigate the effects of any Force Majeure Event.",
      ],
    },
    {
      title: "4. Limited Liability",
      paragraphs: [
        "Our liability for products purchased through our website is strictly limited to the purchase price and the replacement cost of the product only.",
      ],
    },
    {
      title: "5. Governing Laws And The Jurisdiction",
      paragraphs: [
        `We make no claims about the legality of the site's content or its appropriateness for usage in other countries. Anyone accessing the site from outside of our control does so entirely at their own risk, and we will not be held responsible for any harm that our site may cause. The laws of INDIA, except any provisions for choice of law, shall govern any claim pertaining to the Site, the services offered via the Site, or the Content (a "Claim"). You agree, without modification, that the courts located in Delhi shall have exclusive jurisdiction over any and all Claims. A final decision in any such case or proceeding will be final and binding, and it can be used to enforce a judgment in other jurisdictions by litigation or other legal means.`,
      ],
    },
    {
      title: "6. Areas of Authority",
      paragraphs: [
        "The place of execution and performance of this Agreement is Delhi. The laws of India, excluding rules of conflict of law, will govern and interpret this Agreement. The exclusive venue for any litigation involving this Agreement shall be Delhi. The rules specified under Indian law shall govern the resolution of any disputes, and the venue for such resolution shall be Delhi. Regarding the content of this Agreement, the exclusive jurisdiction is with the courts in Delhi.",
      ],
    },
  ],
};

export const defaultPrivacyContent: PrivacyPageContent = {
  title: "Privacy Policy",
  lastUpdated: "August 06, 2025",
  intro:
    "Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.",
  sections: [
    {
      title: "Information Collection",
      body: "We collect your name, contact details, and order-related information when you make a purchase on our website.",
    },
    {
      title: "Use of Data",
      body: "Your information is used to process orders, provide customer support, and improve our services for a better shopping experience.",
    },
    {
      title: "Data Security",
      body: "We implement strict security measures to protect your personal information and do not share it with third parties except for essential order processing.",
    },
    {
      title: "Third-Party Sharing",
      body: "We do not sell or rent your data. Information is shared only with trusted payment processors and delivery partners to fulfill your orders.",
    },
    {
      title: "Your Rights",
      body: "You have the right to access, update, or request deletion of your personal data at any time.",
    },
    {
      title: "Policy Updates",
      body: "We may update this policy occasionally. Any changes will be reflected on this page. We encourage you to review this Privacy Policy periodically to stay informed of updates.",
    },
  ],
  contactLabel: "For privacy-related concerns, please reach out to us:",
  email: "royalopticians1169@gmail.com",
  phone: "+91 9911522006",
};

export const defaultPoliciesContent: PoliciesPageContent = {
  title: "Policies",
  sections: [
    {
      title: "Return and Refund Policy",
      items: [
        {
          title: "Return Charges",
          body: "To return an order due to dissatisfaction, you must pay either INR 200/- or 10% of the order value (whichever is higher). This fee is non-refundable.",
        },
        { title: "Damaged Items", body: "If the product is damaged during transit, you can return it." },
        {
          title: "Unboxing Video Requirement",
          body: "A complete unboxing video is required as proof while receiving your parcel. Without this, return requests will not be accepted. If the parcel is already unboxed, do not accept it from the delivery person.",
        },
        {
          title: "Incorrect Product",
          body: "If you receive a product different from what you ordered at royaloptics.in, we will replace it at no extra cost. However, if the product matches your order, no return or refund will be applicable.",
        },
        {
          title: "Customized Products",
          body: "Customized items such as eyeglasses and contact lenses are non-returnable and non-refundable.",
        },
        { title: "Contact Lenses", body: "Only sealed contact lenses can be returned, and return charges will apply." },
        {
          title: "Refund Policy",
          body: "Refunds apply only to eyewear frames (excluding sunglasses). Return charges will be deducted.",
        },
        {
          title: "Processing Time",
          body: "Inspection of the returned item will take 4 working days. If the claim is valid, the refund will be processed within 3-4 working days.",
        },
        {
          title: "Out-of-Stock Orders",
          body: "If an ordered product is out of stock, we will cancel the order and provide a full refund.",
        },
        {
          title: "Empty Parcel Claims",
          body: "If you receive an empty parcel, a full refund will be issued only if you provide an uninterrupted video clip showing the parcel from receipt to unboxing, including its condition at delivery.",
        },
        { title: "Sale Items", body: "Products purchased on sale are not eligible for return or refund." },
      ],
    },
    {
      title: "Shipping Policy",
      items: [
        {
          title: "Order Processing",
          body: "We require approximately 2-3 working days to complete and pack your order before shipment.",
        },
        { title: "Domestic Shipping (India)", body: "Estimated delivery time is 5-7 working days." },
        { title: "International Shipping", body: "Estimated delivery time is 12-15 working days." },
        { title: "Package Safety", body: "If the package is open or tampered with upon delivery, please do not accept it." },
        {
          title: "Contact & Address",
          lines: [
            "ROYAL OPTICIANS",
            "1169, 6 Tooti Chowk, Main Bazar",
            "Pahar Ganj, New Delhi, Delhi, India - 110055",
          ],
        },
      ],
    },
    {
      title: "Cancellation Policy",
      items: [
        {
          title: "Cancellation Charges",
          body: "If you wish to cancel your order, a cancellation fee of 5% of the invoice amount will be applicable.",
        },
        { title: "Order Processing", body: "Once the order has been processed, cancellation is no longer possible." },
      ],
    },
  ],
};

function isSchemaMismatch(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "P2021" || code === "P2022";
}

async function getContentBlockValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.contentBlock.findUnique({ where: { key }, select: { value: true } });
    if (!row) return fallback;
    return row.value as T;
  } catch (error) {
    if (isSchemaMismatch(error)) return fallback;
    return fallback;
  }
}

export async function getSiteProfile() {
  const raw = await getContentBlockValue<Partial<SiteProfileContent>>(CMS_KEYS.siteProfile, defaultSiteProfile);
  return { ...defaultSiteProfile, ...raw };
}

export async function getTermsContent() {
  return getContentBlockValue<TermsPageContent>(CMS_KEYS.terms, defaultTermsContent);
}

export async function getPrivacyContent() {
  return getContentBlockValue<PrivacyPageContent>(CMS_KEYS.privacy, defaultPrivacyContent);
}

export async function getPoliciesContent() {
  return getContentBlockValue<PoliciesPageContent>(CMS_KEYS.policies, defaultPoliciesContent);
}

