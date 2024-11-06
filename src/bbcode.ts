import bbobHTML from '@bbob/html';
import presetHTML5 from '@bbob/preset-html5';
import Turndown from 'turndown';

export const toHtml = (bbcode: string) =>
  bbobHTML(
    bbcode
      .replaceAll('(:P)', '😜')
      .replaceAll('(td)', '👎')
      .replaceAll('(tu)', '👍')
      .replaceAll(':)-D', '🍻')
      .replaceAll('>:D<', '🤠')
      .replaceAll('(:D', '😄')
      .replaceAll('8-)', '🙄')
      .replaceAll(':)o', '🙂')
      .replaceAll('::o', '😲')
      .replaceAll('B)-', '😆')
      .replaceAll(':(', '☹️')
      .replaceAll(':)', '😃')
      .replaceAll(':?', '😵‍💫')
      .replaceAll(':D', '😁')
      .replaceAll(':P', '😛')
      .replaceAll(':S', '🤔')
      .replaceAll(':X', '🤬')
      .replaceAll(':o', '😡')
      .replaceAll(';)', '😉')
      .replaceAll('B)', '😎')
      .replaceAll('X(', '🙃'),
    presetHTML5()
  );

export const toMd = (html: string) => {
  const turndown = new Turndown({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    bulletListMarker: '-',
    hr: '---',
  });
  return turndown.turndown(html);
}