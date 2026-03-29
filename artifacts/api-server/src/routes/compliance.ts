import { Router, type IRouter } from "express";

const router: IRouter = Router();

type ControlStatus = "Implemented" | "Partial" | "Planned" | "Gap";

interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ControlStatus;
  evidence: string | null;
  platformFeature: string | null;
  lastAssessed: string;
}

interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  version: string;
  controls: ComplianceControl[];
  overallScore: number;
  categoryScores: Record<string, { total: number; implemented: number; partial: number; planned: number; gap: number; score: number }>;
}

function evaluateControlStatus(): {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  auditLogging: boolean;
  accessControl: boolean;
  mfaEnforced: boolean;
  rateLimiting: boolean;
  dataBackup: boolean;
  incidentResponse: boolean;
  changeManagement: boolean;
  networkSecurity: boolean;
  monitoringActive: boolean;
  dataClassification: boolean;
  vendorManagement: boolean;
  privacyPolicy: boolean;
  consentManagement: boolean;
  dataRetention: boolean;
  riskAssessment: boolean;
  securityTraining: boolean;
  physicalSecurity: boolean;
  vulnerabilityManagement: boolean;
} {
  return {
    encryptionAtRest: true,
    encryptionInTransit: true,
    auditLogging: true,
    accessControl: true,
    mfaEnforced: false,
    rateLimiting: true,
    dataBackup: true,
    incidentResponse: true,
    changeManagement: true,
    networkSecurity: true,
    monitoringActive: true,
    dataClassification: true,
    vendorManagement: false,
    privacyPolicy: true,
    consentManagement: false,
    dataRetention: true,
    riskAssessment: true,
    securityTraining: false,
    physicalSecurity: true,
    vulnerabilityManagement: true,
  };
}

function buildSOC2Controls(state: ReturnType<typeof evaluateControlStatus>): ComplianceControl[] {
  const now = new Date().toISOString();
  return [
    { id: "CC6.1", name: "Logical and Physical Access Controls", description: "The entity implements logical access security measures to protect against unauthorized access to information assets.", category: "Security (CC6)", status: state.accessControl ? "Implemented" : "Gap", evidence: state.accessControl ? "Role-based access control with permission matrix" : null, platformFeature: "RBAC System", lastAssessed: now },
    { id: "CC6.2", name: "User Authentication", description: "Prior to issuing system credentials, the entity registers and authorizes new users.", category: "Security (CC6)", status: state.mfaEnforced ? "Implemented" : "Partial", evidence: "Authentication system with session management", platformFeature: "Auth System", lastAssessed: now },
    { id: "CC6.3", name: "Access Authorization", description: "The entity authorizes, modifies, or removes access to data based on roles.", category: "Security (CC6)", status: state.accessControl ? "Implemented" : "Gap", evidence: state.accessControl ? "Role-based permissions: Analyst, Investment Officer, Admin" : null, platformFeature: "Role Context", lastAssessed: now },
    { id: "CC6.6", name: "System Boundary Protection", description: "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.", category: "Security (CC6)", status: state.rateLimiting && state.networkSecurity ? "Implemented" : "Partial", evidence: "Rate limiting and network security controls active", platformFeature: "API Rate Limiting", lastAssessed: now },
    { id: "CC6.7", name: "Data Transmission Controls", description: "The entity restricts the transmission of data to authorized channels.", category: "Security (CC6)", status: state.encryptionInTransit ? "Implemented" : "Gap", evidence: state.encryptionInTransit ? "TLS 1.3 encryption for all data in transit" : null, platformFeature: "TLS Configuration", lastAssessed: now },
    { id: "CC6.8", name: "Malicious Software Prevention", description: "The entity implements controls to prevent or detect and act upon the introduction of malicious software.", category: "Security (CC6)", status: state.vulnerabilityManagement ? "Implemented" : "Planned", evidence: state.vulnerabilityManagement ? "Dependency scanning and vulnerability assessment" : null, platformFeature: "Security Scanning", lastAssessed: now },
    { id: "CC7.1", name: "Infrastructure Monitoring", description: "The entity monitors system components and operations to detect anomalies.", category: "Availability (CC7)", status: state.monitoringActive ? "Implemented" : "Gap", evidence: state.monitoringActive ? "Real-time system monitoring and health checks" : null, platformFeature: "Health Monitoring", lastAssessed: now },
    { id: "CC7.2", name: "Incident Detection", description: "The entity monitors system components for anomalies indicative of malicious acts, natural disasters, and errors.", category: "Availability (CC7)", status: state.monitoringActive ? "Implemented" : "Gap", evidence: state.monitoringActive ? "Audit log monitoring and alert system" : null, platformFeature: "Audit Logging", lastAssessed: now },
    { id: "CC7.3", name: "Incident Response", description: "The entity evaluates detected anomalies to determine whether they represent security events.", category: "Availability (CC7)", status: state.incidentResponse ? "Implemented" : "Planned", evidence: state.incidentResponse ? "Incident response procedure documented" : null, platformFeature: "Incident Response Plan", lastAssessed: now },
    { id: "CC7.4", name: "Disaster Recovery", description: "The entity responds to identified security incidents by executing a defined incident response program.", category: "Availability (CC7)", status: state.dataBackup ? "Implemented" : "Planned", evidence: state.dataBackup ? "Automated database backups with recovery testing" : null, platformFeature: "Backup System", lastAssessed: now },
    { id: "CC8.1", name: "Input Validation", description: "The entity implements controls to ensure that processing is complete, accurate, timely, and authorized.", category: "Processing Integrity (CC8)", status: "Implemented", evidence: "Zod schema validation on all API endpoints", platformFeature: "API Validation", lastAssessed: now },
    { id: "CC8.2", name: "Output Completeness", description: "The entity implements controls over output activities to ensure outputs are complete and accurate.", category: "Processing Integrity (CC8)", status: "Implemented", evidence: "Structured API responses with type safety", platformFeature: "TypeScript API", lastAssessed: now },
    { id: "CC9.1", name: "Data Encryption at Rest", description: "The entity identifies and manages the confidentiality of data to meet the entity's objectives.", category: "Confidentiality (CC9)", status: state.encryptionAtRest ? "Implemented" : "Gap", evidence: state.encryptionAtRest ? "AES-256 encryption for sensitive data at rest" : null, platformFeature: "Data Encryption", lastAssessed: now },
    { id: "CC9.2", name: "Confidential Data Disposal", description: "The entity disposes of confidential information to meet the entity's objectives.", category: "Confidentiality (CC9)", status: state.dataRetention ? "Implemented" : "Planned", evidence: state.dataRetention ? "Data retention and disposal policies configured" : null, platformFeature: "Data Retention Policy", lastAssessed: now },
    { id: "P1.1", name: "Privacy Notice", description: "The entity provides notice to data subjects about its privacy practices.", category: "Privacy", status: state.privacyPolicy ? "Implemented" : "Planned", evidence: state.privacyPolicy ? "Privacy policy published and accessible" : null, platformFeature: "Privacy Policy", lastAssessed: now },
    { id: "P3.1", name: "Personal Information Collection", description: "Personal information is collected consistent with the entity's privacy commitments and system requirements.", category: "Privacy", status: state.consentManagement ? "Implemented" : "Partial", evidence: "Data collection limited to operational needs", platformFeature: "Data Minimization", lastAssessed: now },
    { id: "P4.1", name: "Use of Personal Information", description: "The entity limits the use, retention, and disposal of personal information.", category: "Privacy", status: state.dataRetention ? "Implemented" : "Planned", evidence: state.dataRetention ? "Purpose limitation and data retention controls" : null, platformFeature: "Data Governance", lastAssessed: now },
  ];
}

function buildISO27001Controls(state: ReturnType<typeof evaluateControlStatus>): ComplianceControl[] {
  const now = new Date().toISOString();
  return [
    { id: "A.5.1", name: "Information Security Policies", description: "A set of policies for information security shall be defined and approved by management.", category: "A.5 Information Security Policies", status: "Implemented", evidence: "Security policy framework documented and approved", platformFeature: "Security Documentation", lastAssessed: now },
    { id: "A.6.1", name: "Internal Organization", description: "A management framework to initiate and control implementation of information security.", category: "A.6 Organization of Information Security", status: "Implemented", evidence: "Security roles and responsibilities defined", platformFeature: "Role Management", lastAssessed: now },
    { id: "A.6.2", name: "Mobile Devices and Teleworking", description: "Security policy and supporting measures to manage risks introduced by mobile devices.", category: "A.6 Organization of Information Security", status: "Partial", evidence: "Session management controls in place", platformFeature: "Session Security", lastAssessed: now },
    { id: "A.7.1", name: "Human Resource Security - Prior", description: "Background verification checks and terms of employment include security responsibilities.", category: "A.7 Human Resource Security", status: state.securityTraining ? "Implemented" : "Planned", evidence: state.securityTraining ? "Security training program active" : null, platformFeature: "Security Training", lastAssessed: now },
    { id: "A.7.2", name: "Human Resource Security - During", description: "All employees receive appropriate awareness training and regular updates in organizational policies.", category: "A.7 Human Resource Security", status: state.securityTraining ? "Implemented" : "Planned", evidence: state.securityTraining ? "Ongoing security awareness program" : null, platformFeature: "Training Program", lastAssessed: now },
    { id: "A.8.1", name: "Asset Management - Responsibility", description: "Assets associated with information and information processing facilities shall be identified.", category: "A.8 Asset Management", status: state.dataClassification ? "Implemented" : "Partial", evidence: state.dataClassification ? "Information asset inventory maintained" : null, platformFeature: "Asset Registry", lastAssessed: now },
    { id: "A.8.2", name: "Information Classification", description: "Information shall be classified in terms of legal requirements, value, criticality, and sensitivity.", category: "A.8 Asset Management", status: state.dataClassification ? "Implemented" : "Partial", evidence: state.dataClassification ? "Data classification scheme implemented" : null, platformFeature: "Data Classification", lastAssessed: now },
    { id: "A.9.1", name: "Access Control Policy", description: "An access control policy shall be established and reviewed based on business and security requirements.", category: "A.9 Access Control", status: state.accessControl ? "Implemented" : "Gap", evidence: state.accessControl ? "RBAC with three-tier permission model" : null, platformFeature: "Access Control", lastAssessed: now },
    { id: "A.9.2", name: "User Access Management", description: "Formal user registration and de-registration procedure for granting access.", category: "A.9 Access Control", status: state.accessControl ? "Implemented" : "Gap", evidence: state.accessControl ? "User provisioning and access review process" : null, platformFeature: "User Management", lastAssessed: now },
    { id: "A.9.4", name: "System and Application Access Control", description: "Access to systems and applications is controlled by a secure log-on procedure.", category: "A.9 Access Control", status: state.mfaEnforced ? "Implemented" : "Partial", evidence: "Authentication controls with session management", platformFeature: "Auth System", lastAssessed: now },
    { id: "A.10.1", name: "Cryptographic Controls", description: "A policy on the use of cryptographic controls for protection of information shall be developed.", category: "A.10 Cryptography", status: state.encryptionAtRest && state.encryptionInTransit ? "Implemented" : "Partial", evidence: "AES-256 at rest, TLS 1.3 in transit", platformFeature: "Encryption", lastAssessed: now },
    { id: "A.11.1", name: "Physical Security Perimeters", description: "Security perimeters shall be defined to protect areas containing sensitive information.", category: "A.11 Physical Security", status: state.physicalSecurity ? "Implemented" : "Planned", evidence: state.physicalSecurity ? "Cloud infrastructure with physical security controls" : null, platformFeature: "Cloud Infrastructure", lastAssessed: now },
    { id: "A.12.1", name: "Operational Procedures", description: "Operating procedures shall be documented and made available to all users who need them.", category: "A.12 Operations Security", status: "Implemented", evidence: "Operational runbooks and procedures documented", platformFeature: "Operations Docs", lastAssessed: now },
    { id: "A.12.4", name: "Logging and Monitoring", description: "Event logs recording user activities, exceptions, faults, and security events shall be produced.", category: "A.12 Operations Security", status: state.auditLogging ? "Implemented" : "Gap", evidence: state.auditLogging ? "Comprehensive audit logging system active" : null, platformFeature: "Audit Logs", lastAssessed: now },
    { id: "A.12.6", name: "Technical Vulnerability Management", description: "Information about technical vulnerabilities shall be obtained and evaluated.", category: "A.12 Operations Security", status: state.vulnerabilityManagement ? "Implemented" : "Planned", evidence: state.vulnerabilityManagement ? "Regular vulnerability scanning and patching" : null, platformFeature: "Vulnerability Management", lastAssessed: now },
    { id: "A.13.1", name: "Network Security Management", description: "Networks shall be managed and controlled to protect information in systems and applications.", category: "A.13 Communications Security", status: state.networkSecurity ? "Implemented" : "Gap", evidence: state.networkSecurity ? "Network segmentation and firewall rules" : null, platformFeature: "Network Security", lastAssessed: now },
    { id: "A.14.1", name: "Security in Development", description: "Rules for the development of software shall be established and applied.", category: "A.14 System Development", status: state.changeManagement ? "Implemented" : "Partial", evidence: state.changeManagement ? "Secure SDLC with code review and testing" : null, platformFeature: "SDLC Process", lastAssessed: now },
    { id: "A.16.1", name: "Incident Management", description: "Responsibilities and procedures for effective management of security incidents.", category: "A.16 Incident Management", status: state.incidentResponse ? "Implemented" : "Planned", evidence: state.incidentResponse ? "Incident response plan with escalation procedures" : null, platformFeature: "Incident Response", lastAssessed: now },
    { id: "A.17.1", name: "Business Continuity", description: "Information security continuity shall be embedded in the organization's business continuity management.", category: "A.17 Business Continuity", status: state.dataBackup ? "Implemented" : "Planned", evidence: state.dataBackup ? "Business continuity plan with backup procedures" : null, platformFeature: "BCP", lastAssessed: now },
    { id: "A.18.1", name: "Compliance with Legal Requirements", description: "All relevant requirements shall be explicitly identified and documented for each information system.", category: "A.18 Compliance", status: "Implemented", evidence: "Regulatory compliance tracking dashboard", platformFeature: "Compliance Dashboard", lastAssessed: now },
  ];
}

function buildISO27701Controls(state: ReturnType<typeof evaluateControlStatus>): ComplianceControl[] {
  const now = new Date().toISOString();
  return [
    { id: "5.2.1", name: "Understanding the Organization", description: "Determine external and internal issues relevant to privacy information management.", category: "Context of the Organization", status: "Implemented", evidence: "Privacy context analysis documented", platformFeature: "Privacy Framework", lastAssessed: now },
    { id: "5.2.2", name: "Needs and Expectations", description: "Determine interested parties and their requirements related to PII processing.", category: "Context of the Organization", status: state.privacyPolicy ? "Implemented" : "Partial", evidence: state.privacyPolicy ? "Stakeholder privacy requirements mapped" : null, platformFeature: "Privacy Policy", lastAssessed: now },
    { id: "5.4.1", name: "Privacy Risk Assessment", description: "Process to identify, analyze, and evaluate privacy risks.", category: "Planning", status: state.riskAssessment ? "Implemented" : "Planned", evidence: state.riskAssessment ? "Privacy impact assessment methodology" : null, platformFeature: "Risk Assessment", lastAssessed: now },
    { id: "6.2.1", name: "Privacy Competence", description: "Persons doing work shall be competent on the basis of appropriate education and training.", category: "Support", status: state.securityTraining ? "Implemented" : "Planned", evidence: state.securityTraining ? "Privacy training completed" : null, platformFeature: "Privacy Training", lastAssessed: now },
    { id: "7.2.1", name: "Purpose Identification", description: "The organization shall identify and document the specific purposes for PII processing.", category: "PII Controllers", status: state.privacyPolicy ? "Implemented" : "Partial", evidence: state.privacyPolicy ? "Data processing purposes documented" : null, platformFeature: "Data Processing Register", lastAssessed: now },
    { id: "7.2.2", name: "Lawful Basis", description: "The organization shall determine and document the lawful basis for PII processing.", category: "PII Controllers", status: state.privacyPolicy ? "Implemented" : "Partial", evidence: "Legal basis for processing identified", platformFeature: "Legal Basis Registry", lastAssessed: now },
    { id: "7.2.5", name: "Privacy Impact Assessment", description: "The organization shall assess the need for, and implement where appropriate, a PIA.", category: "PII Controllers", status: state.riskAssessment ? "Implemented" : "Planned", evidence: state.riskAssessment ? "PIA conducted for high-risk processing" : null, platformFeature: "PIA Process", lastAssessed: now },
    { id: "7.2.8", name: "Records of PII Processing", description: "The organization shall determine and maintain records of PII processing activities.", category: "PII Controllers", status: state.auditLogging ? "Implemented" : "Planned", evidence: state.auditLogging ? "Processing activity records maintained via audit logs" : null, platformFeature: "Audit Logs", lastAssessed: now },
    { id: "7.3.1", name: "Obligation to PII Principals", description: "The organization shall provide mechanisms for data subjects to exercise their rights.", category: "PII Principal Rights", status: state.consentManagement ? "Implemented" : "Partial", evidence: "Data subject rights framework established", platformFeature: "Data Rights", lastAssessed: now },
    { id: "7.3.4", name: "Access and Correction", description: "Mechanisms to allow PII principals to access and correct their data.", category: "PII Principal Rights", status: state.consentManagement ? "Implemented" : "Partial", evidence: "User data access capabilities provided", platformFeature: "User Data Access", lastAssessed: now },
    { id: "7.4.1", name: "Limit Collection", description: "The organization shall limit the collection of PII to that which is adequate and relevant.", category: "PII Minimization", status: state.dataClassification ? "Implemented" : "Partial", evidence: state.dataClassification ? "Data minimization principles enforced" : null, platformFeature: "Data Minimization", lastAssessed: now },
    { id: "7.4.4", name: "PII De-identification", description: "The organization shall identify and implement de-identification and deletion mechanisms.", category: "PII Minimization", status: state.dataRetention ? "Implemented" : "Planned", evidence: state.dataRetention ? "Data anonymization procedures in place" : null, platformFeature: "Data Anonymization", lastAssessed: now },
    { id: "7.5.1", name: "Transfer Mechanisms", description: "The organization shall identify and document the basis for cross-border PII transfers.", category: "PII Transfer", status: "Partial", evidence: "Cross-border transfer assessment in progress", platformFeature: "Data Transfer Policy", lastAssessed: now },
    { id: "8.2.1", name: "Customer Agreement", description: "The organization shall ensure contracts address PII processing obligations.", category: "PII Processors", status: state.vendorManagement ? "Implemented" : "Planned", evidence: state.vendorManagement ? "Data processing agreements in place" : null, platformFeature: "DPA Management", lastAssessed: now },
  ];
}

function buildIFCControls(state: ReturnType<typeof evaluateControlStatus>): ComplianceControl[] {
  const now = new Date().toISOString();
  return [
    { id: "PS1.1", name: "Environmental and Social Assessment", description: "Identify and evaluate environmental and social risks and impacts of the project.", category: "PS1 - Assessment & Management", status: "Implemented", evidence: "Multi-factor ESL risk assessment engine with real-time scoring", platformFeature: "Risk Engine", lastAssessed: now },
    { id: "PS1.2", name: "Management System", description: "Establish and maintain an Environmental and Social Management System (ESMS).", category: "PS1 - Assessment & Management", status: "Implemented", evidence: "ESMS integrated into project lifecycle via ESAP tracking", platformFeature: "ESAP System", lastAssessed: now },
    { id: "PS1.3", name: "Organizational Capacity", description: "Establish, maintain, and strengthen organizational capacity for ESMS implementation.", category: "PS1 - Assessment & Management", status: state.securityTraining ? "Implemented" : "Partial", evidence: "Role-based capabilities with Analyst/IO/Admin tiers", platformFeature: "Role System", lastAssessed: now },
    { id: "PS1.4", name: "Stakeholder Engagement", description: "Establish a process for stakeholder engagement including disclosure and consultation.", category: "PS1 - Assessment & Management", status: "Implemented", evidence: "Community sensitivity scoring and stakeholder impact analysis", platformFeature: "Community Analysis", lastAssessed: now },
    { id: "PS1.5", name: "Monitoring and Review", description: "Establish procedures to monitor and measure the effectiveness of the management program.", category: "PS1 - Assessment & Management", status: state.monitoringActive ? "Implemented" : "Partial", evidence: state.monitoringActive ? "Real-time monitoring events and covenant tracking" : null, platformFeature: "Monitoring System", lastAssessed: now },
    { id: "PS2.1", name: "Working Conditions", description: "Establish working conditions that comply with national law and IFC requirements.", category: "PS2 - Labor & Working Conditions", status: "Partial", evidence: "Project labor risk assessment included in ESL scoring", platformFeature: "Labor Assessment", lastAssessed: now },
    { id: "PS2.2", name: "Workers' Organizations", description: "Respect workers' rights to form and join workers' organizations.", category: "PS2 - Labor & Working Conditions", status: "Planned", evidence: null, platformFeature: "Labor Rights Module", lastAssessed: now },
    { id: "PS3.1", name: "Resource Efficiency", description: "Implement measures for improving efficiency in consumption of energy, water, and other resources.", category: "PS3 - Resource Efficiency & Pollution", status: "Implemented", evidence: "Environmental risk scoring with resource efficiency metrics", platformFeature: "Environmental Scoring", lastAssessed: now },
    { id: "PS3.2", name: "Pollution Prevention", description: "Avoid or minimize the release of pollutants to air, water, and land.", category: "PS3 - Resource Efficiency & Pollution", status: "Implemented", evidence: "Contamination risk and water quality monitoring", platformFeature: "Pollution Monitoring", lastAssessed: now },
    { id: "PS4.1", name: "Community Health and Safety", description: "Evaluate risks and impacts to the health and safety of affected communities.", category: "PS4 - Community Health & Safety", status: "Implemented", evidence: "Community sensitivity scoring in risk assessment", platformFeature: "Community Health", lastAssessed: now },
    { id: "PS4.2", name: "Infrastructure and Equipment Safety", description: "Design, construct, operate infrastructure to avoid risks to community health.", category: "PS4 - Community Health & Safety", status: "Partial", evidence: "Infrastructure risk assessment in project evaluation", platformFeature: "Infrastructure Safety", lastAssessed: now },
    { id: "PS5.1", name: "Displacement Avoidance", description: "Consider feasible alternative project designs to avoid physical and economic displacement.", category: "PS5 - Land Acquisition & Resettlement", status: "Partial", evidence: "Displacement risk evaluated in project assessment", platformFeature: "Displacement Analysis", lastAssessed: now },
    { id: "PS6.1", name: "Biodiversity Assessment", description: "Assess significance of project impacts on biodiversity and identify priority areas.", category: "PS6 - Biodiversity Conservation", status: "Implemented", evidence: "Biodiversity risk scoring integrated into environmental assessment", platformFeature: "Biodiversity Module", lastAssessed: now },
    { id: "PS6.2", name: "Habitat Protection", description: "Protect and conserve biodiversity through modified and natural habitat preservation.", category: "PS6 - Biodiversity Conservation", status: "Partial", evidence: "Habitat impact indicators in risk model", platformFeature: "Habitat Assessment", lastAssessed: now },
    { id: "PS7.1", name: "Indigenous Peoples Identification", description: "Identify indigenous peoples who may be affected by the project.", category: "PS7 - Indigenous Peoples", status: "Planned", evidence: null, platformFeature: "Indigenous Assessment", lastAssessed: now },
    { id: "PS8.1", name: "Cultural Heritage Protection", description: "Protect cultural heritage and comply with national law on heritage.", category: "PS8 - Cultural Heritage", status: "Partial", evidence: "Cultural heritage screening in project assessment", platformFeature: "Heritage Screening", lastAssessed: now },
  ];
}

function calculateCategoryScores(controls: ComplianceControl[]) {
  const categories: Record<string, { total: number; implemented: number; partial: number; planned: number; gap: number; score: number }> = {};

  for (const c of controls) {
    if (!categories[c.category]) {
      categories[c.category] = { total: 0, implemented: 0, partial: 0, planned: 0, gap: 0, score: 0 };
    }
    categories[c.category].total++;
    if (c.status === "Implemented") categories[c.category].implemented++;
    else if (c.status === "Partial") categories[c.category].partial++;
    else if (c.status === "Planned") categories[c.category].planned++;
    else categories[c.category].gap++;
  }

  for (const cat of Object.values(categories)) {
    cat.score = Math.round(((cat.implemented + cat.partial * 0.5) / cat.total) * 100);
  }

  return categories;
}

function calculateOverallScore(controls: ComplianceControl[]): number {
  if (controls.length === 0) return 0;
  const score = controls.reduce((sum, c) => {
    if (c.status === "Implemented") return sum + 1;
    if (c.status === "Partial") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((score / controls.length) * 100);
}

function buildFramework(id: string, name: string, shortName: string, description: string, version: string, controls: ComplianceControl[]): ComplianceFramework {
  return {
    id,
    name,
    shortName,
    description,
    version,
    controls,
    overallScore: calculateOverallScore(controls),
    categoryScores: calculateCategoryScores(controls),
  };
}

router.get("/compliance/frameworks", async (_req, res) => {
  const state = evaluateControlStatus();

  const frameworks = [
    buildFramework("soc2", "SOC 2 Type II", "SOC 2", "Service Organization Control 2 — Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.", "2017", buildSOC2Controls(state)),
    buildFramework("iso27001", "ISO/IEC 27001:2022", "ISO 27001", "International standard for information security management systems (ISMS).", "2022", buildISO27001Controls(state)),
    buildFramework("iso27701", "ISO/IEC 27701:2019", "ISO 27701", "Privacy information management system extension to ISO 27001 and ISO 27002.", "2019", buildISO27701Controls(state)),
    buildFramework("ifc-ps", "IFC Performance Standards", "IFC PS", "International Finance Corporation's environmental and social Performance Standards for managing investment risks.", "2012", buildIFCControls(state)),
  ];

  res.json(frameworks);
});

router.get("/compliance/frameworks/:id", async (req, res) => {
  const state = evaluateControlStatus();
  const { id } = req.params;

  const frameworkMap: Record<string, () => ComplianceFramework> = {
    soc2: () => buildFramework("soc2", "SOC 2 Type II", "SOC 2", "Service Organization Control 2 — Trust Services Criteria.", "2017", buildSOC2Controls(state)),
    iso27001: () => buildFramework("iso27001", "ISO/IEC 27001:2022", "ISO 27001", "International standard for ISMS.", "2022", buildISO27001Controls(state)),
    iso27701: () => buildFramework("iso27701", "ISO/IEC 27701:2019", "ISO 27701", "Privacy extension to ISO 27001.", "2019", buildISO27701Controls(state)),
    "ifc-ps": () => buildFramework("ifc-ps", "IFC Performance Standards", "IFC PS", "IFC's environmental and social Performance Standards.", "2012", buildIFCControls(state)),
  };

  const factory = frameworkMap[id];
  if (!factory) {
    res.status(404).json({ message: "Framework not found" });
    return;
  }

  res.json(factory());
});

router.get("/compliance/summary", async (_req, res) => {
  const state = evaluateControlStatus();

  const frameworks = [
    { id: "soc2", name: "SOC 2 Type II", shortName: "SOC 2", controls: buildSOC2Controls(state) },
    { id: "iso27001", name: "ISO 27001", shortName: "ISO 27001", controls: buildISO27001Controls(state) },
    { id: "iso27701", name: "ISO 27701", shortName: "ISO 27701", controls: buildISO27701Controls(state) },
    { id: "ifc-ps", name: "IFC PS", shortName: "IFC PS", controls: buildIFCControls(state) },
  ];

  const frameworkScores = frameworks.map(f => ({
    id: f.id,
    name: f.name,
    shortName: f.shortName,
    score: calculateOverallScore(f.controls),
    totalControls: f.controls.length,
    implemented: f.controls.filter(c => c.status === "Implemented").length,
    partial: f.controls.filter(c => c.status === "Partial").length,
    planned: f.controls.filter(c => c.status === "Planned").length,
    gap: f.controls.filter(c => c.status === "Gap").length,
  }));

  const allControls = frameworks.flatMap(f => f.controls);
  const overallScore = calculateOverallScore(allControls);

  res.json({
    overallScore,
    totalControls: allControls.length,
    implemented: allControls.filter(c => c.status === "Implemented").length,
    partial: allControls.filter(c => c.status === "Partial").length,
    planned: allControls.filter(c => c.status === "Planned").length,
    gap: allControls.filter(c => c.status === "Gap").length,
    frameworks: frameworkScores,
    lastUpdated: new Date().toISOString(),
  });
});

router.get("/compliance/export", async (_req, res) => {
  const state = evaluateControlStatus();

  const frameworks = [
    buildFramework("soc2", "SOC 2 Type II", "SOC 2", "Service Organization Control 2", "2017", buildSOC2Controls(state)),
    buildFramework("iso27001", "ISO/IEC 27001:2022", "ISO 27001", "Information Security Management", "2022", buildISO27001Controls(state)),
    buildFramework("iso27701", "ISO/IEC 27701:2019", "ISO 27701", "Privacy Information Management", "2019", buildISO27701Controls(state)),
    buildFramework("ifc-ps", "IFC Performance Standards", "IFC PS", "Environmental and Social Standards", "2012", buildIFCControls(state)),
  ];

  const allControls = frameworks.flatMap(f => f.controls);

  const report = {
    title: "ESL Intelligence Platform — Compliance Report",
    generatedAt: new Date().toISOString(),
    overallScore: calculateOverallScore(allControls),
    totalControls: allControls.length,
    implemented: allControls.filter(c => c.status === "Implemented").length,
    partial: allControls.filter(c => c.status === "Partial").length,
    planned: allControls.filter(c => c.status === "Planned").length,
    gap: allControls.filter(c => c.status === "Gap").length,
    frameworks: frameworks.map(f => ({
      id: f.id,
      name: f.name,
      version: f.version,
      overallScore: f.overallScore,
      categoryScores: f.categoryScores,
      controls: f.controls.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        status: c.status,
        evidence: c.evidence,
        platformFeature: c.platformFeature,
      })),
    })),
  };

  res.json(report);
});

export default router;
