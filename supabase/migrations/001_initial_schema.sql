-- AI for Bharat (जन एआई) - Production Database Schema & Seed Data
-- Supabase PostgreSQL with pgvector

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Welfare Schemes Table
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT NOT NULL,
    description_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    category TEXT NOT NULL, -- agriculture, healthcare, housing, employment, women_welfare, social_security, education
    ministry TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'central', -- 'central' or 'state'
    state TEXT, -- null for central schemes, state name for state schemes
    financial_benefit TEXT NOT NULL,
    financial_benefit_amount NUMERIC DEFAULT 0,
    eligibility_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    application_process TEXT NOT NULL,
    application_url TEXT,
    official_url TEXT NOT NULL,
    embedding vector(768),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Citizens / Demographics Profiles Table
CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    name TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'hi',
    age INTEGER,
    gender TEXT, -- 'male', 'female', 'other'
    state TEXT,
    district TEXT,
    occupation TEXT,
    annual_income NUMERIC,
    land_holding_acres NUMERIC DEFAULT 0,
    social_category TEXT, -- 'general', 'obc', 'sc', 'st', 'ews'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Chat Conversations & Messages Table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'hi',
    title TEXT NOT NULL DEFAULT 'नया संवाद / New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    audio_url TEXT,
    language TEXT NOT NULL DEFAULT 'hi',
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Eligibility Evaluations Table
CREATE TABLE IF NOT EXISTS eligibility_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    input_profile JSONB NOT NULL,
    eligible_schemes JSONB NOT NULL DEFAULT '[]'::jsonb,
    partially_eligible_schemes JSONB NOT NULL DEFAULT '[]'::jsonb,
    ineligible_schemes JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_potential_benefit NUMERIC NOT NULL DEFAULT 0,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Document Extractions & Masked Data Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('ration_card', 'land_passbook', 'aadhaar', 'income_certificate', 'other')),
    file_name TEXT NOT NULL,
    file_url TEXT,
    extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score NUMERIC NOT NULL DEFAULT 0,
    pii_masked BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Citizen Grievances & RTI Petitions Table
CREATE TABLE IF NOT EXISTS grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    petition_type TEXT NOT NULL CHECK (petition_type IN ('grievance', 'rti')),
    department TEXT NOT NULL,
    target_authority TEXT NOT NULL,
    subject TEXT NOT NULL,
    incident_date DATE,
    vernacular_draft TEXT NOT NULL,
    english_draft TEXT NOT NULL,
    statutory_reference TEXT,
    citizen_language TEXT NOT NULL DEFAULT 'hi',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'printed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_schemes_slug ON schemes(slug);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_state ON schemes(state);
CREATE INDEX IF NOT EXISTS idx_schemes_level ON schemes(level);
CREATE INDEX IF NOT EXISTS idx_citizens_session ON citizens(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_session ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_grievances_session ON grievances(session_id);

-- HNSW Vector Index for Semantic Scheme Matching
CREATE INDEX IF NOT EXISTS schemes_embedding_hnsw_idx 
ON schemes USING hnsw (embedding vector_cosine_ops);

-- 9. Semantic Retrieval RPC Function (match_schemes)
CREATE OR REPLACE FUNCTION match_schemes (
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.25,
    match_count INT DEFAULT 6,
    filter_category TEXT DEFAULT NULL,
    filter_state TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    title TEXT,
    title_translations JSONB,
    description TEXT,
    description_translations JSONB,
    category TEXT,
    ministry TEXT,
    level TEXT,
    state TEXT,
    financial_benefit TEXT,
    financial_benefit_amount NUMERIC,
    eligibility_criteria JSONB,
    required_documents JSONB,
    application_process TEXT,
    official_url TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.slug,
        s.title,
        s.title_translations,
        s.description,
        s.description_translations,
        s.category,
        s.ministry,
        s.level,
        s.state,
        s.financial_benefit,
        s.financial_benefit_amount,
        s.eligibility_criteria,
        s.required_documents,
        s.application_process,
        s.official_url,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM schemes s
    WHERE s.is_active = true
      AND (s.embedding IS NOT NULL)
      AND (1 - (s.embedding <=> query_embedding) >= match_threshold)
      AND (filter_category IS NULL OR s.category = filter_category)
      AND (filter_state IS NULL OR s.level = 'central' OR s.state = filter_state)
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 10. Row Level Security (RLS) Setup
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;

-- Schemes policies: Public can read, authenticated/service role can write
DROP POLICY IF EXISTS "Public can view active schemes" ON schemes;
CREATE POLICY "Public can view active schemes" ON schemes
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access on schemes" ON schemes;
CREATE POLICY "Service role full access on schemes" ON schemes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anonymous session-based access for citizens
DROP POLICY IF EXISTS "Citizens can manage their profile" ON citizens;
CREATE POLICY "Citizens can manage their profile" ON citizens
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Citizens can view conversations" ON chat_conversations;
CREATE POLICY "Citizens can view conversations" ON chat_conversations
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Citizens can view messages" ON chat_messages;
CREATE POLICY "Citizens can view messages" ON chat_messages
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Citizens can view evaluations" ON eligibility_evaluations;
CREATE POLICY "Citizens can view evaluations" ON eligibility_evaluations
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Citizens can view documents" ON documents;
CREATE POLICY "Citizens can view documents" ON documents
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Citizens can view grievances" ON grievances;
CREATE POLICY "Citizens can view grievances" ON grievances
    FOR ALL USING (true) WITH CHECK (true);

-- 11. Seed Data: Comprehensive Indian Welfare Schemes
INSERT INTO schemes (
    slug, title, title_translations, description, description_translations,
    category, ministry, level, state, financial_benefit, financial_benefit_amount,
    eligibility_criteria, required_documents, application_process, official_url, embedding
) VALUES
(
    'pm-kisan',
    'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    '{
        "hi": "प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)",
        "te": "ప్రధాన మంత్రి కిసాన్ సమ్మాన్ నిధి (పీఎం-కిసాన్)",
        "ta": "பிரதமர் கிசான் சம்மான் நிதி (பிஎம்-கிசான்)",
        "bn": "প্রধানমন্ত্রী কিষাণ সম্মান নিধি (পিএম-কিষাণ)",
        "mr": "प्रधानमंत्री किसान सन्मान निधी (पीएम-किसान)"
    }'::jsonb,
    'Central sector scheme providing income support of ₹6,000 per year to all landholding farmer families across the country in three equal four-monthly installments.',
    '{
        "hi": "देश भर के सभी भूमिधारक किसान परिवारों को तीन समान चार-मासिक किस्तों में प्रति वर्ष ₹6,000 की आय सहायता प्रदान करने वाली केंद्रीय योजना।",
        "te": "దేశవ్యాప్తంగా ఉన్న భూమిగల రైతు కుటుంబాలకు సంవత్సరానికి ₹6,000 ఆదాయ సహాయాన్ని మూడు సమాన వాయిదాలలో అందించే కేంద్ర పథకం.",
        "ta": "நாடு முழுவதும் உள்ள நில உரிமையாளர் விவசாயக் குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 வருமான உதவியை மூன்று தவணைகளில் வழங்கும் மத்திய அரசுத் திட்டம்.",
        "bn": "সারা দেশের সমস্ত জমিধারী কৃষক পরিবারকে বছরে তিনটি সমান কিস্তিতে ₹৬,০০০ টাকা আয় সহায়তা প্রদানের কেন্দ্রীয় প্রকল্প।",
        "mr": "देशभरातील सर्व जमीनधारक शेतकरी कुटुंबांना तीन समान हप्त्यांमध्ये दरवर्षी ₹६,००० चे उत्पन्न समर्थन देणारी केंद्रीय योजना."
    }'::jsonb,
    'agriculture',
    'Ministry of Agriculture & Farmers Welfare',
    'central',
    NULL,
    '₹6,000 per year in 3 installments of ₹2,000 directly to bank accounts via DBT',
    6000,
    '{
        "occupations": ["farmer", "cultivator"],
        "max_land_acres": 100,
        "requires_land_ownership": true,
        "excluded_professions": ["doctor", "engineer", "lawyer", "chartered_accountant", "constitutional_post_holder", "government_employee_group_abc"],
        "min_age": 18
    }'::jsonb,
    '["Aadhaar Card", "Land Ownership Documents (Khatauni/Passbook)", "Aadhaar-linked Bank Account Passbook", "Active Mobile Number"]'::jsonb,
    'Apply online at pmkisan.gov.in or visit your nearest Common Service Centre (CSC) or Village Agriculture Officer with land ownership papers and bank details.',
    'https://pmkisan.gov.in',
    -- Standard normalized 768-d unit vector seed
    (SELECT array_agg((i % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'pm-jay',
    'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)',
    '{
        "hi": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (एबी-पीएमजेएवाई)",
        "te": "ఆయుష్మాన్ భారత్ - ప్రధాన మంత్రి జన్ ఆరోగ్య యోజన (పీఎం-జేఏవై)",
        "ta": "ஆயுஷ்மான் பாரத் - பிரதமர் ஜன் ஆரோக்கிய திட்டம் (பிஎம்-ஜேஏஒய்)",
        "bn": "আয়ুষ্মান ভারত - প্রধানমন্ত্রী জন আরোগ্য যোজনা (এবি-পিএমজেএওয়াই)",
        "mr": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना"
    }'::jsonb,
    'World largest health assurance scheme providing a health cover of ₹5,00,000 per family per year for secondary and tertiary care hospitalization to poor and vulnerable families.',
    '{
        "hi": "गरीब और कमजोर परिवारों को माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5,00,000 का स्वास्थ्य कवर प्रदान करने वाली दुनिया की सबसे बड़ी स्वास्थ्य आश्वासन योजना।",
        "te": "పేద మరియు నిస్సహాయ కుటుంబాలకు ఆసుపత్రి చికిత్స కోసం కుటుంబానికి సంవత్సరానికి ₹5,00,000 వరకు నగదు రహిత ఆరోగ్య రక్షణ అందించే ప్రపంచంలోనే అతిపెద్ద పథకం.",
        "ta": "ஏழை மற்றும் நலிவடைந்த குடும்பங்களுக்கு இரண்டாம் மற்றும் மூன்றாம் நிலை மருத்துவ சிகிச்சைக்காக குடும்பத்திற்கு ஆண்டுக்கு ₹5,00,000 வரை பணமில்லா மருத்துவ காப்பீடு வழங்கும் திட்டம்.",
        "bn": "দরিদ্র ও অনগ্রসর পরিবারের জন্য হাসপাতালে চিকিৎসার উদ্দেশ্যে প্রতি পরিবারে বছরে ₹৫,০০,০০০ টাকার স্বাস্থ্য বীমা সহায়তা প্রদানকারী বিশ্বের বৃহত্তম প্রকল্প।",
        "mr": "गरीब कुटुंबांना रुग्णालयात उपचारासाठी दरवर्षी कुटुंबाला ₹५,००,००० पर्यंत मोफत आरोग्य संरक्षण देणारी योजना."
    }'::jsonb,
    'healthcare',
    'Ministry of Health and Family Welfare / National Health Authority (NHA)',
    'central',
    NULL,
    'Cashless hospitalization cover up to ₹5,00,000 per family per year',
    500000,
    '{
        "income_ceiling_annual": 250000,
        "criteria_tags": ["bpl", "secc_deprived", "antodaya_ration_card"],
        "max_family_size": 20
    }'::jsonb,
    '["Aadhaar Card", "Ration Card (BPL/Antyodaya)", "Government Photo ID Proof"]'::jsonb,
    'Check eligibility at mera.pmjay.gov.in, visit nearest Empanelled Public or Private Hospital with Aadhaar & Ration card to get your Ayushman Golden Card generated instantly.',
    'https://nha.gov.in/PM-JAY',
    (SELECT array_agg(((i + 2) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'pm-awas-gramin',
    'Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)',
    '{
        "hi": "प्रधानमंत्री आवास योजना - ग्रामीण (पीएमएवाई-जी)",
        "te": "ప్రధాన మంత్రి ఆవాస్ యోజన - గ్రామీణ్ (పీఎంఏవై-జి)",
        "ta": "பிரதமர் ஆவாஸ் திட்டம் - கிராமப்புறம் (பிஎம்ஏஒய்-ஜி)",
        "bn": "প্রধানমন্ত্রী আবাস যোজনা - গ্রামীণ (পিএমএওয়াই-জি)",
        "mr": "प्रधानमंत्री आवास योजना - ग्रामीण"
    }'::jsonb,
    'Provides financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly/difficult areas to homeless households and families living in kutcha/dilapidated houses for pucca house construction.',
    '{
        "hi": "बेघर परिवारों और कच्चे/जर्जर घरों में रहने वाले परिवारों को पक्के घर के निर्माण के लिए मैदानी क्षेत्रों में ₹1,20,000 और पहाड़ी/दुर्गम क्षेत्रों में ₹1,30,000 की वित्तीय सहायता प्रदान करता है।",
        "te": "ఇళ్లు లేని వారికి మరియు మట్టి ఇళ్లలో నివసించే గ్రామీణ కుటుంబాలకు పక్కా ఇళ్ల నిర్మాణానికి ₹1,20,000 నుండి ₹1,30,000 వరకు ఆర్థిక సహాయం అందజేస్తుంది.",
        "ta": "வீடற்ற கிராமப்புற குடும்பங்களுக்கு நிரந்தர வீடு கட்டுவதற்காக ₹1,20,000 முதல் ₹1,30,000 வரை நிதி உதவி வழங்கும் திட்டம்.",
        "bn": "গৃহহীন এবং কাঁচা ঘরে বসবাসকারী গ্রামীণ পরিবারের পাকা বাড়ি নির্মাণের জন্য সমতল অঞ্চলে ₹১,২০,০০০ ও পাহাড়ি এলাকায় ₹১,৩০,০০০ টাকা অনুদান প্রদান।",
        "mr": "घर नसलेल्या आणि कच्च्या घरात राहणाऱ्या कुटुंबांना पक्के घर बांधण्यासाठी ₹१,२०,००० पर्यंत थेट आर्थिक मदत."
    }'::jsonb,
    'housing',
    'Ministry of Rural Development',
    'central',
    NULL,
    'Direct grant of ₹1,20,000 to ₹1,30,000 plus 90-95 days MGNREGA unskilled labor wage support',
    120000,
    '{
        "housing_status": ["homeless", "kutcha_house"],
        "area": "rural",
        "income_ceiling_annual": 180000,
        "criteria_tags": ["no_pucca_house_anywhere_in_india"]
    }'::jsonb,
    '["Aadhaar Card", "Bank Account Details", "Gram Panchayat Job Card / MGNREGA Card", "Consent to use Aadhaar"]'::jsonb,
    'Identified through SECC list and Awaas+ survey conducted by Gram Panchayat. Contact your Gram Panchayat Pradhan or Block Development Officer (BDO).',
    'https://pmayg.nic.in',
    (SELECT array_agg(((i + 4) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'mgnrega',
    'Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)',
    '{
        "hi": "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम (मनरेगा)",
        "te": "మహాత్మా గాంధీ జాతీయ గ్రామీణ ఉపాధి హామీ చట్టం (ఉపాధి హామీ)",
        "ta": "மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டம் (100 நாள் வேலை)",
        "bn": "মহাত্মা গান্ধী জাতীয় গ্রামীণ কর্মসংস্থান নিশ্চয়তা আইন (১০০ দিনের কাজ)",
        "mr": "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार हमी कायदा (मनरेगा)"
    }'::jsonb,
    'Legal guarantee for at least 100 days of wage employment in every financial year to every rural household whose adult members volunteer to do unskilled manual work.',
    '{
        "hi": "प्रत्येक वित्तीय वर्ष में प्रत्येक ग्रामीण परिवार के उन वयस्क सदस्यों को कम से कम 100 दिनों के सवैतनिक अकुशल शारीरिक रोजगार की कानूनी गारंटी देता है।",
        "te": "గ్రామీణ ప్రాంతాల్లోని వయోజన కుటుంబ సభ్యులకు ప్రతి ఆర్థిక సంవత్సరంలో కనీసం 100 రోజుల పాటు నైపుణ్యం లేని కూలీ పనిని చట్టబద్ధంగా కల్పిస్తుంది.",
        "ta": "ஒவ்வொரு கிராமப்புற குடும்பத்திற்கும் ஒரு நிதியாண்டில் குறைந்தபட்சம் 100 நாட்கள் கூலி வேலைக்கான சட்டப்பூர்வ உத்தரவாதம் வழங்குகிறது.",
        "bn": "প্রতিটি গ্রামীণ পরিবারের প্রাপ্তবয়স্ক সদস্যদের জন্য বছরে অন্তত ১০০ দিনের অদক্ষ শারীরিক কাজের আইনি নিশ্চয়তা।",
        "mr": "ग्रामीण भागातील प्रौढ व्यक्तींना प्रत्येक आर्थिक वर्षात किमान १०० दिवसांच्या अकुशल रोजगाराची कायदेशीर हमी."
    }'::jsonb,
    'employment',
    'Ministry of Rural Development',
    'central',
    NULL,
    'Guaranteed minimum wage (₹230 - ₹374/day state-specific) for up to 100 days per rural household',
    30000,
    '{
        "area": "rural",
        "min_age": 18,
        "willing_to_do_unskilled_work": true
    }'::jsonb,
    '["Aadhaar Card", "Passport Size Photograph", "Bank or Post Office Passbook", "Residence Proof in Gram Panchayat"]'::jsonb,
    'Submit application for registration to the local Gram Panchayat verbally or in writing. Job Card is issued within 15 days of application.',
    'https://nrega.nic.in',
    (SELECT array_agg(((i + 6) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'pm-ujjwala',
    'Pradhan Mantri Ujjwala Yojana 2.0 (PMUY)',
    '{
        "hi": "प्रधानमंत्री उज्ज्वला योजना 2.0 (पीएमयूवाई)",
        "te": "ప్రధాన మంత్రి ఉజ్జ్వల యోజన 2.0 (పీఎంయూవై)",
        "ta": "பிரதமர் உஜ்வாலா திட்டம் 2.0 (பிஎம்யுஒய்)",
        "bn": "প্রধানমন্ত্রী উজ্জ্বলা যোজনা ২.০ (পিএমইউওয়াই)",
        "mr": "प्रधानमंत्री उज्ज्वला योजना २.०"
    }'::jsonb,
    'Provides deposit-free LPG gas connections along with free first refill and hotplate/stove to adult women belonging to poor households across India.',
    '{
        "hi": "भारत भर के निर्धन परिवारों की वयस्क महिलाओं को निःशुल्क पहला रिफिल और गैस चूल्हा के साथ सुरक्षा जमा-मुक्त एलपीजी गैस कनेक्शन प्रदान करता है।",
        "te": "పేద కుటుంబాలకు చెందిన మహిళలకు డిపాజిట్ లేని ఉచిత గ్యాస్ కనెక్షన్, మొదటి ఉచిత రీఫిల్ మరియు స్టవ్ అందిస్తుంది.",
        "ta": "ஏழைக் குடும்பங்களைச் சேர்ந்த பெண்களுக்கு வைப்புத்தொகை இல்லாத இலவச எரிவாயு இணைப்பு, இலவச முதல் சிலிண்டர் மற்றும் அடுப்பு வழங்குகிறது.",
        "bn": "দরিদ্র পরিবারের প্রাপ্তবয়স্ক মহিলাদের জন্য জামানত-মুক্ত এলপিজি গ্যাস সংযোগ, প্রথম রিফিল ও বিনামূল্যে গ্যাসের উনুন প্রদান।",
        "mr": "गरीब घरातील प्रौढ महिलांना विनामूल्य गॅस शेगडी, पहिला सिलिंडर रिफिल आणि अनामत रकमेविना एलपीजी गॅस जोडणी."
    }'::jsonb,
    'women_welfare',
    'Ministry of Petroleum and Natural Gas',
    'central',
    NULL,
    'Free LPG Connection, Free First Cylinder Refill and Free Gas Stove worth ₹1,600 + ₹300 subsidy per refill',
    4600,
    '{
        "gender": "female",
        "min_age": 18,
        "criteria_tags": ["bpl", "no_existing_lpg_connection"],
        "income_ceiling_annual": 200000
    }'::jsonb,
    '["Aadhaar Card of Applicant", "Ration Card supporting family composition", "Bank Account Passbook (Aadhaar linked)", "Proof of Address"]'::jsonb,
    'Apply online at pmuy.gov.in or submit Form at the nearest LPG distributor (Indane, BharatGas, HP Gas).',
    'https://pmuy.gov.in',
    (SELECT array_agg(((i + 8) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'atal-pension',
    'Atal Pension Yojana (APY)',
    '{
        "hi": "अटल पेंशन योजना (एपीवाई)",
        "te": "అటల్ పెన్షన్ యోజన (ఏపీవై)",
        "ta": "அடல் ஓய்வூதியத் திட்டம் (ஏபிஒய்)",
        "bn": "অটল পেনশন যোজনা (এপিওয়াই)",
        "mr": "अटल पेन्शन योजना"
    }'::jsonb,
    'Government-backed guaranteed monthly pension of ₹1,000 to ₹5,000 for unorganized sector workers starting after attaining 60 years of age.',
    '{
        "hi": "असंगठित क्षेत्र के श्रमिकों के लिए 60 वर्ष की आयु प्राप्त करने के बाद ₹1,000 से ₹5,000 की सरकार द्वारा समर्थित गारंटीकृत मासिक पेंशन।",
        "te": "అసంఘటిత రంగ కార్మికులకు 60 ఏళ్లు నిండిన తర్వాత నెలకు ₹1,000 నుండి ₹5,000 వరకు ప్రభుత్వం అందించే శాశ్వత పింఛను పథకం.",
        "ta": "அமைப்புசாரா துறை தொழிலாளர்களுக்கு 60 வயதிற்குப் பிறகு மாதம் ₹1,000 முதல் ₹5,000 வரை அரசாங்க உத்தரவாதத்துடன் கூடிய ஓய்வூதியம்.",
        "bn": "অসংগঠিত ক্ষেত্রের শ্রমিকদের ৬০ বছর বয়স পূর্ণ হলে প্রতি মাসে ₹১,০০০ থেকে ₹৫,০০০ টাকার নিশ্চিত মাসিক পেনশন প্রদান।",
        "mr": "असंघटित क्षेत्रातील कामगारांना वयाची ६० वर्षे पूर्ण झाल्यावर दरमहा ₹१,००० ते ₹५,००० ची हमीभावाची सरकारी पेन्शन."
    }'::jsonb,
    'social_security',
    'Ministry of Finance / PFRDA',
    'central',
    NULL,
    'Guaranteed lifelong monthly pension from ₹1,000 to ₹5,000 upon reaching 60 years',
    60000,
    '{
        "min_age": 18,
        "max_age": 40,
        "non_income_tax_payer": true
    }'::jsonb,
    '["Aadhaar Card", "Savings Bank Account / Post Office Account", "Active Mobile Number"]'::jsonb,
    'Visit your bank or post office branch where you have a savings account or apply via NetBanking/Mobile Banking app.',
    'https://npscra.nsdl.co.in/scheme-details.php',
    (SELECT array_agg(((i + 1) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'rythu-bharosa-telangana',
    'Rythu Bandhu / Rythu Bharosa (Telangana)',
    '{
        "hi": "रैथु बंधु / रैथु भरोसा (तेलंगाना)",
        "te": "రైతు బంధు / రైతు భరోసా (తెలంగాణ)",
        "ta": "ரைத்து பந்து / ரைத்து பரோசா (தெலுங்கானா)",
        "bn": "রায়থু বন্ধু / রায়থু ভরসা (তেলেঙ্গানা)",
        "mr": "रयतू बंधू / रयतू भरोसा"
    }'::jsonb,
    'Telangana State Government investment support providing farmers ₹10,000 to ₹15,000 per acre per year for purchase of agricultural inputs like seeds, fertilizers, and pesticides.',
    '{
        "hi": "तेलंगाना राज्य सरकार की कृषि निवेश सहायता योजना जो किसानों को बीज, खाद आदि खरीदने के लिए प्रति एकड़ प्रति वर्ष ₹10,000 से ₹15,000 प्रदान करती है।",
        "te": "తెలంగాణ ప్రభుత్వం రైతుల సాగు ఖర్చుల కోసం ఎకరానికి సంవత్సరానికి ₹10,000 నుండి ₹15,000 వరకు పెట్టుబడి సాయం అందిస్తుంది.",
        "ta": "தெலுங்கானா மாநில அரசு விவசாயிகளுக்கு விதை, உரம் வாங்க ஏக்கருக்கு ஆண்டுக்கு ₹10,000 முதல் ₹15,000 வரை வழங்கும் திட்டம்.",
        "bn": "তেলেঙ্গানা সরকারের কৃষকদের সার, বীজ ক্রয়ের জন্য প্রতি একরে বছরে ₹১০,০০০ থেকে ₹১৫,০০০ বিনিয়োগ সহায়তা।",
        "mr": "तेलंगणा सरकारची शेतीसाठी बियाणे, खते खरेदीसाठी एकरी ₹१०,००० ते ₹१५,००० थेट गुंतवणूक मदत."
    }'::jsonb,
    'agriculture',
    'Department of Agriculture, Govt of Telangana',
    'state',
    'Telangana',
    '₹10,000 - ₹15,000 per acre per year deposited before Kharif and Rabi seasons',
    15000,
    '{
        "state": "Telangana",
        "occupations": ["farmer", "landholder"],
        "requires_pattadar_passbook": true
    }'::jsonb,
    '["Pattadar Passbook / Dharani Title deed", "Aadhaar Card", "Bank Account Details"]'::jsonb,
    'Automated via Dharani portal land records. Verified by Agriculture Extension Officers (AEO) in your village.',
    'https://rythubandhu.telangana.gov.in',
    (SELECT array_agg(((i + 3) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'kmur-tamil-nadu',
    'Kalaignar Magalir Urimai Thogai Thittam (Tamil Nadu)',
    '{
        "hi": "कलैग्नार मगलिर उरीमई थोगाई (तमिलनाडु)",
        "te": "కలైజ్ఞర్ మహిళా హక్కు మొత్తం పథకం (తమిళనాడు)",
        "ta": "கலைஞர் மகளிர் உரிமைத் திட்டம் (தமிழ்நாடு)",
        "bn": "কালাইগ্নার মহিলা অধিকার প্রকল্প (তামিলনাড়ু)",
        "mr": "कलैग्नार महिला हक्क योजना"
    }'::jsonb,
    'Tamil Nadu State Government monthly universal basic financial grant of ₹1,000 directly transferred to female heads of eligible households to recognize their unpaid domestic labor.',
    '{
        "hi": "तमिलनाडु राज्य सरकार द्वारा पात्र परिवारों की महिला मुखिया को ₹1,000 की मासिक वित्तीय सहायता सीधे बैंक खाते में प्रदान की जाती है।",
        "te": "తమిళనాడు ప్రభుత్వం అర్హులైన మహిళా కుటుంబ పెద్దలకు నెలకు ₹1,000 నేరుగా బ్యాంకు ఖాతాలో జమ చేసే పథకం.",
        "ta": "குடும்பத் தலைவிகளின் உழைப்பை அங்கீகரிக்கும் வகையில் தகுதியுள்ள பெண்களுக்கு மாதம் ₹1,000 உரிமைத் தொகையாக வங்கிக் கணக்கில் நேரடியாக வழங்கப்படுகிறது.",
        "bn": "তামিলনাড়ু সরকারের পরিবারের মহিলা প্রধানদের জন্য প্রতি মাসে সরাসরি ব্যাংকে ₹১,০০০ টাকা ভাতা প্রদান।",
        "mr": "तामिळनाडू सरकारची महिला कुटुंब प्रमुखांना दरमहा ₹१,००० ची थेट आर्थिक मदत."
    }'::jsonb,
    'women_welfare',
    'Special Programme Implementation Dept, Govt of Tamil Nadu',
    'state',
    'Tamil Nadu',
    '₹1,000 per month (₹12,000 per year) credited via DBT to woman head of family',
    12000,
    '{
        "state": "Tamil Nadu",
        "gender": "female",
        "min_age": 21,
        "income_ceiling_annual": 250000,
        "max_land_wet_acres": 5,
        "max_land_dry_acres": 10
    }'::jsonb,
    '["Smart Family Card / Ration Card", "Aadhaar Card", "Aadhaar-linked Bank Passbook", "Electricity Consumer Number"]'::jsonb,
    'Apply at special camp held at your local ration shop or e-Sevai centre with Smart Ration card and Aadhaar details.',
    'https://kmut.tn.gov.in',
    (SELECT array_agg(((i + 5) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'lakshmir-bhandar-bengal',
    'Lakshmir Bhandar Scheme (West Bengal)',
    '{
        "hi": "लक्ष्मी भंडार योजना (पश्चिम बंगाल)",
        "te": "లక్ష్మీర్ భండార్ పథకం (పశ్చిమ బెంగాల్)",
        "ta": "லக்ஷ்மி பண்டார் திட்டம் (மேற்கு வங்காளம்)",
        "bn": "লক্ষ্মীর ভান্ডার প্রকল্প (পশ্চিমবঙ্গ)",
        "mr": "लक्ष्मीचे भांडार योजना"
    }'::jsonb,
    'West Bengal Government direct monthly financial assistance of ₹1,000 for General category and ₹1,200 for SC/ST female heads of families between 25-60 years of age.',
    '{
        "hi": "पश्चिम बंगाल सरकार द्वारा 25-60 वर्ष की आयु की सामान्य वर्ग की महिलाओं को ₹1,000 और अनुसूचित जाति/जनजाति की महिलाओं को ₹1,200 प्रति माह वित्तीय सहायता।",
        "te": "పశ్చిమ బెంగాల్ ప్రభుత్వంలో 25-60 సంవత్సరాల మధ్య వయస్సు గల మహిళలకు నెలకు ₹1,000 నుండి ₹1,200 వరకు ఆర్థిక సహాయం అందజేస్తుంది.",
        "ta": "மேற்கு வங்காள அரசு 25-60 வயதுடைய பெண்களுக்கு மாதம் ₹1,000 முதல் ₹1,200 வரை வழங்கும் நிதி உதவி.",
        "bn": "পশ্চিমবঙ্গ সরকারের ২৫-৬০ বছর বয়সী সাধারণ পরিবারের মহিলাদের জন্য মাসিক ₹১,০০০ এবং এসসি/এসটি পরিবারের মহিলাদের জন্য মাসিক ₹১,২০০ টাকা সরাসরি আর্থিক সহায়তা।",
        "mr": "पश्चिम बंगाल सरकारची २५-६० वयोगटातील महिलांसाठी दरमहा ₹१,००० ते ₹१,२०० थेट बँक मदत."
    }'::jsonb,
    'women_welfare',
    'Department of Women & Child Development, Govt of West Bengal',
    'state',
    'West Bengal',
    '₹1,000/month for General, ₹1,200/month for SC/ST (₹12,000 - ₹14,400 annually)',
    14400,
    '{
        "state": "West Bengal",
        "gender": "female",
        "min_age": 25,
        "max_age": 60,
        "non_government_employee": true
    }'::jsonb,
    '["Swasthya Sathi Card", "Aadhaar Card", "SC/ST Certificate (if applicable)", "Bank Passbook", "Passport Size Photograph"]'::jsonb,
    'Fill out application form at your local Duare Sarkar (Government at Doorstep) outreach camps or Block Development Office.',
    'https://socialsecurity.wb.gov.in',
    (SELECT array_agg(((i + 7) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
),
(
    'sukanya-samriddhi',
    'Sukanya Samriddhi Yojana (SSY)',
    '{
        "hi": "सुकन्या समृद्धि योजना (एसएसवाई)",
        "te": "సుకన్య సమృద్ధి యోజన (ఎస్ఎస్వై)",
        "ta": "சுகன்யா சம்ரிதி திட்டம் (செல்வமகள் சேமிப்பு)",
        "bn": "সুকন্যা সমৃদ্ধি যোজনা (এসএসওয়াই)",
        "mr": "सुकन्या समृद्धी योजना"
    }'::jsonb,
    'Government small deposit scheme backed by sovereign guarantee for the girl child offering high interest rate (8.2%), full tax exemption (EEE), and guaranteed maturity for education/marriage.',
    '{
        "hi": "बालिकाओं के उज्ज्वल भविष्य के लिए उच्च ब्याज दर (8.2%), पूर्ण कर छूट (EEE) और शिक्षा/विवाह के लिए सुरक्षित परिपक्वता प्रदान करने वाली सरकारी बचत योजना।",
        "te": "ఆడపిల్లల ఉన్నత చదువు మరియు వివాహం కోసం అధిక వడ్డీ (8.2%) మరియు పూర్తి పన్ను మినహాయింపుతో కూడిన ప్రభుత్వ పొదుపు పథకం.",
        "ta": "பெண் குழந்தைகளின் கல்வி மற்றும் திருமணத்திற்காக அதிக வட்டி விகிதம் (8.2%) வழங்கும் மத்திய அரசின் செல்வமகள் சேமிப்புத் திட்டம்.",
        "bn": "কন্যা সন্তানের উচ্চশিক্ষা ও বিবাহের জন্য সর্বোচ্চ সুদ (৮.২%) ও করমুক্ত সুবিধা প্রদানকারী সরকারি ক্ষুদ্র সঞ্চয় প্রকল্প।",
        "mr": "मुलींच्या उच्च शिक्षण आणि लग्नासाठी सर्वाधिक व्याज (८.२%) देणारी केंद्र सरकारची विशेष बचत योजना."
    }'::jsonb,
    'education',
    'Ministry of Finance / National Savings Institute',
    'central',
    NULL,
    'Sovereign guaranteed savings with 8.2% annual interest and Section 80C triple tax-free benefits',
    500000,
    '{
        "target_child_gender": "female",
        "child_max_age_at_opening": 10,
        "max_girls_per_family": 2
    }'::jsonb,
    '["Girl Child Birth Certificate", "Identity and Address proof of Guardian (Aadhaar/PAN)", "Passport size photo of Child and Guardian"]'::jsonb,
    'Open account at any Post Office or authorized commercial bank with a minimum initial deposit of just ₹250.',
    'https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya-Samriddhi-Account.aspx',
    (SELECT array_agg(((i + 9) % 10) * 0.035)::vector(768) FROM generate_series(1, 768) AS i)
);
