import { SECTIONS, actions, type SectionId } from './store';

/** Hash router (#/about, #/sculptures/2 …) so sections are linkable and Back works. */
export function parseHash(hash = location.hash): { section: SectionId; sculpture: number | null } {
  const [, a, b] = hash.replace(/^#/, '').split('/');
  const section = (SECTIONS.find((s) => s.id === a)?.id ?? 'entrance') as SectionId;
  const n = b !== undefined ? Number(b) : NaN;
  return { section, sculpture: section === 'sculptures' && Number.isInteger(n) ? n : null };
}

export function navigate(section: SectionId, sculpture: number | null = null) {
  const hash = section === 'entrance' ? '#/' : `#/${section}${sculpture !== null ? `/${sculpture}` : ''}`;
  if (location.hash !== hash) location.hash = hash;
}

export function startRouter(onChange: (section: SectionId, sculpture: number | null) => void) {
  const apply = () => {
    const { section, sculpture } = parseHash();
    actions.setSection(section);
    onChange(section, sculpture);
  };
  window.addEventListener('hashchange', apply);
  apply();
  return () => window.removeEventListener('hashchange', apply);
}
