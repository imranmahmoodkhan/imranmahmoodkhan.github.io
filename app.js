(() => {
  'use strict';
  const papers = window.PUBLICATIONS || [];
  const $ = id => document.getElementById(id);
  const list = $('publication-list');
  const search = $('paper-search');
  const topic = $('topic-filter');
  const year = $('year-filter');
  const dialog = $('citation-dialog');
  let mode = 'selected';
  let currentPaper = null;
  let currentCitation = '';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const authorIsImran = name => /imran.*mahmood|mahmood.*khan|khan.*imran/i.test(name);
  const journalShort = {
    'Sensors and Actuators B: Chemical':'Sens. Actuators B',
    'TrAC Trends in Analytical Chemistry':'TrAC',
    'TrAC - Trends in Analytical Chemistry':'TrAC',
    'Journal of Agricultural and Food Chemistry':'J. Agric. Food Chem.',
    'Coordination Chemistry Reviews':'Coord. Chem. Rev.',
    'Trends in Food Science & Technology':'Trends Food Sci. Technol.',
    'International Journal of Biological Macromolecules':'Int. J. Biol. Macromol.',
    'Comprehensive Reviews in Food Science and Food Safety':'Compr. Rev. Food Sci. Food Saf.',
    'Analytical and Bioanalytical Chemistry':'Anal. Bioanal. Chem.',
    'Critical Reviews in Food Science and Nutrition':'Crit. Rev. Food Sci. Nutr.',
    'Spectrochimica Acta Part A: Molecular and Biomolecular Spectroscopy':'Spectrochim. Acta A',
    'Colloids and Surfaces A: Physicochemical and Engineering Aspects':'Colloids Surf. A',
    'Colloids and Surfaces B: Biointerfaces':'Colloids Surf. B',
    'Journal of Photochemistry and Photobiology A: Chemistry':'J. Photochem. Photobiol. A',
    'International Journal of Food Science & Technology':'Int. J. Food Sci. Technol.',
    'International Journal of Food Science and Technology':'Int. J. Food Sci. Technol.',
    'Advances in Colloid and Interface Science':'Adv. Colloid Interface Sci.',
    'Journal of Global Innovations in Agricultural Sciences':'J. Glob. Innov. Agric. Sci.'
  };
  function authors(paper) {
    if (!paper.authors?.length) return escape(paper.authorsText);
    return paper.authors.map(name => authorIsImran(name) ? '<strong>'+escape(name)+'</strong>' : escape(name)).join(', ');
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = papers.filter(paper =>
      (mode === 'all' || paper.selected) &&
      (!topic.value || paper.topic === topic.value) &&
      (!year.value || String(paper.year) === year.value) &&
      (!query || [paper.title, paper.journal, paper.topic, paper.doi, ...(paper.authors || [])].join(' ').toLocaleLowerCase().includes(query))
    );
    const total = papers.filter(paper => mode === 'all' || paper.selected).length;
    $('publication-count').textContent = `${filtered.length} of ${total} ${mode === 'selected' ? 'selected papers' : 'listed papers'} · newest first`;
    $('empty-state').hidden = filtered.length !== 0;
    $('reset-filters').hidden = !query && !topic.value && !year.value;
    list.innerHTML = filtered.map(paper => {
      const figure = paper.image ? `<a class="paper-figure" href="${escape(paper.url)}" target="_blank" rel="noopener noreferrer" aria-label="Read ${escape(paper.title)}"><img src="${escape(paper.image)}" alt="${escape(paper.imageKind || 'Publication figure')}: ${escape(paper.title)}" width="206" height="138" loading="lazy" decoding="async"></a>` : '';
      const summary = paper.summary && mode === 'selected' ? `<p class="paper-summary"><span>FOCUS</span>${escape(paper.summary)}</p>` : '';
      return `<article class="publication-card${paper.image ? '' : ' compact'}">${figure}<div class="paper-content"><h3 class="paper-title"><a href="${escape(paper.url)}" target="_blank" rel="noopener noreferrer">${escape(paper.title)}</a></h3><p class="paper-authors">${authors(paper)}</p><div class="paper-footer"><div class="paper-links"><a href="${escape(paper.url)}" target="_blank" rel="noopener noreferrer" title="Article on ${escape(paper.publisher)}">Paper ↗</a><a href="https://doi.org/${escape(paper.doi)}" target="_blank" rel="noopener noreferrer">DOI</a><button type="button" data-citation="${escape(paper.doi)}" aria-label="BibTeX citation for ${escape(paper.title)}">BibTeX</button></div><span class="journal-badge" title="${escape(paper.journal)}">${escape(journalShort[paper.journal] || paper.journal)} · ${paper.year}</span></div>${summary}</div></article>`;
    }).join('');
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === mode)));
  }
  function reset() { search.value=''; topic.value=''; year.value=''; render(); }
  [...new Set(papers.map(paper=>paper.year))].sort((a,b)=>b-a).forEach(value=>year.add(new Option(value,value)));
  search.addEventListener('input',render);
  topic.addEventListener('change',render);
  year.addEventListener('change',render);
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;render();}));
  $('reset-filters').addEventListener('click',reset);
  $('empty-reset').addEventListener('click',reset);
  const bibValue = value => String(value || '').replace(/[\\{}]/g,c=>'\\'+c).replace(/&/g,'\\&');
  function bibtex(paper) {
    const key = (paper.authors?.[0]?.split(' ').pop() || 'Khan').replace(/[^a-zA-Z]/g,'')+paper.year+paper.doi.split('/').pop().replace(/[^a-zA-Z0-9]/g,'').slice(-12);
    const fields = [['title',paper.title],['author',(paper.authors || []).join(' and ') || paper.authorsText],['journal',paper.journal],['year',paper.year],['volume',paper.volume],['pages',paper.pages],['doi',paper.doi],['url',paper.url]].filter(([,value])=>value);
    return '@article{'+key+',\n'+fields.map(([name,value])=>'  '+name+' = {'+bibValue(value)+'}').join(',\n')+'\n}';
  }
  list.addEventListener('click',event=>{
    const button = event.target.closest('[data-citation]');
    if(!button) return;
    currentPaper = papers.find(paper=>paper.doi===button.dataset.citation);
    currentCitation = bibtex(currentPaper);
    $('citation-text').textContent = currentCitation;
    $('copy-status').textContent = '';
    $('copy-citation').textContent = 'Copy citation';
    dialog.showModal();
  });
  $('close-citation').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom)dialog.close();}});
  $('copy-citation').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(currentCitation);$('copy-citation').textContent='Copied';$('copy-status').textContent='Citation copied.';}
    catch{const range=document.createRange();range.selectNodeContents($('citation-text'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('copy-status').textContent='Text selected. Press Ctrl+C / ⌘C to copy.';}
  });
  $('download-citation').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([currentCitation+'\n'],{type:'application/x-bibtex;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=currentPaper.doi.replace(/[^a-zA-Z0-9.-]/g,'_')+'.bib';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const navLinks=[...document.querySelectorAll('.nav-links a')];
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const entry=entries.find(item=>item.isIntersecting);if(entry)navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id));},{rootMargin:'-80px 0px -65% 0px',threshold:0});document.querySelectorAll('main>section').forEach(section=>observer.observe(section));}
  $('copyright-year').textContent = new Date().getFullYear();
  render();
})();
