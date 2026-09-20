import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/site/legal-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — C-SPEK MOTORS LTD",
  description:
    "How C-SPEK MOTORS LTD collects, uses, stores and protects your personal information when you use our website or interact with our dealership.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Your privacy matters to us. This Privacy Policy explains what personal information C-SPEK MOTORS LTD collects, how we use it, who we share it with, and the choices and rights you have over your data."
      lastUpdated="21 September 2026"
      sections={[
        {
          id: "introduction",
          heading: "1. Introduction",
          body: (
            <>
              <p>
                C-SPEK MOTORS LTD (&ldquo;C-SPEK MOTORS&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;) is
                committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use,
                disclose and safeguard your information when you visit our website, submit an enquiry, contact us via
                WhatsApp or phone, or purchase a vehicle from us.
              </p>
              <p>
                This Policy applies to information we collect through the Site, in person at our showroom, over the phone,
                via WhatsApp and through any other channel you use to communicate with us. It does not apply to third-party
                websites or services that may be linked from the Site — we encourage you to read the privacy policies of
                any third-party service you interact with.
              </p>
              <p>
                This Policy is published in compliance with the Nigeria Data Protection Act 2023 and the Nigeria Data
                Protection Regulation (NDPR) 2019. By using the Site, you consent to the collection, use and disclosure of
                your information as described in this Policy.
              </p>
            </>
          ),
        },
        {
          id: "information-we-collect",
          heading: "2. Information We Collect",
          body: (
            <>
              <p>We collect information in the following categories:</p>
              <h3>Information you provide directly</h3>
              <ul>
                <li><strong>Contact details</strong> — your name, email address, phone number, WhatsApp number, and any other contact information you provide in enquiry or contact forms.</li>
                <li><strong>Enquiry details</strong> — the vehicle(s) you enquired about, your message, your budget (if shared), and any attachments you upload (such as photos of vehicles you want to sell or trade in).</li>
                <li><strong>Account details</strong> — admin users have an email address and password (stored as a bcrypt hash); the public-facing site does not require accounts.</li>
                <li><strong>Communication records</strong> — when you contact us via WhatsApp, email, phone or social media, we keep a record of the conversation as needed to provide you with service.</li>
              </ul>
              <h3>Information collected automatically</h3>
              <ul>
                <li><strong>Technical data</strong> — IP address, browser type and version, time zone, operating system, and device identifiers.</li>
                <li><strong>Usage data</strong> — pages you visit, the time and date of each visit, time spent on pages, page interaction data (scrolls, clicks), and the referring page.</li>
                <li><strong>Cookies and similar technologies</strong> — see the <a href="#cookies">Cookies section</a> below for details.</li>
              </ul>
              <h3>Information collected from other sources</h3>
              <ul>
                <li><strong>Social media</strong> — if you message us through Facebook, Instagram, TikTok, X (Twitter) or YouTube, we receive the message content and any profile information those platforms share with us.</li>
                <li><strong>Referrals</strong> — if a friend, family member or business partner refers you to us, we may receive your contact details from them so we can follow up.</li>
              </ul>
            </>
          ),
        },
        {
          id: "how-we-use",
          heading: "3. How We Use Your Information",
          body: (
            <>
              <p>We use the information we collect for the following legitimate business purposes:</p>
              <ul>
                <li><strong>To respond to enquiries</strong> — answering your questions about vehicles, providing quotes, scheduling inspections or test drives, and following up on your interest.</li>
                <li><strong>To process sales and deliveries</strong> — managing reservations, deposits, payments, paperwork, registration, and delivery logistics.</li>
                <li><strong>To provide customer support</strong> — addressing questions, complaints, after-sales service requests, and warranty claims.</li>
                <li><strong>To communicate with you</strong> — sending transactional messages (e.g. enquiry confirmations), important account or service notifications, and — only with your explicit consent — marketing communications about new arrivals and promotions.</li>
                <li><strong>To improve the Site and our services</strong> — analysing usage patterns, diagnosing technical issues, and developing new features.</li>
                <li><strong>To prevent fraud and abuse</strong> — verifying identity, detecting suspicious activity, and protecting against malicious use of the Site.</li>
                <li><strong>To comply with legal obligations</strong> — responding to lawful requests from authorities, maintaining records for tax and accounting purposes, and cooperating with law enforcement where required.</li>
                <li><strong>To administer the admin dashboard</strong> — authenticating admin users, logging audit entries of important actions, and securing access to vehicle and customer data.</li>
              </ul>
              <p>
                We process your personal information on the legal bases of contract performance (taking your enquiry and
                processing any sale), legitimate business interests (improving our services, preventing fraud), legal
                obligation (compliance with Nigerian law), and — for marketing communications — your explicit consent.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          heading: "4. How We Share Your Information",
          body: (
            <>
              <p>
                C-SPEK MOTORS does NOT sell your personal information to any third party. We share information only in the
                limited circumstances described below:
              </p>
              <ul>
                <li><strong>Service providers</strong> — we work with trusted providers that support our business operations (e.g. hosting, payment processing, email delivery, WhatsApp Business). These providers process data on our behalf and are bound by confidentiality and data-protection obligations.</li>
                <li><strong>Delivery partners</strong> — when a vehicle is being delivered, we share your name, phone number and delivery address with the transport company so they can complete the delivery.</li>
                <li><strong>Government authorities</strong> — we may disclose information when required by law, court order, or regulation, including to the Nigeria Data Protection Commission (NDPC), Federal Road Safety Corps (FRSC), Nigeria Customs Service, or law-enforcement agencies.</li>
                <li><strong>Business transfers</strong> — if C-SPEK MOTORS is involved in a merger, acquisition or sale of assets, customer information may be transferred as part of that transaction. We will notify you via the Site or by email before your information is transferred under a different privacy policy.</li>
                <li><strong>Consent</strong> — we may share information with any third party when you give us explicit consent to do so.</li>
              </ul>
              <p>
                We do not share your information with social media platforms, advertising networks, or data brokers for
                their own commercial purposes.
              </p>
            </>
          ),
        },
        {
          id: "international-transfers",
          heading: "5. International Data Transfers",
          body: (
            <>
              <p>
                C-SPEK MOTORS is based in Nigeria, but some of our service providers (e.g. cloud hosting, email delivery)
                may process data outside Nigeria. When we transfer your personal information outside Nigeria, we take
                reasonable steps to ensure it is protected by appropriate safeguards — for example, by working only with
                providers that comply with internationally recognised data-protection standards (such as the EU General
                Data Protection Regulation) and that offer Standard Contractual Clauses for cross-border data transfers.
              </p>
              <p>
                By using the Site, you acknowledge that your information may be processed in countries that have different
                data-protection laws from Nigeria. We will continue to apply the protections described in this Policy
                regardless of where your information is processed.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          heading: "6. Cookies & Similar Technologies",
          body: (
            <>
              <p>
                The Site uses cookies and similar technologies (local storage, session storage) to function correctly and to
                improve your experience. Cookies are small text files stored on your device when you visit a website.
              </p>
              <h3>Types of cookies we use:</h3>
              <ul>
                <li><strong>Essential cookies</strong> — required for the Site to function (e.g. keeping you signed in to the admin dashboard, remembering your theme preference). These cannot be disabled.</li>
                <li><strong>Functional cookies</strong> — remember your preferences (e.g. dark/light mode) for a more personalised experience.</li>
                <li><strong>Analytics cookies</strong> — help us understand how visitors use the Site so we can improve it. We do not use third-party advertising cookies.</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Most browsers allow you to refuse cookies or alert
                you when cookies are being sent. Please note that some parts of the Site may not function properly if you
                disable essential cookies.
              </p>
              <p>
                We do not use cookies for advertising, cross-site tracking, or building profiles of your activity across
                other websites.
              </p>
            </>
          ),
        },
        {
          id: "data-security",
          heading: "7. Data Security",
          body: (
            <>
              <p>
                We take the security of your personal information seriously and have implemented appropriate technical,
                organisational and physical safeguards designed to protect it from unauthorised access, alteration,
                disclosure or destruction. These measures include:
              </p>
              <ul>
                <li>HTTPS encryption (TLS 1.2+) for all data transmitted between your browser and our servers;</li>
                <li>Bcrypt password hashing for admin accounts (no plaintext passwords are ever stored);</li>
                <li>JWT-based authentication stored in HTTP-only, SameSite cookies to prevent cross-site scripting attacks;</li>
                <li>CSRF origin checks on all mutating API requests;</li>
                <li>Rate limiting on sensitive endpoints (e.g. login) to prevent brute-force attacks;</li>
                <li>Regular security reviews and prompt patching of identified vulnerabilities;</li>
                <li>Access controls in the admin dashboard — only authorised staff can view customer enquiries and personal data.</li>
              </ul>
              <p>
                No method of transmission over the internet or method of electronic storage is 100% secure. While we strive
                to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute
                security.
              </p>
              <p>
                In the event of a data breach affecting your personal information, we will notify you and the relevant
                regulatory authorities in accordance with the Nigeria Data Protection Act 2023, generally within 72 hours
                of becoming aware of the breach.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          heading: "8. Data Retention",
          body: (
            <>
              <p>
                We retain your personal information only for as long as is necessary to fulfil the purposes for which it
                was collected, including for the purposes of satisfying any legal, regulatory, accounting or reporting
                requirements. Specifically:
              </p>
              <ul>
                <li><strong>Enquiries and contact messages</strong> — retained for up to 24 months after the last interaction, after which they are automatically purged.</li>
                <li><strong>Sales records</strong> — retained for at least 7 years as required by Nigerian tax and company law.</li>
                <li><strong>Admin user accounts</strong> — retained while the user is employed by or contracted with C-SPEK MOTORS, plus 12 months thereafter for audit purposes.</li>
                <li><strong>Audit logs</strong> — retained for a minimum of 24 months.</li>
                <li><strong>Technical and usage data</strong> — retained for up to 12 months.</li>
              </ul>
              <p>
                When your personal information is no longer needed, we will either delete it securely or anonymise it so
                that it can no longer be used to identify you.
              </p>
            </>
          ),
        },
        {
          id: "your-rights",
          heading: "9. Your Data Protection Rights",
          body: (
            <>
              <p>
                Under the Nigeria Data Protection Act 2023 and the NDPR, you have the following rights regarding your
                personal information:
              </p>
              <ul>
                <li><strong>Right of access</strong> — you can request a copy of the personal information we hold about you.</li>
                <li><strong>Right to rectification</strong> — you can ask us to correct any inaccurate or incomplete personal information.</li>
                <li><strong>Right to erasure</strong> — in certain circumstances, you can ask us to delete your personal information (also known as the &ldquo;right to be forgotten&rdquo;).</li>
                <li><strong>Right to restrict processing</strong> — you can ask us to limit how we use your information in certain situations.</li>
                <li><strong>Right to data portability</strong> — you can request a machine-readable copy of your personal information to transfer to another provider.</li>
                <li><strong>Right to object</strong> — you can object to our processing of your information for direct marketing or for reasons relating to your particular situation.</li>
                <li><strong>Right to withdraw consent</strong> — where we rely on your consent to process your data (e.g. for marketing), you can withdraw that consent at any time.</li>
              </ul>
              <p>
                To exercise any of these rights, please <Link href="/contact">contact us</Link> using the details on our
                Contact page. We will respond to your request within 30 days. We may need to verify your identity before
                processing your request.
              </p>
              <p>
                If you are not satisfied with how we have handled your data-protection request, you have the right to
                complain to the Nigeria Data Protection Commission (NDPC) at <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer">ndpc.gov.ng</a>.
              </p>
            </>
          ),
        },
        {
          id: "children",
          heading: "10. Children's Privacy",
          body: (
            <>
              <p>
                Our Site and services are intended for individuals who are at least 18 years old. We do not knowingly
                collect personal information from children under 18. If you believe a child has provided us with personal
                information, please <Link href="/contact">contact us</Link> and we will take steps to delete such
                information promptly.
              </p>
              <p>
                Vehicle purchases in Nigeria require the buyer to be of legal age (18+). We may request proof of age before
                completing a sale where there is any doubt about the buyer&apos;s age.
              </p>
            </>
          ),
        },
        {
          id: "third-party-services",
          heading: "11. Third-Party Services",
          body: (
            <>
              <p>
                The Site integrates with the following third-party services, each of which has its own privacy policy:
              </p>
              <ul>
                <li><strong>WhatsApp Business</strong> — for customer communications. WhatsApp&apos;s privacy policy applies to messages exchanged on that platform.</li>
                <li><strong>Social media platforms</strong> (Facebook, Instagram, TikTok, X, YouTube) — we may link to our profiles on these platforms. When you interact with us there, the respective platform&apos;s privacy policy applies.</li>
                <li><strong>Google Maps</strong> — our contact page may embed a Google Map. Google&apos;s privacy policy applies when you interact with the embedded map.</li>
                <li><strong>Vercel Blob</strong> — used for media storage on production deployments. Vercel&apos;s privacy policy applies to data processed by their service.</li>
              </ul>
              <p>
                We do not use Google Analytics, Facebook Pixel, or any other third-party advertising or analytics trackers.
              </p>
            </>
          ),
        },
        {
          id: "admin-data",
          heading: "12. Admin & Staff Data",
          body: (
            <>
              <p>
                Admin users of the dashboard have additional data-protection considerations:
              </p>
              <ul>
                <li>All admin actions (vehicle creation, edits, deletions, settings changes, login attempts) are recorded in an audit log for security and accountability purposes.</li>
                <li>Audit logs include the admin&apos;s name, ID, IP address (where applicable), timestamp, and a description of the action performed.</li>
                <li>Admins may view their own audit history but cannot delete or modify audit entries.</li>
                <li>Super admins can manage other admin accounts, including deactivation when an admin leaves the company.</li>
                <li>Admin sessions expire after a defined period and require re-authentication.</li>
              </ul>
            </>
          ),
        },
        {
          id: "changes",
          heading: "13. Changes to This Policy",
          body: (
            <>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal
                requirements or other factors. When we do, we will revise the &ldquo;Last updated&rdquo; date at the top of
                this page.
              </p>
              <p>
                For significant changes that affect how we process your data, we will provide a more prominent notice — for
                example, by displaying a notification on the Site or by contacting you directly if we hold your email
                address.
              </p>
              <p>
                We encourage you to review this Policy periodically to stay informed about how we protect your information.
              </p>
            </>
          ),
        },
        {
          id: "contact",
          heading: "14. Contact Us",
          body: (
            <>
              <p>
                If you have any questions, requests or concerns about this Privacy Policy or how we handle your personal
                information, please contact our Data Protection Officer:
              </p>
              <ul>
                <li>By email at the address listed on our <Link href="/contact">Contact page</Link></li>
                <li>By phone at the numbers listed on our Contact page</li>
                <li>By post at the showroom address listed on our Contact page, marked for the attention of the Data Protection Officer</li>
              </ul>
              <p>
                We aim to respond to all data-protection enquiries within 30 days. For urgent matters relating to your
                personal data, please mark your enquiry as &ldquo;Data Protection — Urgent&rdquo;.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
