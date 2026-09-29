import asyncio
from datetime import datetime, timedelta
from app.db.database import AsyncSessionLocal, init_db
from app.models.models import Organization, Company, Contact, Deal, Interaction, Task
from app.memory.memory_service import memory_service
from app.schemas.schemas import MemoryType, ExtractedFact

async def seed_database():
    """
    Seed initial enterprise business data (organizations, companies, deals, interactions, Hindsight memories).
    NOTE: Real users must register via /register. NO hardcoded demo users or credentials are created.
    """
    await init_db()
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select, update

        # Ensure flagship Organization exists
        org_res = await session.execute(select(Organization).where(Organization.id == "org_acme"))
        acme_org = org_res.scalars().first()
        if not acme_org:
            acme_org = Organization(
                id="org_acme",
                name="Acme Technologies"
            )
            session.add(acme_org)
            await session.commit()
            await session.refresh(acme_org)

        # Backfill organization_id for existing deals and companies
        await session.execute(
            update(Deal).where(Deal.organization_id == None).values(organization_id="org_acme")
        )
        await session.execute(
            update(Company).where(Company.organization_id == None).values(organization_id="org_acme")
        )
        await session.commit()

        # Check if deals already seeded
        existing_deal = await session.execute(select(Deal).limit(1))
        if existing_deal.scalars().first():
            print("Database already contains seeded business data. Organization linked.")
            return

        print("Seeding DealMind database with flagship Acme story & enterprise deals...")

        # 1. Companies & Contacts
        # Flagship: Acme Technologies
        acme = Company(
            id="comp_acme",
            name="Acme Technologies",
            industry="Enterprise Software & Cloud",
            website="https://acme-technologies.example.com",
            size="500-1000",
            location="Bengaluru, Karnataka, India",
            organization_id=acme_org.id
        )
        session.add(acme)

        sarah = Contact(
            id="contact_sarah",
            company_id=acme.id,
            name="Sarah Jenkins",
            role="VP of Engineering & Buying Sponsor",
            email="sarah.jenkins@acme.example.com",
            phone="+91 98765 43210"
        )
        vikram = Contact(
            id="contact_vikram",
            company_id=acme.id,
            name="Vikram Rao",
            role="Lead Solutions Architect",
            email="vikram.rao@acme.example.com",
            phone="+91 98765 43211"
        )
        session.add_all([sarah, vikram])

        # Other 4 Companies
        nova = Company(id="comp_nova", name="NovaHealth", industry="Healthcare & HealthTech", size="1000+", location="Hyderabad, India", organization_id=acme_org.id)
        finedge = Company(id="comp_finedge", name="FinEdge Solutions", industry="Fintech & Banking", size="250-500", location="Mumbai, India", organization_id=acme_org.id)
        cloudforge = Company(id="comp_cloudforge", name="CloudForge Systems", industry="DevOps & Infrastructure", size="50-200", location="Pune, India", organization_id=acme_org.id)
        retailx = Company(id="comp_retailx", name="RetailX Omnichannel", industry="E-Commerce & Retail", size="500-1000", location="Gurugram, India", organization_id=acme_org.id)
        session.add_all([nova, finedge, cloudforge, retailx])

        contact_nova = Contact(id="cont_nova", company_id=nova.id, name="Dr. Ananya Roy", role="Chief Medical Informatics Officer", email="ananya@novahealth.example.com")
        contact_fin = Contact(id="cont_fin", company_id=finedge.id, name="Rohan Mehta", role="Head of Digital Banking", email="rohan@finedge.example.com")
        contact_cloud = Contact(id="cont_cloud", company_id=cloudforge.id, name="Kiran Patil", role="VP of Cloud Operations", email="kiran@cloudforge.example.com")
        contact_retail = Contact(id="cont_retail", company_id=retailx.id, name="Priya Sharma", role="Chief Omnichannel Officer", email="priya@retailx.example.com")
        session.add_all([contact_nova, contact_fin, contact_cloud, contact_retail])

        # 2. Deals
        # Flagship Deal: Acme Enterprise AI Platform
        acme_deal = Deal(
            id="deal_acme_flagship",
            company_id=acme.id,
            name="Acme Enterprise AI Platform",
            stage="Proposal",
            value=1000000.0,  # ₹10 Lakh
            currency="INR",
            probability=75,
            expected_close_date=datetime.utcnow() + timedelta(days=21),
            organization_id=acme_org.id,
            status="active"
        )
        deal_nova = Deal(id="deal_nova_01", company_id=nova.id, name="Clinical NLP & Patient Intake Automation", stage="Discovery", value=1800000.0, currency="INR", probability=40, organization_id=acme_org.id)
        deal_fin = Deal(id="deal_fin_01", company_id=finedge.id, name="FinEdge Wealth Intelligence Agent", stage="Negotiation", value=2500000.0, currency="INR", probability=85, organization_id=acme_org.id)
        deal_cloud = Deal(id="deal_cloud_01", company_id=cloudforge.id, name="Cloud Governance & FinOps AI", stage="Qualified", value=850000.0, currency="INR", probability=60, organization_id=acme_org.id)
        deal_retail = Deal(id="deal_retail_01", company_id=retailx.id, name="RetailX Unified Inventory Assistant", stage="Discovery", value=1200000.0, currency="INR", probability=30, organization_id=acme_org.id)
        session.add_all([acme_deal, deal_nova, deal_fin, deal_cloud, deal_retail])

        # 3. Open Tasks for Acme
        task1 = Task(id="task_01", deal_id=acme_deal.id, title="Deliver SOC2 Type II compliance packet to Sarah Jenkins", priority="high", due_date=datetime.utcnow() + timedelta(days=2))
        task2 = Task(id="task_02", deal_id=acme_deal.id, title="Schedule 20-min live CRM Webhook sync with Vikram Rao", priority="high", due_date=datetime.utcnow() + timedelta(days=3))
        task3 = Task(id="task_03", deal_id=acme_deal.id, title="Share revised ₹10L milestone contract draft", priority="medium", due_date=datetime.utcnow() + timedelta(days=5))
        session.add_all([task1, task2, task3])

        # 4. Flagship 10-12 Historical Interactions telling the cohesive story
        interactions_data = [
            (
                "int_01", "Initial Inbound Discovery Call", "Call",
                "Met with Sarah Jenkins. Acme Technologies is experiencing significant friction in sales cycle handoffs. Their reps spend 40% of their day manually copying notes between meetings. They urgently need an intelligent sales automation platform.",
                datetime.utcnow() - timedelta(days=45),
                [ExtractedFact(memory_type=MemoryType.CUSTOMER_PROFILE, fact="Acme needs an intelligent sales automation platform to eliminate manual note taking and CRM data entry.", importance="high")]
            ),
            (
                "int_02", "Budget & Commercial Scope Discussion", "Meeting",
                "Detailed budget conversation with Sarah. She explicitly stated: 'Our budget for this initiative is capped around ₹10 lakh for year one. Any proposal exceeding this will trigger board review and delay the project.'",
                datetime.utcnow() - timedelta(days=40),
                [ExtractedFact(memory_type=MemoryType.BUDGET, fact="Customer budget is firmly capped around ₹10 Lakh (₹10,00,000) for Year 1 implementation.", importance="critical", tags=["budget", "commercials"])]
            ),
            (
                "int_03", "Stakeholder Mapping & Decision Hierarchy", "Note",
                "Identified decision makers: Sarah Jenkins (VP Engineering) holds final technical sign-off and procurement approval. Vikram Rao (Lead Solutions Architect) must review and approve security and architecture.",
                datetime.utcnow() - timedelta(days=35),
                [ExtractedFact(memory_type=MemoryType.STAKEHOLDER, fact="Sarah Jenkins (VP Eng) is the economic buyer. Vikram Rao (Lead Architect) has technical veto power.", importance="high")]
            ),
            (
                "int_04", "Competitor Mention: Salesforce Einstein", "Meeting",
                "Sarah mentioned: 'We are also actively evaluating Salesforce Einstein and HubSpot Sales Hub because our sales reps are already on Salesforce.' We must position our persistent memory advantage.",
                datetime.utcnow() - timedelta(days=30),
                [ExtractedFact(memory_type=MemoryType.COMPETITOR, fact="Evaluating competitor: Salesforce Einstein (native incumbent) and HubSpot Sales Hub.", importance="high", tags=["competitor", "salesforce"])]
            ),
            (
                "int_05", "CRM Integration Deep Dive Objection", "Meeting",
                "Vikram raised our biggest technical objection: 'Our primary blocker is two-way synchronization with Salesforce. If your platform creates duplicate contact records or has latency above 100ms, our engineers will reject it.'",
                datetime.utcnow() - timedelta(days=25),
                [ExtractedFact(memory_type=MemoryType.OBJECTION, fact="Primary technical objection: Bi-directional CRM integration latency and avoiding duplicate records.", importance="critical", tags=["objection", "crm", "integration"])]
            ),
            (
                "int_06", "Security & Data Governance Review", "Call",
                "Call with Vikram regarding security compliance. He stated: 'We cannot send raw prospect emails to unvetted LLMs. We require SOC2 Type II certification, Indian data residency, and zero data retention for training.'",
                datetime.utcnow() - timedelta(days=20),
                [ExtractedFact(memory_type=MemoryType.OBJECTION, fact="Strict InfoSec requirement: SOC2 Type II compliance, zero-data-retention AI inference, and strict residency.", importance="high", tags=["security", "compliance"])]
            ),
            (
                "int_07", "Pricing Objection & Milestone Request", "Meeting",
                "Sarah expressed concern regarding upfront payment: 'Can we split the ₹10 Lakh into milestone-based tranches? 40% on pilot launch, 60% on full deployment.' Rep agreed to draft milestone schedule.",
                datetime.utcnow() - timedelta(days=16),
                [ExtractedFact(memory_type=MemoryType.PREFERENCE, fact="Payment structure preference: 40/60 milestone-based tranche aligned with rollout milestones.", importance="medium")]
            ),
            (
                "int_08", "Technical Architecture Demonstration", "Demo",
                "Conducted 45-minute live architecture demo with Vikram. Walked through Webhook event listeners and sub-50ms sync latency. Vikram was impressed by Hindsight's multi-session memory graph.",
                datetime.utcnow() - timedelta(days=12),
                [ExtractedFact(memory_type=MemoryType.SUCCESS_PATTERN, fact="Live technical sandbox demonstration of webhook sync latency was highly convincing to lead architect.", importance="high")]
            ),
            (
                "int_09", "Customer Working Preference Discovered", "Note",
                "Internal observation: Sarah and Vikram dislike high-level marketing presentations. They respond best to concrete technical API docs, bullet points, and live sandbox environments rather than slides.",
                datetime.utcnow() - timedelta(days=8),
                [ExtractedFact(memory_type=MemoryType.PREFERENCE, fact="Buyer communication preference: Prefers live sandbox environments, concise technical specs, and zero marketing slides.", importance="medium", tags=["preference", "buyer_behavior"])]
            ),
            (
                "int_10", "Formal Proposal Alignment & Action Items", "Proposal",
                "Presented formal proposal aligned at ₹10 Lakh. Promised Sarah that we would send official SOC2 audit report by Friday and coordinate a sandbox connector session with Vikram next week.",
                datetime.utcnow() - timedelta(days=3),
                [
                    ExtractedFact(memory_type=MemoryType.COMMITMENT, fact="Promised deliverable: Provide SOC2 Type II audit report and API credentials for Vikram's sandbox review.", importance="high", tags=["commitment"]),
                    ExtractedFact(memory_type=MemoryType.DEAL_CONTEXT, fact="Formal ₹10L proposal delivered; deal currently in Proposal/Negotiation stage awaiting security sign-off.", importance="high")
                ]
            )
        ]

        for i_id, title, itype, content, occurred, facts in interactions_data:
            interaction = Interaction(
                id=i_id,
                deal_id=acme_deal.id,
                type=itype,
                title=title,
                content=content,
                participants="Sarah Jenkins, Vikram Rao, Account Executive",
                outcome="Documented key constraints, objections, and commitments.",
                next_steps="Follow up on agreed action items.",
                occurred_at=occurred,
                created_by=None
            )
            session.add(interaction)

        await session.commit()
        print("Database models committed. Now retaining memories in Hindsight...")

        # Retain memories into Hindsight
        for i_id, title, itype, content, occurred, facts in interactions_data:
            await memory_service.store_interaction_memory(
                deal_id=acme_deal.id,
                interaction_id=i_id,
                interaction_title=title,
                interaction_text=content,
                company_id=acme.id,
                organization_id=acme_org.id,
                custom_facts=facts
            )

        print("Hindsight memory banks primed successfully for flagship deal!")

if __name__ == "__main__":
    asyncio.run(seed_database())
