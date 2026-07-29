/**
 * Privacy Policy — professional template. Structured, complete legal-register text with only
 * genuine fill-in variables left as bracketed fields ([Legal Entity], [Jurisdiction], …).
 * Still a template: must be reviewed and adopted by qualified counsel before final publication.
 */
import { Link } from 'react-router-dom'
import LegalDoc, { Section } from '../components/legal/LegalDoc'

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy">
      <p className="mt-4 text-sm text-gray-600">
        This Privacy Policy describes how <strong>[Braify Legal Entity]</strong> ("Braify", "we",
        "us", or "our") collects, uses, discloses, retains, and protects personal data in connection
        with the Braify platform and related websites, applications, and services (collectively, the
        "Service"). It applies to visitors, account holders and their authorized users, and
        individuals whose personal data is processed through the Service (such as document signers and
        email recipients). This Policy forms part of, and should be read together with, our{' '}
        <Link to="/terms" className="text-accent-600 hover:underline">Terms of Service</Link> and, where
        applicable, the Data Processing Agreement entered into with our customers.
      </p>

      <Section heading="1. Controller and processor roles">
        <p>Braify processes personal data in two capacities. Where we determine the purposes and means
          of processing — for example, in administering user accounts, securing the Service, and our
          own business operations — we act as a <strong>controller</strong>. Where we process personal
          data on behalf of a customer that uses the Service to send documents, collect signatures, or
          deliver email (including data relating to that customer's signers and recipients), we act as
          a <strong>processor</strong>, and that customer is the controller. In our capacity as
          processor, our processing is governed by the applicable Data Processing Agreement, and
          requests from data subjects should be directed to the relevant customer.</p>
      </Section>

      <Section heading="2. Categories of personal data we process">
        <ul>
          <li><strong>Identity and account data:</strong> name, business email address, hashed
            password and password history, multi-factor authentication configuration, organizational
            role, profile details, and preferences.</li>
          <li><strong>Document and electronic-signature data:</strong> documents uploaded to the
            Service and their contents, signer and recipient names and email addresses, signature
            images or typed signatures, and signing metadata (IP address, device/user-agent,
            timestamps, and time zone) that we are required to record to establish the validity and
            integrity of electronic signatures.</li>
          <li><strong>Email and campaign data:</strong> recipient email addresses, message content,
            and engagement events such as opens and link clicks, together with unsubscribe records.</li>
          <li><strong>Technical, security, and audit data:</strong> IP address, device and browser
            information, session identifiers, and immutable audit-log entries recording actions taken
            in the Service.</li>
          <li><strong>Communications data:</strong> information you provide when you contact support,
            request a demonstration, or otherwise correspond with us.</li>
        </ul>
        <p>We do not intentionally collect special categories of data or protected health information
          through the Service. Customers are responsible for not submitting such data unless a written
          agreement expressly permitting it (for example, a Business Associate Agreement) is in place.</p>
      </Section>

      <Section heading="3. How we use personal data and legal bases">
        <p>We process personal data to provide, operate, maintain, and secure the Service; to
          authenticate users and prevent fraud and abuse; to create and preserve electronic-signature
          audit records; to provide support and communicate with you; to comply with legal
          obligations; and to develop and improve the Service. Where the General Data Protection
          Regulation or comparable laws apply, we rely on the following legal bases: performance of a
          contract with you; our legitimate interests in operating and securing the Service, provided
          those interests are not overridden by your rights; compliance with a legal obligation
          (including retention of signing records); and, where required, your consent, which you may
          withdraw at any time without affecting the lawfulness of prior processing.</p>
      </Section>

      <Section heading="4. Disclosure of personal data">
        <p>We disclose personal data only as described in this Policy: to service providers and
          sub-processors that perform functions on our behalf under contract (see Section 5); to a
          customer acting as controller for data we process on its behalf; to professional advisers,
          auditors, and authorities where required to comply with law, enforce our agreements, or
          protect rights, property, and safety; and to a successor entity in connection with a merger,
          acquisition, or sale of assets, subject to this Policy. <strong>We do not sell personal
          data, and we do not share it for cross-context behavioral advertising.</strong></p>
      </Section>

      <Section heading="5. Sub-processors and service providers">
        <p>We engage vetted sub-processors — including cloud hosting, database, object-storage, and
          email-delivery providers — to help deliver the Service. Each sub-processor is bound by
          contractual obligations consistent with this Policy and applicable data-protection law. A
          current list of sub-processors is maintained and made available to customers through our{' '}
          <Link to="/trust" className="text-accent-600 hover:underline">Trust Center</Link>. We remain
          responsible for the processing carried out by our sub-processors.</p>
      </Section>

      <Section heading="6. International data transfers">
        <p>Personal data may be processed in, or transferred to, countries other than the one in which
          it was collected. Where such transfers are subject to data-transfer laws, we implement
          appropriate safeguards, such as the European Commission's Standard Contractual Clauses (and
          the UK Addendum, where applicable) or reliance on an adequacy decision. Details of the
          hosting regions and transfer mechanisms applicable to your data are available on request.</p>
      </Section>

      <Section heading="7. Data retention">
        <p>We retain personal data for as long as necessary to fulfil the purposes described in this
          Policy, to provide the Service, and to comply with our legal, regulatory, tax, accounting,
          and record-keeping obligations. Electronic-signature records and associated audit data are
          retained for the period required to preserve their evidentiary value. When personal data is
          no longer required, we delete it or irreversibly anonymize it. Our retention practices are
          described in our internal data-retention policy, a summary of which is available to
          customers on request.</p>
      </Section>

      <Section heading="8. Your rights">
        <p>Subject to applicable law, you may have the right to access the personal data we hold about
          you; to request correction of inaccurate data; to request erasure; to restrict or object to
          certain processing; to data portability; and, where processing is based on consent, to
          withdraw that consent. You also have the right to lodge a complaint with your local
          supervisory authority. To exercise your rights, contact us at{' '}
          <a href="mailto:privacy@braify.com" className="text-accent-600 hover:underline">privacy@braify.com</a>.
          Where we act as a processor on behalf of a customer, we will refer your request to that
          customer and assist them in responding. We may need to verify your identity before acting on
          a request, and we will respond within the timeframes required by applicable law.</p>
      </Section>

      <Section heading="9. Security">
        <p>We maintain administrative, technical, and organizational measures designed to protect
          personal data against unauthorized access, disclosure, alteration, and destruction. These
          measures include encryption of data in transit and of sensitive data at rest, enforced
          multi-factor authentication, role-based access control, and tamper-evident audit logging. A
          fuller description is available in our{' '}
          <Link to="/trust" className="text-accent-600 hover:underline">Trust Center</Link>. No method
          of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
      </Section>

      <Section heading="10. Cookies and similar technologies">
        <p>We use strictly necessary cookies to operate the Service (for example, to maintain
          authenticated sessions) and, where applicable and with your consent, cookies to understand
          usage and improve the Service. You can control non-essential cookies through the cookie
          controls provided and through your browser settings. Disabling strictly necessary cookies
          may prevent parts of the Service from functioning.</p>
      </Section>

      <Section heading="11. Children's data">
        <p>The Service is intended for business use and is not directed to children. We do not
          knowingly collect personal data from children under the age of 16 (or the age specified by
          applicable local law). If you believe a child has provided us with personal data, please
          contact us so that we can take appropriate action.</p>
      </Section>

      <Section heading="12. Automated decision-making">
        <p>We do not make decisions producing legal or similarly significant effects based solely on
          automated processing of personal data.</p>
      </Section>

      <Section heading="13. Changes to this Policy">
        <p>We may update this Policy from time to time to reflect changes in our practices or for
          legal, operational, or regulatory reasons. We will post the updated Policy with a revised
          "last updated" date and, where the changes are material, provide additional notice as
          required by law. Your continued use of the Service after the effective date constitutes
          acceptance of the updated Policy.</p>
      </Section>

      <Section heading="14. Contact us">
        <p>If you have questions or concerns about this Policy or our processing of personal data,
          contact <a href="mailto:privacy@braify.com" className="text-accent-600 hover:underline">privacy@braify.com</a>,
          or write to <strong>[Braify Legal Entity, registered address]</strong>. Where required, our
          Data Protection Officer and EU/UK representative can be reached at{' '}
          <strong>[DPO / representative contact]</strong>.</p>
      </Section>
    </LegalDoc>
  )
}
