import { z } from "zod";

const evidenceClaim = z.object({ value: z.string().trim().min(1).max(500), evidence: z.string().trim().min(1).max(1000) }).strict();
export const extractedCvProfileSchema = z.object({
  name: evidenceClaim.nullable(),
  headline: evidenceClaim.nullable(),
  skills: z.array(evidenceClaim).max(100),
  experience: z.array(z.object({ role: z.string().trim().min(1).max(200), company: z.string().trim().min(1).max(200), evidence: z.string().trim().min(1).max(1000) }).strict()).max(50),
  education: z.array(z.object({ qualification: z.string().trim().min(1).max(200), institution: z.string().trim().min(1).max(200), evidence: z.string().trim().min(1).max(1000) }).strict()).max(30),
}).strict();
export type ExtractedCvProfile = z.infer<typeof extractedCvProfileSchema>;

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en");
export function keepEvidenceBoundClaims(profile: ExtractedCvProfile, sourceText: string): ExtractedCvProfile {
  const source = normalize(sourceText);
  const supported = (evidence: string) => source.includes(normalize(evidence));
  const contains = (evidence: string, value: string) => normalize(evidence).includes(normalize(value));
  return {
    name: profile.name && supported(profile.name.evidence) && contains(profile.name.evidence, profile.name.value) ? profile.name : null,
    headline: profile.headline && supported(profile.headline.evidence) && contains(profile.headline.evidence, profile.headline.value) ? profile.headline : null,
    skills: profile.skills.filter(item => supported(item.evidence) && contains(item.evidence, item.value)),
    experience: profile.experience.filter(item => supported(item.evidence) && contains(item.evidence, item.role) && contains(item.evidence, item.company)),
    education: profile.education.filter(item => supported(item.evidence) && contains(item.evidence, item.qualification) && contains(item.evidence, item.institution)),
  };
}
