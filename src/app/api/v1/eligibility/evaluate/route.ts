import { NextRequest, NextResponse } from 'next/server';
import {
  EligibilityEvaluateRequestSchema,
  EligibilityEvaluateResponseSchema,
  EligibleSchemeItem,
} from '@/lib/schemas';
import { getAllSchemes, getAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = EligibilityEvaluateRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid citizen demographic profile', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const profile = parsed.data;

    // Fetch live active schemes from Supabase database
    const schemes = await getAllSchemes();

    const eligible: EligibleSchemeItem[] = [];
    const partiallyEligible: EligibleSchemeItem[] = [];
    const ineligible: EligibleSchemeItem[] = [];

    let totalBenefit = 0;

    for (const s of schemes) {
      const criteria = s.eligibility_criteria || {};
      const reasons: string[] = [];
      const missingCriteria: string[] = [];
      let isMismatch = false;

      // 1. State Level Check
      if (s.level === 'state' && s.state) {
        if (profile.state.toLowerCase() !== s.state.toLowerCase()) {
          ineligible.push({
            schemeId: s.id,
            slug: s.slug,
            title: s.title,
            titleVernacular: s.title_translations?.['hi'] || s.title,
            description: s.description,
            category: s.category,
            financialBenefit: s.financial_benefit,
            financialBenefitAmount: Number(s.financial_benefit_amount) || 0,
            matchConfidence: 0.1,
            reasons: [`State specific scheme limited to residents of ${s.state}.`],
            missingCriteria: [`Domicile of ${s.state}`],
            requiredDocuments: s.required_documents || [],
            applicationProcess: s.application_process,
            officialUrl: s.official_url,
          });
          continue;
        } else {
          reasons.push(`Resident of eligible State: ${s.state}`);
        }
      }

      // 2. Gender Criteria
      if (criteria.gender) {
        if (criteria.gender !== profile.gender) {
          isMismatch = true;
          missingCriteria.push(`Scheme specifically targets ${criteria.gender} beneficiaries.`);
        } else {
          reasons.push(`Target gender matched (${profile.gender})`);
        }
      }

      // 3. Age Criteria
      if (criteria.min_age !== undefined && profile.age < criteria.min_age) {
        isMismatch = true;
        missingCriteria.push(`Minimum age required is ${criteria.min_age} (Applicant is ${profile.age})`);
      }
      if (criteria.max_age !== undefined && profile.age > criteria.max_age) {
        isMismatch = true;
        missingCriteria.push(`Maximum age limit is ${criteria.max_age} (Applicant is ${profile.age})`);
      }
      if (!isMismatch && (criteria.min_age !== undefined || criteria.max_age !== undefined)) {
        reasons.push(`Age eligibility verified (${profile.age} years)`);
      }

      // 4. Income Ceiling
      if (criteria.income_ceiling_annual !== undefined) {
        if (profile.annualIncome > criteria.income_ceiling_annual) {
          isMismatch = true;
          missingCriteria.push(`Annual income exceeds ceiling of ₹${criteria.income_ceiling_annual.toLocaleString('en-IN')}`);
        } else {
          reasons.push(`Income within ceiling (₹${profile.annualIncome.toLocaleString('en-IN')})`);
        }
      }

      // 5. Land Holding Ceiling
      if (criteria.max_land_acres !== undefined) {
        if (profile.landHoldingAcres > criteria.max_land_acres) {
          isMismatch = true;
          missingCriteria.push(`Land holding exceeds ceiling of ${criteria.max_land_acres} acres`);
        } else if (criteria.requires_land_ownership && profile.landHoldingAcres <= 0) {
          missingCriteria.push('Requires verified agricultural land ownership (Khatauni/Passbook)');
        } else {
          reasons.push(`Land holding verified (${profile.landHoldingAcres} acres)`);
        }
      }

      // 6. Occupation match
      if (criteria.occupations && Array.isArray(criteria.occupations)) {
        if (!criteria.occupations.includes(profile.occupation)) {
          if (profile.occupation === 'farmer' && criteria.occupations.includes('cultivator')) {
            reasons.push('Occupation verified: Farmer / Cultivator');
          } else {
            missingCriteria.push(`Targeted towards: ${criteria.occupations.join(', ')}`);
          }
        } else {
          reasons.push(`Occupation matches: ${profile.occupation}`);
        }
      }

      // 7. Housing Status Check
      if (criteria.housing_status && Array.isArray(criteria.housing_status)) {
        if (!criteria.housing_status.includes(profile.housingType)) {
          missingCriteria.push(`Requires housing status: ${criteria.housing_status.join(' or ')}`);
        } else {
          reasons.push(`Housing status qualifies (${profile.housingType})`);
        }
      }

      const item: EligibleSchemeItem = {
        schemeId: s.id,
        slug: s.slug,
        title: s.title,
        titleVernacular: s.title_translations?.['hi'] || s.title,
        description: s.description,
        category: s.category,
        financialBenefit: s.financial_benefit,
        financialBenefitAmount: Number(s.financial_benefit_amount) || 0,
        matchConfidence: missingCriteria.length === 0 ? 0.95 : 0.65,
        reasons: reasons.length > 0 ? reasons : ['General public welfare benefit'],
        missingCriteria: missingCriteria.length > 0 ? missingCriteria : undefined,
        requiredDocuments: s.required_documents || [],
        applicationProcess: s.application_process,
        officialUrl: s.official_url,
      };

      if (missingCriteria.length === 0) {
        eligible.push(item);
        totalBenefit += Number(s.financial_benefit_amount) || 0;
      } else if (missingCriteria.length <= 2 && !isMismatch) {
        partiallyEligible.push(item);
      } else {
        ineligible.push(item);
      }
    }

    // Save evaluation to database
    try {
      const admin = getAdminClient();
      await admin.from('eligibility_evaluations').insert({
        session_id: profile.sessionId,
        input_profile: profile,
        eligible_schemes: eligible,
        partially_eligible_schemes: partiallyEligible,
        ineligible_schemes: ineligible,
        total_potential_benefit: totalBenefit,
      });
    } catch (dbErr: any) {
      console.warn('Saving evaluation record to Supabase failed non-fatally:', dbErr.message);
    }

    const responsePayload = {
      eligible,
      partiallyEligible,
      ineligible,
      totalAnnualFinancialBenefit: totalBenefit,
      evaluatedAt: new Date().toISOString(),
    };

    const validatedResponse = EligibilityEvaluateResponseSchema.parse(responsePayload);
    return NextResponse.json(validatedResponse);
  } catch (error: any) {
    console.error('Error in /api/v1/eligibility/evaluate:', error);
    return NextResponse.json(
      { error: 'Internal server error while evaluating eligibility', message: error.message },
      { status: 500 }
    );
  }
}
