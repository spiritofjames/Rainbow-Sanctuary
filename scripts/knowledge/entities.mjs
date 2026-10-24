const origin = 'https://rainbowsanctuary.life';

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

  return { '@type': 'Person', name: contributor.name, jobTitle: contributor.role };
}
