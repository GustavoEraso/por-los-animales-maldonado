import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSectionsFromLegacyContent,
  cleanSponsorSections,
  createBadgeBlock,
  createButtonBlock,
  createDescriptionBlock,
  createGroupBlock,
  createTitleBlock,
  duplicateSponsorBlock,
  duplicateSponsorSection,
  normalizeSponsorSections,
  validateSponsorSections,
} from '../src/app/plam-admin/sponsors/components/sponsorSections';
import {
  countSponsorSectionBlocks,
  countSponsorSectionButtons,
  hasSponsorBlockContent,
  hasSponsorSectionContent,
} from '../src/lib/sponsorCard';
import {
  buildWhatsAppHref,
  normalizeWhatsAppNumber,
  resolveSponsorHref,
} from '../src/lib/sponsorLink';
import type { SponsorButtonBlock, SponsorSection, SponsorType } from '../src/types';

const sectionWith = (blocks: SponsorSection['blocks'] = []): SponsorSection => ({
  id: 'section-1',
  blocks,
});

const button = (label: string, href: string): SponsorButtonBlock => ({
  ...createButtonBlock(),
  label,
  href,
});

test('normalizes WhatsApp numbers', () => {
  assert.equal(normalizeWhatsAppNumber('099 123 456'), '99123456');
  assert.equal(normalizeWhatsAppNumber('598 99 123 456'), '99123456');
  assert.equal(normalizeWhatsAppNumber('+598 099-123-456'), '99123456');
  assert.equal(normalizeWhatsAppNumber(''), '');
});

test('builds WhatsApp URLs with the Uruguayan country code', () => {
  assert.equal(buildWhatsAppHref('099 123 456'), 'https://wa.me/59899123456');
  assert.equal(buildWhatsAppHref(''), 'https://wa.me/598');
});

test('resolves the effective sponsor href', () => {
  assert.equal(
    resolveSponsorHref({ linkType: 'url', href: ' https://example.com ' }),
    'https://example.com'
  );
  assert.equal(
    resolveSponsorHref({
      linkType: 'whatsapp',
      whatsappNumber: '099123456',
      href: 'https://old.example.com',
    }),
    'https://wa.me/59899123456'
  );
  assert.equal(resolveSponsorHref({ linkType: 'whatsapp', whatsappNumber: '' }), '');
});

test('detects block content', () => {
  assert.equal(hasSponsorBlockContent(createTitleBlock()), false);
  assert.equal(hasSponsorBlockContent({ ...createTitleBlock(), text: 'Hola' }), true);
  assert.equal(hasSponsorBlockContent(button('Donar', 'https://example.com')), true);
  assert.equal(hasSponsorBlockContent(button('Donar', '')), false);

  const emptyGroup = createGroupBlock();
  assert.equal(hasSponsorBlockContent(emptyGroup), false);
  assert.equal(
    hasSponsorBlockContent({
      ...emptyGroup,
      blocks: [{ ...createTitleBlock(), text: 'Hola' }],
    }),
    true
  );
});

test('counts section blocks and buttons including groups', () => {
  const group = {
    ...createGroupBlock(),
    blocks: [
      { ...createDescriptionBlock(), text: 'Texto' },
      button('Donar', 'https://example.com'),
    ],
  };
  const section = sectionWith([{ ...createTitleBlock(), text: 'Título' }, group]);

  assert.equal(countSponsorSectionBlocks(section), 4);
  assert.equal(countSponsorSectionButtons(section), 1);
});

test('detects section content from blocks and legacy fields', () => {
  assert.equal(hasSponsorSectionContent(sectionWith([])), false);
  assert.equal(
    hasSponsorSectionContent(sectionWith([{ ...createTitleBlock(), text: 'Hola' }])),
    true
  );
  assert.equal(hasSponsorSectionContent({ id: 'legacy', description: 'Texto' }), true);
  assert.equal(hasSponsorSectionContent({ id: 'legacy', title: 'Título' }), true);
});

test('validates empty and valid sections', () => {
  assert.equal(validateSponsorSections([]), null);
  assert.match(validateSponsorSections([sectionWith([])]) ?? '', /está vacía/);
  assert.equal(
    validateSponsorSections([sectionWith([{ ...createTitleBlock(), text: 'Hola' }])]),
    null
  );
});

test('rejects empty blocks and groups', () => {
  assert.match(validateSponsorSections([sectionWith([createTitleBlock()])]) ?? '', /está vacío/);
  assert.match(validateSponsorSections([sectionWith([createGroupBlock()])]) ?? '', /grupo.*vacío/);
});

test('validates buttons and WhatsApp links', () => {
  assert.match(
    validateSponsorSections([sectionWith([button('Donar', '')])]) ?? '',
    /no tiene link/
  );

  const missingNumber: SponsorButtonBlock = {
    ...button('Donar', ''),
    linkType: 'whatsapp',
    whatsappNumber: '',
  };
  assert.match(
    validateSponsorSections([sectionWith([missingNumber])]) ?? '',
    /no tiene número de WhatsApp/
  );

  assert.match(
    validateSponsorSections([sectionWith([button('', 'https://example.com')])]) ?? '',
    /sin texto/
  );
});

test('enforces block and button limits', () => {
  const manyTitles = Array.from({ length: 11 }, () => ({
    ...createTitleBlock(),
    text: 'Hola',
  }));
  assert.match(validateSponsorSections([sectionWith(manyTitles)]) ?? '', /hasta 10 elementos/);

  const manyButtons = Array.from({ length: 5 }, (_, index) =>
    button(`Donar ${index}`, 'https://example.com')
  );
  assert.match(validateSponsorSections([sectionWith(manyButtons)]) ?? '', /hasta 4 botones/);
});

test('migrates legacy section fields into blocks', () => {
  const legacy: SponsorSection = {
    id: 'legacy-section',
    title: 'Cómo ayudar',
    badge: '1 compra = 1 kg',
    description: 'Texto',
    highlight: true,
    buttons: [{ ...button('Donar', 'https://example.com'), id: 'legacy-button' }],
  };

  const [normalized] = normalizeSponsorSections([legacy]);
  assert.equal(normalized.blocks?.length, 2);
  assert.equal(normalized.blocks?.[0]?.type, 'title');

  const group = normalized.blocks?.[1];
  assert.equal(group?.type, 'group');
  if (group?.type === 'group') {
    assert.equal(group.highlight, true);
    assert.equal(group.blocks.length, 3);
    assert.equal(group.blocks[2]?.type, 'button');
  }

  assert.equal(normalized.highlight, false);
});

test('migrates the legacy sponsor description into a section', () => {
  const sponsor: SponsorType = {
    id: 'sponsor-1',
    name: 'Sponsor',
    description: 'Texto legacy',
    href: 'https://example.com',
    linkLabel: 'Ver más',
    image: { imgId: 'img', imgUrl: '/logo.webp', imgAlt: 'Logo' },
  };

  const sections = buildSectionsFromLegacyContent(sponsor);
  assert.equal(sections.length, 1);
  assert.equal(sections[0]?.blocks?.length, 2);

  const group = sections[0]?.blocks?.[0];
  assert.equal(group?.type, 'group');
  if (group?.type === 'group') {
    assert.equal(group.blocks[0]?.type, 'description');
  }

  assert.equal(sections[0]?.blocks?.[1]?.type, 'button');
});

test('cleans blocks and resolves links before saving', () => {
  const section: SponsorSection = {
    id: 'section-1',
    blocks: [
      { ...createTitleBlock(), text: '  Título  ' },
      {
        ...button('  Donar  ', ' https://example.com '),
        linkType: 'whatsapp',
        whatsappNumber: '099 123 456',
        href: 'https://old.example.com',
      },
      { ...createBadgeBlock(), text: '  Etiqueta  ', highlightTone: 'amber' },
    ],
  };

  const [cleaned] = cleanSponsorSections([section]);
  assert.equal(cleaned.title, '');
  assert.equal(cleaned.buttons?.length, 0);

  const title = cleaned.blocks?.[0];
  assert.equal(title?.type, 'title');
  if (title?.type === 'title') {
    assert.equal(title.text, 'Título');
  }

  const buttonBlock = cleaned.blocks?.[1];
  assert.equal(buttonBlock?.type, 'button');
  if (buttonBlock?.type === 'button') {
    assert.equal(buttonBlock.label, 'Donar');
    assert.equal(buttonBlock.href, 'https://wa.me/59899123456');
    assert.equal(buttonBlock.whatsappNumber, '99123456');
  }

  const badge = cleaned.blocks?.[2];
  assert.equal(badge?.type, 'badge');
  if (badge?.type === 'badge') {
    assert.equal(badge.highlightTone, 'amber');
  }
});

test('duplicates sections and blocks with new identifiers', () => {
  const original = sectionWith([
    { ...createTitleBlock(), text: 'Título' },
    {
      ...createGroupBlock(),
      blocks: [
        { ...createDescriptionBlock(), text: 'Texto' },
        button('Donar', 'https://example.com'),
      ],
    },
  ]);

  const copy = duplicateSponsorSection(original);
  assert.notEqual(copy.id, original.id);
  assert.equal(copy.blocks?.length, 2);
  assert.notEqual(copy.blocks?.[0]?.id, original.blocks?.[0]?.id);

  const originalGroup = original.blocks?.[1];
  const copyGroup = copy.blocks?.[1];
  assert.equal(copyGroup?.type, 'group');
  if (copyGroup?.type === 'group' && originalGroup?.type === 'group') {
    assert.notEqual(copyGroup.id, originalGroup.id);
    assert.equal(copyGroup.blocks.length, originalGroup.blocks.length);
    copyGroup.blocks.forEach((child, index) => {
      assert.notEqual(child.id, originalGroup.blocks[index]?.id);
    });
  }
});

test('duplicates a single button with a new id', () => {
  const original = button('Donar', 'https://example.com');
  const copy = duplicateSponsorBlock(original);

  assert.equal(copy.type, 'button');
  if (copy.type === 'button') {
    assert.notEqual(copy.id, original.id);
    assert.equal(copy.label, original.label);
    assert.equal(copy.href, original.href);
  }
});
