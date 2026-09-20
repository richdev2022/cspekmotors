import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/site/legal-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions — C-SPEK MOTORS LTD",
  description:
    "The terms and conditions that govern your use of the C-SPEK MOTORS LTD website and the enquiries, purchases and services we provide.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These terms govern your use of the C-SPEK MOTORS LTD website and the enquiries, quotes and purchases you make through us. Please read them carefully — by using this website, you agree to be bound by them."
      lastUpdated="21 September 2026"
      sections={[
        {
          id: "acceptance",
          heading: "1. Acceptance of Terms",
          body: (
            <>
              <p>
                By accessing or using the C-SPEK MOTORS LTD website (the &ldquo;Site&rdquo;), browsing our vehicle listings,
                submitting an enquiry, or otherwise interacting with our services, you confirm that you have read,
                understood and agree to be bound by these Terms &amp; Conditions (&ldquo;Terms&rdquo;) and our{" "}
                <Link href="/privacy">Privacy Policy</Link>. If you do not agree with any part of these Terms, please
                discontinue use of the Site immediately.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you (&ldquo;you&rdquo;, &ldquo;your&rdquo; or
                &ldquo;the user&rdquo;) and C-SPEK MOTORS LTD, a company registered in Nigeria (&ldquo;C-SPEK MOTORS&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;). If you are entering into these Terms on behalf of
                a company or other legal entity, you represent that you have the authority to bind that entity to these Terms.
              </p>
            </>
          ),
        },
        {
          id: "use-of-site",
          heading: "2. Use of the Site",
          body: (
            <>
              <p>
                C-SPEK MOTORS grants you a personal, non-exclusive, non-transferable, revocable licence to access and use
                the Site for lawful, personal and non-commercial purposes. You may not use the Site in any way that could
                damage, disable, overburden, or impair the Site or interfere with any other party&apos;s use and enjoyment
                of it.
              </p>
              <p>You agree NOT to:</p>
              <ul>
                <li>Use the Site in violation of applicable local, national or international law;</li>
                <li>Attempt to gain unauthorised access to any part of the Site, other accounts, or computer systems or networks connected to the Site;</li>
                <li>Introduce or attempt to introduce any virus, trojan, worm, logic bomb or other malicious material;</li>
                <li>Scrape, copy, or republish large portions of the Site&apos;s content (vehicle listings, photographs, descriptions) without our prior written consent;</li>
                <li>Use automated scripts, bots, crawlers or similar tools to extract data from the Site, except for search engine indexing conducted in good faith;</li>
                <li>Submit false, misleading or fraudulent enquiries, or use the enquiry forms to send unsolicited communications;</li>
                <li>Impersonate any other person or entity, or misrepresent your affiliation with a person or entity.</li>
              </ul>
              <p>
                We may modify, suspend or discontinue any part of the Site at any time, with or without notice. We may also
                impose limits on certain features of the Site or restrict access to parts or all of the Site without notice
                or liability.
              </p>
            </>
          ),
        },
        {
          id: "vehicle-listings",
          heading: "3. Vehicle Listings & Pricing",
          body: (
            <>
              <p>
                The vehicle information, photographs, videos and descriptions displayed on this Site are provided for general
                informational purposes only. While we make every reasonable effort to ensure the information is accurate and
                up to date, we make no warranties or representations of any kind, express or implied, about the completeness,
                accuracy, reliability, suitability or availability of any vehicle listing.
              </p>
              <p>
                Prices displayed (where shown) are subject to change without prior notice. Vehicle availability is not
                guaranteed until a formal order has been placed and a deposit received. We reserve the right to correct any
                errors or omissions in pricing or vehicle information, and to cancel or refuse any order based on such errors.
              </p>
              <p>
                Vehicle specifications, features, colours and trim options may vary from those shown in photographs. We
                encourage all prospective buyers to physically inspect any vehicle of interest, or to request a live video
                inspection, before committing to a purchase.
              </p>
            </>
          ),
        },
        {
          id: "enquiries",
          heading: "4. Enquiries & Communications",
          body: (
            <>
              <p>
                When you submit an enquiry through the Site, you consent to C-SPEK MOTORS contacting you using the details
                you provided (email, phone, or WhatsApp). We may respond to your enquiry, share vehicle information, provide
                quotes, or follow up on your interest in our vehicles.
              </p>
              <p>
                You agree to provide accurate, current and complete information in all enquiry forms and to keep your contact
                information updated. We reserve the right to suspend or ignore enquiries that contain false, abusive,
                threatening, or otherwise inappropriate content.
              </p>
              <p>
                By initiating a WhatsApp conversation with us, you acknowledge that WhatsApp is a third-party service and
                that its own terms and privacy policy apply to your use of that platform.
              </p>
            </>
          ),
        },
        {
          id: "purchases",
          heading: "5. Purchases, Deposits & Payments",
          body: (
            <>
              <p>
                A vehicle is considered reserved for you only after we have confirmed the reservation in writing and received
                the agreed deposit. Verbal commitments, enquiries or expressions of interest do not constitute a binding
                reservation or sale.
              </p>
              <p>
                Deposits are generally non-refundable except where required by applicable Nigerian consumer protection law,
                or where C-SPEK MOTORS is unable to deliver the vehicle as described. Refunds, where applicable, will be
                processed using the original payment method within 14 working days.
              </p>
              <p>
                Full payment must be received and cleared before vehicle handover or delivery. We accept bank transfers and
                other payment methods as agreed in writing. Cash payments above limits set by Nigerian law must be declared
                and may be refused.
              </p>
              <p>
                Any taxes, levies, registration fees, insurance, transport or delivery charges are the responsibility of the
                buyer unless explicitly stated otherwise in the invoice.
              </p>
            </>
          ),
        },
        {
          id: "warranties",
          heading: "6. Vehicle Condition & Warranties",
          body: (
            <>
              <p>
                Unless otherwise stated in writing on the invoice, vehicles are sold on an &ldquo;as-is, where-is&rdquo;
                basis. We disclose all known material defects at the point of sale and encourage pre-purchase inspections by
                independent mechanics of the buyer&apos;s choice.
              </p>
              <p>
                Manufacturer warranties, where applicable, are transferred to the buyer subject to the manufacturer&apos;s
                own terms and conditions. C-SPEK MOTORS makes no representation regarding the continued validity or scope
                of any manufacturer warranty.
              </p>
              <p>
                Any extended warranty or service package sold separately will be documented in a separate written agreement
                that forms part of the purchase contract.
              </p>
            </>
          ),
        },
        {
          id: "delivery",
          heading: "7. Delivery & Risk of Loss",
          body: (
            <>
              <p>
                For customers requesting delivery, the risk in the vehicle passes to the buyer upon physical handover at our
                showroom, or upon collection by the delivery agent on the buyer&apos;s behalf. C-SPEK MOTORS is not liable
                for any damage, loss or delay occurring during third-party transport, except where caused by our own
                negligence.
              </p>
              <p>
                Delivery timescales are estimates only and may be affected by factors outside our control, including weather,
                road conditions, security checkpoints and regulatory inspections. We will communicate proactively with you
                throughout the delivery process.
              </p>
            </>
          ),
        },
        {
          id: "intellectual-property",
          heading: "8. Intellectual Property",
          body: (
            <>
              <p>
                All content on this Site — including but not limited to the C-SPEK MOTORS LTD name, logos, trademarks,
                vehicle photographs, videos, descriptions, page layouts, graphics and text — is the property of C-SPEK
                MOTORS LTD or its licensors and is protected by Nigerian and international copyright, trademark and other
                intellectual property laws.
              </p>
              <p>
                You may not reproduce, distribute, modify, transmit, reuse, download or use any of the Site&apos;s content
                for commercial purposes without our prior written consent. Limited, non-commercial personal use is permitted.
              </p>
              <p>
                Vehicle trademarks, brand names and model designations shown on this Site remain the property of their
                respective owners and are used here for identification and informational purposes only.
              </p>
            </>
          ),
        },
        {
          id: "user-content",
          heading: "9. User-Submitted Content",
          body: (
            <>
              <p>
                If you submit content to the Site — for example through the contact form, WhatsApp, or any reviews or
                testimonials — you grant C-SPEK MOTORS a non-exclusive, royalty-free, perpetual, irrevocable, worldwide
                licence to use, reproduce, modify, publish, translate and distribute that content in connection with our
                business operations and marketing.
              </p>
              <p>
                You represent and warrant that any content you submit is your own original work or that you have the necessary
                rights to grant the licence above, and that the content does not infringe the rights of any third party.
              </p>
            </>
          ),
        },
        {
          id: "limitation-of-liability",
          heading: "10. Limitation of Liability",
          body: (
            <>
              <p>
                To the maximum extent permitted by applicable law, C-SPEK MOTORS LTD, its directors, employees, affiliates
                and partners shall not be liable for any indirect, incidental, special, consequential or punitive damages,
                including without limitation loss of profits, data, use, goodwill, or other intangible losses, resulting
                from your access to or use of (or inability to access or use) the Site or any vehicle purchased through us.
              </p>
              <p>
                Our total liability for any claim arising out of or relating to these Terms or the Site shall not exceed the
                greater of (a) the amount you have paid us through the Site in the six (6) months preceding the claim, or
                (b) ₦100,000 (one hundred thousand Nigerian Naira).
              </p>
              <p>
                Nothing in these Terms shall limit or exclude any liability that cannot be limited or excluded under
                applicable Nigerian law, including liability for death or personal injury caused by negligence, or for
                fraud or fraudulent misrepresentation.
              </p>
            </>
          ),
        },
        {
          id: "indemnification",
          heading: "11. Indemnification",
          body: (
            <>
              <p>
                You agree to indemnify, defend and hold harmless C-SPEK MOTORS LTD, its directors, employees, affiliates
                and partners from any claim, demand, loss, damage, cost or expense (including reasonable legal fees) arising
                out of or relating to your breach of these Terms, your misuse of the Site, your violation of any law or the
                rights of any third party, or any content you submit to the Site.
              </p>
            </>
          ),
        },
        {
          id: "third-party-links",
          heading: "12. Third-Party Links & Services",
          body: (
            <>
              <p>
                The Site may contain links to third-party websites, social media platforms and services (such as WhatsApp,
                Facebook, Instagram, YouTube) that are not owned or controlled by C-SPEK MOTORS. We have no control over
                and assume no responsibility for the content, privacy policies or practices of any third-party site or
                service.
              </p>
              <p>
                You acknowledge and agree that C-SPEK MOTORS shall not be liable for any damage or loss caused by your use
                of any third-party site or service. We encourage you to read the terms and privacy policies of any
                third-party service you interact with.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          heading: "13. Changes to These Terms",
          body: (
            <>
              <p>
                We reserve the right to modify these Terms at any time. When we do, we will revise the &ldquo;Last
                updated&rdquo; date at the top of this page. We may also provide notice of significant changes through a
                prominent notice on the Site or via direct communication with users who have submitted enquiries.
              </p>
              <p>
                Your continued use of the Site following the posting of any changes constitutes acceptance of those changes.
                You are therefore encouraged to review these Terms periodically.
              </p>
            </>
          ),
        },
        {
          id: "governing-law",
          heading: "14. Governing Law & Dispute Resolution",
          body: (
            <>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of
                Nigeria, without regard to its conflict of law provisions.
              </p>
              <p>
                Any dispute, claim or controversy arising out of or relating to these Terms or the use of the Site shall
                first be attempted to be resolved through good-faith negotiations between the parties. If the dispute
                cannot be resolved within thirty (30) days, it shall be submitted to the exclusive jurisdiction of the
                competent courts of Lagos State, Nigeria.
              </p>
            </>
          ),
        },
        {
          id: "contact",
          heading: "15. Contact Us",
          body: (
            <>
              <p>
                If you have any questions, comments or concerns about these Terms &amp; Conditions, please contact us:
              </p>
              <ul>
                <li>By email at the address listed on our <Link href="/contact">Contact page</Link></li>
                <li>By phone at the numbers listed on our Contact page</li>
                <li>By post at the showroom address listed on our Contact page</li>
              </ul>
              <p>
                We aim to respond to all legitimate enquiries within two (2) business days.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
