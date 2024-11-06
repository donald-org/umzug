import md5 from 'md5';
import { Marked } from 'marked';
import markedAlert from 'marked-alert';
import { markedEmoji } from 'marked-emoji';
import markedFootnote from 'marked-footnote';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { mangle as markedMangle } from 'marked-mangle';
import { gfmHeadingId as markedGfmHeadingId } from 'marked-gfm-heading-id';
import * as xss from 'xss';
import { Info, Lightbulb, MessageCircleWarning, TriangleAlert, OctagonAlert } from 'lucide-static';
import emojis from '../data/emojis.json'; // übrigens schön von @donald-org/website geklaut

const marked = new Marked({ gfm: true });

marked.use(
	markedAlert({
		variants: [
			{
				type: 'note',
				icon: Info,
				title: 'Anmerkung'
			},
			{
				type: 'tip',
				icon: Lightbulb,
				title: 'Tipp'
			},
			{
				type: 'important',
				icon: MessageCircleWarning,
				title: 'Wichtig'
			},
			{
				type: 'warning',
				icon: TriangleAlert,
				title: 'Warnung'
			},
			{
				type: 'caution',
				icon: OctagonAlert,
				title: 'Vorsicht'
			}
		]
	})
);

marked.use(
	markedEmoji({
		emojis,
		renderer: (token) => {
			if (token.emoji.startsWith('http'))
				return `<img alt="${token.name}" src="${token.emoji}" class="marked-emoji-img">`;
			return `<span class="marked-emoji">${token.emoji}</span>`;
		}
	})
);

marked.use(
	markedFootnote({
		description: 'Fußnoten'
	})
);

marked.use(
	markedHighlight({
		highlight: (code, lang) => {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	})
);

marked.use(markedMangle());

marked.use(markedGfmHeadingId());

const hexToBase64Url = (hexString: string): string => {
	const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);
	const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
	return base64.replace(/=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
};

const urlCleanup = (url: string): string => {
	try {
		const urlObj = new URL(url);
		return urlObj.href;
	} catch {
		return 'https://donald.org/';
	}
};

const urlCode = (url: string): string => hexToBase64Url(md5(urlCleanup(url)));

const htmlUrlFilter = (html: string) => {
	const urls: { hash: string, url: string }[] = [];
	html = html.replace(/href="(http[^"]+)"/g, (match, url: string) => {
		if (url.match(/.*\/\/[A-Za-z0-9]*.?donald\.org\//)) return `href="${url}"`;
		const hash = urlCode(url);
		urls.push({ hash, url });
		return `href="/linkout?id=${hash}"`;
	});
	const images: { hash: string, url: string }[] = [];
	html = html.replace(/src="(http[^"]+)"/g, (match, url: string) => {
		if (url.match(/.*\/\/[A-Za-z0-9]*.?donald\.org\//)) return `src="${url}"`;
		const hash = urlCode(url);
		images.push({ hash, url });
		return `src="https://cdn.donald.org/user-images/${hash}.webp"`;
	});
	return { html, urls, images };
};

export const toHtml = (md: string) => {
	const html = marked.parse(md) as unknown as string;
	const sanitized = xss.default(html, {
		whiteList: {
			h1: ['id', 'class'],
			h2: ['id', 'class'],
			h3: ['id', 'class'],
			h4: ['id', 'class'],
			h5: ['id', 'class'],
			h6: ['id', 'class'],
			p: ['id', 'class'],
			a: ['href', 'id', 'class', 'data-footnote-backref'],
			img: ['src', 'alt', 'class'],
			code: [],
			pre: [],
			blockquote: [],
			div: ['class'],
			span: ['class'],
			sup: [],
			sub: [],
			hr: [],
			svg: [
				'xmlns',
				'viewBox',
				'fill',
				'width',
				'height',
				'class',
				'stroke',
				'stroke-width',
				'stroke-linecap',
				'stroke-linejoin',
				'stroke-dasharray',
				'stroke-dashoffset',
				'stroke-opacity'
			],
			circle: ['cx', 'cy', 'r', 'fill'],
			path: ['d', 'fill'],
			section: ['class', 'data-footnotes'],
			ol: [],
			li: ['id'],
			input: ['type', 'checked', 'disabled'],
			ul: [],
			strong: [],
			em: [],
			del: [],
			table: [],
			thead: [],
			tr: [],
			th: [],
			tbody: [],
			td: [],
			tfoot: [],
			br: [],
		}
	});
	const urlFiltered = htmlUrlFilter(sanitized);
	return urlFiltered;
};