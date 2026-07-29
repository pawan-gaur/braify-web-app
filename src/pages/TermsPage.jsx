/**
 * Terms of Service — professional template. Complete SaaS clause set in legal register with only
 * genuine fill-in variables bracketed. Template: adopt only after review by qualified counsel.
 */
import { Link } from 'react-router-dom'
import LegalDoc, { Section } from '../components/legal/LegalDoc'

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service">
      <p className="mt-4 text-sm text-gray-600">
        These Terms of Service ("Terms") are a binding agreement between{' '}
        <strong>[Braify Legal Entity]</strong> ("Braify", "we", "us") and the individual or entity
        that accesses or uses the Braify platform and related services (the "Service", and the user,
        "you" or "Customer"). By creating an account, accessing, or using the Service, you agree to
        these Terms and to our{' '}
        <Link to="/privacy" className="text-accent-600 hover:underline">Privacy Policy</Link>. If you
        accept these Terms on behalf of an organization, you represent that you are authorized to bind
        that organization.
      </p>

      <Section heading="1. Definitions">
        <ul>
          <li><strong>"Customer Data"</strong> means data, documents, and content that you or your
            authorized users submit to or process through the Service.</li>
          <li><strong>"Authorized Users"</strong> means individuals you permit to use the Service under
            your account.</li>
          <li><strong>"Order"</strong> means an order form, online sign-up, or plan selection that
            references these Terms.</li>
        </ul>
      </Section>

      <Section heading="2. The Service and license">
        <p>Subject to these Terms and payment of applicable fees, Braify grants you a non-exclusive,
          non-transferable, non-sublicensable right to access and use the Service during the
          subscription term for your internal business purposes. We may modify, enhance, or
          discontinue features of the Service, provided we do not materially diminish the core
          functionality of a paid subscription during its term.</p>
      </Section>

      <Section heading="3. Accounts, authorized users, and security">
        <p>You are responsible for configuring your account, for the acts and omissions of your
          Authorized Users, and for maintaining the confidentiality of credentials used to access the
          Service. You will enable and require reasonable security controls, including multi-factor
          authentication where offered, and will promptly notify us of any suspected unauthorized
          access to or use of the Service.</p>
      </Section>

      <Section heading="4. Electronic signatures and electronic records">
        <p>The Service enables the creation and execution of electronic signatures and electronic
          records. By signing a document electronically through the Service, the signer consents to
          transact electronically and agrees that their electronic signature is legally binding and is
          the legal equivalent of a handwritten signature under applicable law, including the U.S.
          Electronic Signatures in Global and National Commerce Act (ESIGN), the Uniform Electronic
          Transactions Act (UETA), and, where applicable, Regulation (EU) No 910/2014 (eIDAS). A signer
          may decline to sign electronically as described during the signing process. You are
          responsible for determining that electronic signatures are appropriate and enforceable for
          your particular transactions and jurisdictions.</p>
      </Section>

      <Section heading="5. Acceptable use">
        <p>You will not, and will not permit others to: (a) use the Service in violation of applicable
          law, including anti-spam, privacy, and export-control laws; (b) send unsolicited bulk email
          or messages to recipients who have not consented or who have unsubscribed; (c) upload
          unlawful, infringing, or malicious content; (d) attempt to gain unauthorized access to, or
          disrupt the integrity or performance of, the Service; (e) reverse engineer or copy the
          Service except as permitted by law; or (f) use the Service to process categories of data
          (such as protected health information) for which a separate written agreement is required
          and not in place.</p>
      </Section>

      <Section heading="6. Customer Data and data protection">
        <p>As between the parties, you retain all rights in Customer Data. You grant Braify a limited
          license to host, process, and transmit Customer Data solely to provide and support the
          Service. You represent that you have all necessary rights and, where required, consents to
          submit Customer Data and to authorize its processing. Where Braify processes personal data
          on your behalf, that processing is governed by the Data Processing Agreement, which is
          incorporated into these Terms by reference and available through our{' '}
          <Link to="/trust" className="text-accent-600 hover:underline">Trust Center</Link>.</p>
      </Section>

      <Section heading="7. Fees and payment">
        <p>You will pay the fees set out in your Order. Except as required by law or expressly stated,
          fees are non-refundable, and you are responsible for applicable taxes. Fees, billing cycles,
          and any usage limits are described in your Order or plan. [Insert billing, renewal, and
          late-payment terms.]</p>
      </Section>

      <Section heading="8. Intellectual property">
        <p>The Service, including all software, documentation, and related intellectual property, is
          and remains the exclusive property of Braify and its licensors. No rights are granted except
          as expressly set out in these Terms. Feedback you provide may be used by Braify without
          restriction or obligation.</p>
      </Section>

      <Section heading="9. Third-party services">
        <p>The Service may interoperate with third-party services (for example, email delivery or
          storage providers). Your use of those services is governed by their own terms, and Braify is
          not responsible for third-party services except as expressly agreed.</p>
      </Section>

      <Section heading="10. Warranties and disclaimers">
        <p>Braify warrants that it will provide the Service with reasonable skill and care. EXCEPT AS
          EXPRESSLY STATED IN THESE TERMS, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", AND
          BRAIFY DISCLAIMS ALL OTHER WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. BRAIFY DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR
          ERROR-FREE.</p>
      </Section>

      <Section heading="11. Limitation of liability">
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, OR
          DATA, ARISING OUT OF OR RELATED TO THESE TERMS. EACH PARTY'S TOTAL AGGREGATE LIABILITY
          ARISING OUT OF OR RELATED TO THESE TERMS WILL NOT EXCEED THE FEES PAID OR PAYABLE BY YOU FOR
          THE SERVICE IN THE [TWELVE (12)] MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM. THESE
          LIMITATIONS DO NOT APPLY TO LIABILITY THAT CANNOT BE LIMITED UNDER APPLICABLE LAW.</p>
      </Section>

      <Section heading="12. Indemnification">
        <p>You will defend, indemnify, and hold harmless Braify from third-party claims arising from
          your Customer Data or your use of the Service in breach of these Terms or applicable law,
          subject to Braify promptly notifying you of the claim and reasonably cooperating in the
          defense. [Insert any Braify IP-infringement indemnity as agreed.]</p>
      </Section>

      <Section heading="13. Term, suspension, and termination">
        <p>These Terms apply for the duration of your subscription. Either party may terminate for
          material breach that remains uncured [thirty (30)] days after written notice. We may suspend
          access where necessary to protect the Service or comply with law, or for non-payment. On
          termination, your right to use the Service ceases and Customer Data is handled in accordance
          with the Privacy Policy and Data Processing Agreement, subject to legally required retention.</p>
      </Section>

      <Section heading="14. Governing law and dispute resolution">
        <p>These Terms are governed by the laws of <strong>[Governing Law / jurisdiction]</strong>,
          without regard to conflict-of-laws rules. The parties submit to the exclusive jurisdiction of
          the courts of <strong>[venue]</strong>, except that either party may seek injunctive relief
          in any court of competent jurisdiction. [Insert any arbitration provision if applicable.]</p>
      </Section>

      <Section heading="15. General">
        <p>These Terms, together with the Privacy Policy, Data Processing Agreement, and any Order,
          constitute the entire agreement between the parties and supersede prior agreements on the
          subject matter. If any provision is held unenforceable, the remaining provisions remain in
          effect. Neither party may assign these Terms without the other's consent, except to a
          successor in connection with a merger or sale of substantially all assets. Neither party is
          liable for delays or failures caused by events beyond its reasonable control. We may update
          these Terms as described in Section 16; the current version is always available at this page.</p>
      </Section>

      <Section heading="16. Changes and contact">
        <p>We may modify these Terms from time to time. Material changes will be notified as required by
          law or your Order, and your continued use after the effective date constitutes acceptance.
          Questions may be directed to{' '}
          <a href="mailto:legal@braify.com" className="text-accent-600 hover:underline">legal@braify.com</a>.</p>
      </Section>
    </LegalDoc>
  )
}
