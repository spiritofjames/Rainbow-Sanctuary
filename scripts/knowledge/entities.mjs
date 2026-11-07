const origin = 'https://rainbowsanctuary.life';

// Public profile facts from the About page. This is not a credential or
// clinical qualification claim; do not infer private biographical details.
export const stephanieSchema = {
  '@type': 'Person',
  '@id': `${origin}/about#stephanie-wu`,
  name: 'Stephanie Wu',
  url: `${origin}/about`,
  alternateName: 'Teacher Rongrong',
  jobTitle: 'Co-founder and lead facilitator',
  image: `${origin}/assets/stephanie-portrait.jpg`,
  affiliation: { '@id': `${origin}/#organization` },
  knowsAbout: ['Spiritual practice', 'Group facilitation', 'Integration into everyday life'],
};

// The editorial team is an organization, not an individual author. Keep this
// distinction shared by the Knowledge compiler and the discovery generator.
export function knowledgeContributorSchema(contributor) {
  if (contributor.id === 'rainbow-editorial') {
    return {
      '@type': 'Organization',
      '@id': `${origin}/#editorial-team`,
      name: contributor.name,
      parentOrganization: { '@id': `${origin}/#organization` },
    };
  }

  return {
    '@type': 'Person',
    ...(contributor.id === 'stephanie-wu' ? { '@id': stephanieSchema['@id'], url: stephanieSchema.url } : {}),
    name: contributor.name,
    jobTitle: contributor.role,
  };
}
